// This file contains the main application code 

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import send_svg from './assets/send.svg';
import mic_svg from './assets/mic.svg';
import speaker_svg from './assets/speaker.svg';
import file_svg from './assets/file.svg';
import backgroundPhoto from './assets/bg.jpeg';
import gif from './assets/farm.gif';
import { TransformedItems } from './dropdown';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';
const RESOURCE_LIBRARY_URL = 'https://adil200.github.io/Farmer-Schemes/';
const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

const languageLocaleMap = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  ta: 'ta-IN'
};

const statusCopy = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Reconnecting…',
  error: 'Connection error'
};

const initialGreeting = 'Hey there! How can I support your farm today?';

const createMessagePayload = (text, sender, overrides = {}) => ({
  id:
    overrides.id ||
    `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  text,
  sender,
  timestamp: overrides.timestamp || Date.now(),
  language: overrides.language || null,
  intent: overrides.intent || null,
  meta: overrides.meta || null
});

const formatTimestamp = (value) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const App = () => {
  const [text, setText] = useState('');
  const [conversation, setConversation] = useState(() => [
    createMessagePayload(initialGreeting, 'bot', { language: 'en' })
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const [toastMessage, setToastMessage] = useState('');

  const dropdownItems = useMemo(() => TransformedItems(), []);
  const suggestions = useMemo(() => {
    const query = text.trim().toLowerCase();
    if (!query) return [];
    return dropdownItems.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 5);
  }, [dropdownItems, text]);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 4000);
  }, []);

  const appendMessage = useCallback((payload) => {
    setConversation((prev) => [
      ...prev,
      {
        id: payload.id || `${payload.sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: payload.text,
        sender: payload.sender,
        timestamp: payload.timestamp || Date.now(),
        language: payload.language || null,
        intent: payload.intent || null,
        meta: payload.meta || null
      }
    ]);
  }, []);

  const emitWithAck = useCallback(
    (payload) => {
      socket.emit('message', payload, (ack) => {
        if (ack?.status !== 'ok') {
          setIsAssistantTyping(false);
          showToast(ack?.message || 'Assistant is unavailable at the moment.');
        }
      });
    },
    [showToast]
  );

  useEffect(() => {
    const handleIncoming = (data) => {
      setIsAssistantTyping(false);
      const normalized = typeof data === 'string' ? { text: data } : data || {};
      appendMessage({
        text: normalized.text || '',
        sender: 'bot',
        language: normalized.language || 'en',
        intent: normalized.intent || null,
        timestamp: normalized.timestamp ? new Date(normalized.timestamp).getTime() : Date.now()
      });
    };

    const handleConnect = () => setConnectionState('connected');
    const handleDisconnect = () => setConnectionState('disconnected');
    const handleError = (err) => {
      console.error('Socket error', err);
      setConnectionState('error');
      showToast('Lost connection to the assistant. Trying to reconnect…');
    };

    socket.on('recv_message', handleIncoming);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('recv_message', handleIncoming);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, [appendMessage, showToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
      }

      const trimmed = text.trim();
      if (!trimmed) {
        showToast('Please enter a message before sending.');
        return;
      }

      appendMessage({ text: trimmed, sender: 'user', language: selectedLanguage });
      setText('');
      setIsAssistantTyping(true);
      emitWithAck({ message: trimmed, language: selectedLanguage });
    },
    [appendMessage, emitWithAck, selectedLanguage, showToast, text]
  );

  const handleMicClick = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageLocaleMap[selectedLanguage] || selectedLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      showToast('Could not capture audio. Please try again.');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        showToast('No speech detected. Try again.');
        return;
      }

      appendMessage({ text: transcript, sender: 'user', language: selectedLanguage });
      setIsAssistantTyping(true);
      emitWithAck({ message: transcript, language: selectedLanguage });
    };

    recognition.start();
  }, [appendMessage, emitWithAck, isListening, selectedLanguage, showToast]);

  const speakMessage = useCallback(() => {
    const lastMessage = conversation[conversation.length - 1];
    if (!lastMessage) {
      showToast('No message available to play.');
      return;
    }

    if (!window.speechSynthesis) {
      showToast('Speech playback is not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(lastMessage.text);
    utterance.lang = languageLocaleMap[selectedLanguage] || selectedLanguage;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error', error);
      showToast('Unable to play audio right now.');
    }
  }, [conversation, selectedLanguage, showToast]);

  const handleSuggestionClick = useCallback((value) => {
    setText(value);
  }, []);

  const handleClearHistory = useCallback(() => {
    setConversation([createMessagePayload(initialGreeting, 'bot', { language: 'en' })]);
    showToast('Conversation reset.');
  }, [showToast]);

  const handleDownloadTranscript = useCallback(() => {
    if (conversation.length === 0) {
      showToast('There is nothing to export yet.');
      return;
    }

    const transcript = conversation
      .map(
        (message) =>
          `[${formatTimestamp(message.timestamp)}] ${message.sender.toUpperCase()}: ${message.text}`
      )
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `farmer-support-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [conversation, showToast]);

  const openResourceLibrary = useCallback(() => {
    window.open(RESOURCE_LIBRARY_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Kannada', value: 'kn' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Telugu', value: 'te' },
    { label: 'Malayalam', value: 'ml' },
    { label: 'Tamil', value: 'ta' }
  ];

  const statusLabel = statusCopy[connectionState] || statusCopy.connecting;
  const sendDisabled = !text.trim();

  return (
    <div className="app-shell text-white">
      <div className="app-shell__background" style={{ backgroundImage: `url(${backgroundPhoto})` }} />
      <div className="app-shell__overlay" />

      <main className="app-layout">
        <section className="info-panel">
          <div className="info-panel__header">
            <div className="info-panel__badge">
              <img src={gif} alt="Farm animation" className="info-panel__badge-icon" />
              <span>Smart Farming Copilot</span>
            </div>
            <h1 className="info-panel__title">Farmer Support Chatbot</h1>
            <p className="info-panel__subtitle">
              Get 24/7 agronomy answers, hear the guidance in your language, and stay up-to-date with
              the latest schemes without leaving the field.
            </p>
            <div className="status-pill">
              <span className={`status-dot status-${connectionState}`} />
              <span>{statusLabel}</span>
            </div>
          </div>

          <div className="info-panel__stats">
            <div className="stat-item">
              <p className="stat-label">Realtime translation</p>
              <p className="stat-value">6 languages</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Voice controls</p>
              <p className="stat-value">Capture & playback</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Knowledge base</p>
              <p className="stat-value">Gov schemes & best practices</p>
            </div>
          </div>

          <div className="info-panel__section language-selector">
            <p className="section-label">Preferred language</p>
            <div className="language-grid">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`language-option ${selectedLanguage === option.value ? 'is-active' : ''}`}
                  onClick={() => setSelectedLanguage(option.value)}
                >
                  <span>{option.label}</span>
                  <span className="language-code">{option.value.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-actions">
            <button type="button" className="cta" onClick={openResourceLibrary}>
              <span>Explore Govt Schemes</span>
            </button>
            <button type="button" className="secondary" onClick={speakMessage}>
              <img src={speaker_svg} alt="" className="icon" />
              Play last response
            </button>
          </div>
        </section>

        <section className="chat-panel">
          <header className="chat-panel__header">
            <div className="chat-panel__header-content">
              <p className="eyebrow">Conversation</p>
              <h2 className="chat-panel__title">Agri Copilot</h2>
            </div>
            <button type="button" className="icon-button" onClick={speakMessage}>
              <img src={speaker_svg} alt="Play response" />
            </button>
          </header>

          <div className="chat-panel__toolbar">
            <div className="chip">
              <span className={`status-dot status-${connectionState}`} />
              <span>{statusLabel}</span>
            </div>
            <div className="chat-panel__toolbar-buttons">
              <button type="button" className="ghost-button" onClick={handleClearHistory}>
                Reset thread
              </button>
              <button type="button" className="ghost-button" onClick={handleDownloadTranscript}>
                Export chat
              </button>
              <button type="button" className="ghost-button" onClick={openResourceLibrary}>
                Schemes
              </button>
            </div>
          </div>

          <div className="chat-panel__body" id="chatscreen">
            {conversation.map((item) => (
              <div key={item.id} className={`chat-message chat-message--${item.sender}`}>
                <div className="chat-message__bubble">
                  <p>{item.text}</p>
                  <span className="chat-message__time">{formatTimestamp(item.timestamp)}</span>
                </div>
              </div>
            ))}

            {isAssistantTyping && (
              <div className="typing-indicator" aria-live="polite">
                <span />
                <span />
                <span />
                <p className="typing-indicator__copy">Assistant is preparing guidance…</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-panel__composer" onSubmit={handleSend}>
            <div className="composer-field">
              <input
                type="text"
                placeholder="Ask about soil care, subsidies, pests…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Type your question"
                autoComplete="off"
              />

              {suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.value}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion.value)}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="composer-actions">
              <button type="button" className="icon-button" onClick={handleMicClick}>
                <img src={isListening ? send_svg : mic_svg} alt="Microphone" />
              </button>

              <button type="button" className="icon-button" onClick={openResourceLibrary}>
                <img src={file_svg} alt="Resources" />
              </button>

              <button type="submit" className="icon-button primary" disabled={sendDisabled}>
                <img src={send_svg} alt="Send message" />
              </button>
            </div>
          </form>
        </section>
      </main>

      {toastMessage && (
        <div className="toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;