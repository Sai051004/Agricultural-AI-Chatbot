"""Farmer Support Chatbot backend.

This module powers the real-time assistant by serving a Socket.IO endpoint
that understands farmer intents, performs language translation, and returns
context-aware responses. The implementation adds defensive checks, health
metadata, and richer telemetry so the frontend can provide a polished UX.
"""

from __future__ import annotations

import json
import logging
import pickle
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

import nltk

nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')

import numpy as np
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from googletrans import Translator
from keras.models import load_model    # pyright: ignore[reportMissingImports]
from nltk.stem import WordNetLemmatizer

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.h5"
INTENTS_PATH = BASE_DIR / "intents.json"
WORDS_PATH = BASE_DIR / "word.pkl"
CLASSES_PATH = BASE_DIR / "class.pkl"

SUPPORTED_LANGUAGES = {"en", "kn", "hi", "te", "ml", "ta"}
DEFAULT_LANGUAGE = "en"
DEFAULT_RESPONSE = (
    "I'm not certain about that yet. Could you rephrase the question or give me "
    "a little more detail?"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
LOGGER = logging.getLogger("farmer-support-chatbot")


def _ensure_nltk_models() -> None:
    """Download required NLTK assets if they are missing."""
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        LOGGER.info("Downloading NLTK punkt tokenizer…")
        nltk.download("punkt")  # type: ignore[arg-type]


_ensure_nltk_models()

lemma = WordNetLemmatizer()
translator = Translator()

model = load_model(str(MODEL_PATH))
intents: Dict[str, Any] = json.loads(INTENTS_PATH.read_text(encoding="utf-8"))
words: List[str] = pickle.load(WORDS_PATH.open("rb"))
classes: List[str] = pickle.load(CLASSES_PATH.open("rb"))


def clean_up_sentence(sentence: str) -> List[str]:
    """Tokenize and lemmatize the incoming sentence."""
    sentence_words = nltk.word_tokenize(sentence)
    return [lemma.lemmatize(word.lower()) for word in sentence_words]


def bow(sentence: str, known_words: List[str]) -> np.ndarray:
    """Create a bag-of-words representation for the sentence."""
    sentence_words = clean_up_sentence(sentence)
    bag = np.zeros(len(known_words), dtype=np.float32)
    for sentence_word in sentence_words:
        for idx, known_word in enumerate(known_words):
            if known_word == sentence_word:
                bag[idx] = 1
    return bag


def predict_class(sentence: str) -> List[Dict[str, str]]:
    """Predict the most likely intents for a sentence."""
    encoded_sentence = bow(sentence, words)
    probabilities = model.predict(np.array([encoded_sentence]), verbose=0)[0]
    error_threshold = 0.25
    filtered_results = [
        (idx, probability)
        for idx, probability in enumerate(probabilities)
        if probability > error_threshold
    ]
    filtered_results.sort(key=lambda item: item[1], reverse=True)
    return [{"intent": classes[idx], "probability": str(probability)} for idx, probability in filtered_results]


def pick_response(intents_ranked: List[Dict[str, str]]) -> Tuple[str, str]:
    """Return a response string and the winning intent tag."""
    if not intents_ranked:
        return DEFAULT_RESPONSE, ""

    winning_intent = intents_ranked[0]["intent"]
    for intent in intents["intents"]:
        if intent["tag"] == winning_intent:
            return np.random.choice(intent["responses"]), winning_intent  # type: ignore[arg-type]
    return DEFAULT_RESPONSE, ""


def safe_translate(message: str, source_language: str, target_language: str) -> str:
    """Translate a message, falling back to the original text if translation fails."""
    if not message:
        return ""

    try:
        translated = translator.translate(message, src=source_language, dest=target_language)
        return translated.text
    except Exception as exc:  # pylint: disable=broad-except
        LOGGER.warning(
            "Translation failed (%s -> %s): %s",
            source_language,
            target_language,
            exc,
        )
        return message


def chatbot_response(message: str, source_language: str) -> Tuple[str, str]:
    """Return the assistant response translated back to the source language."""
    translated_message = safe_translate(message, source_language, DEFAULT_LANGUAGE)
    predicted_intents = predict_class(translated_message)
    english_response, top_intent = pick_response(predicted_intents)
    localized_response = safe_translate(english_response, DEFAULT_LANGUAGE, source_language)
    return localized_response, top_intent


def normalize_language(code: str | None) -> str:
    """Ensure we only operate on supported languages."""
    normalized = (code or DEFAULT_LANGUAGE).lower()
    return normalized if normalized in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def build_socket_payload(text: str, language: str, intent: str = "") -> Dict[str, Any]:
    """Package the outbound assistant payload."""
    return {
        "text": text,
        "language": language,
        "intent": intent,
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }


def make_error_payload(language: str, message: str) -> Dict[str, Any]:
    """Construct a user-facing error response."""
    translated = safe_translate(message, DEFAULT_LANGUAGE, language)
    return build_socket_payload(translated, language)


app = Flask(__name__)
app.config["SECRET_KEY"] = "farmer-support-chatbot"
app.config["JSON_SORT_KEYS"] = False
app.static_folder = "static"

socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=False, 
    engineio_logger=False
)



@app.get("/health")
def health_check():
    """Simple readiness probe for deployment platforms."""
    return jsonify(
        {
            "status": "ok",
            "modelLoaded": bool(model),
            "vocabularySize": len(words),
            "languages": sorted(SUPPORTED_LANGUAGES),
        }
    )


@socketio.on("connect")
def on_connect():
    LOGGER.info("Client %s connected", request.sid)


@socketio.on("disconnect")
def on_disconnect(*args):
    LOGGER.info("Client %s disconnected", request.sid)



@socketio.on_error_default  # type: ignore[misc]
def default_error_handler(error):
    LOGGER.exception("Socket error: %s", error)


@socketio.on("message")
def handle_message(data: Dict[str, Any] | None):
    """Primary socket endpoint for farmer queries."""
    payload = data or {}
    user_message = (payload.get("message") or "").strip()
    source_language = normalize_language(payload.get("language"))

    if not user_message:
        warning_message = "Please share a question so I know how to help."
        emit("recv_message", make_error_payload(source_language, warning_message))
        return {"status": "error", "message": "Empty message received"}

    try:
        response_text, winning_intent = chatbot_response(user_message, source_language)
        emit("recv_message", build_socket_payload(response_text, source_language, winning_intent))
        return {"status": "ok"}
    except Exception as exc:  # pylint: disable=broad-except
        LOGGER.exception("Failed to process message: %s", exc)
        emit(
            "recv_message",
            make_error_payload(
                source_language,
                "I ran into an issue while preparing that answer. Please try again.",
            ),
        )
        return {"status": "error", "message": "Model inference failed"}


if __name__ == "__main__":
    LOGGER.info("Starting Farmer Support Chatbot backend")
    socketio.run(app, debug=True)
