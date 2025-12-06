# 🌾 Farmer Support ChatBot

A comprehensive AI-powered chatbot solution designed specifically for farmers, providing 24/7 agricultural support, multilingual assistance, and real-time guidance on farming practices, government schemes, and agricultural best practices.

![Farmer Support ChatBot](https://github.com/Sai051004/Agricultural-AI-Chatbot/blob/main/Screenshot%202025-12-06%20114248.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Training the Model](#training-the-model)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Farmer Support ChatBot is an intelligent conversational AI system built to assist farmers with:

- **Agricultural Guidance**: Get expert advice on crop management, soil health, pest control, irrigation, and farming techniques
- **Government Schemes**: Access information about agricultural subsidies, loan programs, and government initiatives
- **Multilingual Support**: Communicate in 6 languages (English, Kannada, Hindi, Telugu, Malayalam, Tamil)
- **Voice Interaction**: Use speech recognition to interact hands-free while working in the field
- **Real-time Assistance**: Instant responses powered by machine learning and natural language processing

The system uses a deep learning model trained on agricultural intents to understand farmer queries and provide contextually relevant responses. The backend is built with Flask and Socket.IO for real-time communication, while the frontend is a modern React application with a beautiful, intuitive interface.

## ✨ Features

### Core Features

- 🤖 **AI-Powered Responses**: Deep learning model trained on agricultural data for intelligent, context-aware responses
- 🌍 **Multilingual Support**: Real-time translation in 6 Indian languages
  - English (en)
  - Kannada (kn)
  - Hindi (hi)
  - Telugu (te)
  - Malayalam (ml)
  - Tamil (ta)
- 🎤 **Speech Recognition**: Voice input support for hands-free interaction
- 🔊 **Text-to-Speech**: Audio playback of responses in the selected language
- 💬 **Real-time Chat**: WebSocket-based instant messaging with typing indicators
- 📝 **Transcript Export**: Download conversation history for record-keeping
- 🔄 **Session Management**: Reset conversations and maintain chat history
- 📚 **Resource Library**: Quick access to government schemes and agricultural resources

### Technical Features

- **Health Monitoring**: `/health` endpoint for deployment readiness checks
- **Error Handling**: Robust error handling with user-friendly messages
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient-based design with smooth animations
- **Accessibility**: ARIA labels and keyboard navigation support

## 🛠 Technology Stack

### Backend
- **Python 3.x**: Core programming language
- **Flask**: Web framework for API endpoints
- **Flask-SocketIO**: Real-time bidirectional communication
- **TensorFlow/Keras**: Deep learning framework for the chatbot model
- **NLTK**: Natural language processing and tokenization
- **Google Translate API**: Language translation services
- **NumPy**: Numerical computations

### Frontend
- **React 18**: UI library for building interactive interfaces
- **Vite**: Fast build tool and development server
- **Socket.IO Client**: Real-time communication with backend
- **Web Speech API**: Browser-based speech recognition and synthesis
- **CSS3**: Modern styling with gradients, animations, and responsive design

### Machine Learning
- **Neural Network Architecture**: Sequential model with dense layers
- **Bag-of-Words**: Text representation for model input
- **WordNet Lemmatization**: Text preprocessing for better accuracy
- **Intent Classification**: Multi-class classification for different query types

## 📁 Project Structure

```
Farmer-Support-ChatBot/
│
├── Code/
│   ├── backend/
│   │   ├── chat.py              # Main Flask application and Socket.IO handlers
│   │   ├── train.py             # Model training script
│   │   ├── intents.json         # Training data with patterns and responses
│   │   ├── model.h5             # Trained Keras model
│   │   ├── word.pkl             # Vocabulary pickle file
│   │   ├── class.pkl            # Intent classes pickle file
│   │   ├── requirements.txt     # Python dependencies
│   │   └── static/              # Static files directory
│   │
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx           # Main React component
│       │   ├── index.css         # Global styles
│       │   ├── main.jsx          # React entry point
│       │   ├── dropdown.js       # Language/suggestion dropdown logic
│       │   └── assets/           # Images, icons, and media files
│       ├── package.json          # Node.js dependencies
│       └── vite.config.js        # Vite configuration
│
└── README.md                     # This file
```

## 🚀 Installation

### Prerequisites

- **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 16+**: [Download Node.js](https://nodejs.org/)
- **npm or yarn**: Package managers (comes with Node.js)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/Farmer-Support-ChatBot.git
cd Farmer-Support-ChatBot
```

### Step 2: Backend Setup

1. Navigate to the backend directory:
```bash
cd Code/backend
```

2. Create a virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

**Note**: If `requirements.txt` is not available, install manually:
```bash
pip install flask flask-socketio tensorflow keras nltk numpy googletrans==4.0.0-rc1
```

4. Download NLTK data (required for first run):
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
```

### Step 3: Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## 💻 Usage

### Running the Application

#### Option 1: Development Mode (Recommended)

1. **Start the Backend Server**:
   ```bash
   cd Code/backend
   python chat.py
   ```
   The backend will start on `http://127.0.0.1:5000`

2. **Start the Frontend Development Server** (in a new terminal):
   ```bash
   cd Code/frontend
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`

#### Option 2: Custom Backend URL

If your backend is running on a different URL or port:

```bash
cd Code/frontend
VITE_SOCKET_URL=http://your-backend-url:5000 npm run dev
```

### Using the Chatbot

1. **Select Your Language**: Choose from the language options in the left panel (English, Kannada, Hindi, Telugu, Malayalam, or Tamil)

2. **Type Your Question**: Enter your agricultural query in the input field at the bottom

3. **Voice Input**: Click the microphone icon to use voice input (requires browser permission)

4. **Get Responses**: The chatbot will respond in your selected language with relevant agricultural information

5. **Export Transcript**: Click "Export chat" to download your conversation history

6. **Reset Conversation**: Click "Reset thread" to start a new conversation

7. **Access Resources**: Click "Explore Govt Schemes" to open the resource library

## 🎓 Training the Model

To retrain or update the chatbot model with new data:

1. **Update Training Data**: Edit `Code/backend/intents.json` with new patterns and responses

2. **Run Training Script**:
   ```bash
   cd Code/backend
   python train.py
   ```

3. **Training Process**:
   - The script processes intents, creates vocabulary, and trains the neural network
   - Training typically takes 5-15 minutes depending on data size
   - The model is saved as `model.h5`
   - Vocabulary and classes are saved as `word.pkl` and `class.pkl`

4. **Model Architecture**:
   - Input Layer: Bag-of-words representation
   - Hidden Layers: 2 Dense layers (150 neurons each) with ReLU activation
   - Dropout: 0.1 for regularization
   - Output Layer: Softmax activation for intent classification
   - Optimizer: SGD with learning rate 0.01, momentum 0.9
   - Epochs: 250 (configurable in `train.py`)

## ⚙️ Configuration

### Environment Variables

- `VITE_SOCKET_URL`: Backend Socket.IO URL (default: `http://127.0.0.1:5000`)

### Backend Configuration

Edit `Code/backend/chat.py` to modify:
- `SUPPORTED_LANGUAGES`: Add or remove supported languages
- `DEFAULT_LANGUAGE`: Change the default language
- `DEFAULT_RESPONSE`: Customize the fallback response
- Error threshold for intent prediction (currently 0.25)

### Frontend Configuration

Edit `Code/frontend/src/App.jsx` to modify:
- Initial greeting message
- Language options
- Resource library URL
- Connection status messages

## 🚢 Deployment

### Backend Deployment

1. **Production Server**: Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -k eventlet -w 1 --bind 0.0.0.0:5000 chat:app
   ```

2. **Platform Options**:
   - **Render**: Connect GitHub repo, set Python version, install dependencies
   - **Railway**: Deploy from GitHub, set start command
   - **Heroku**: Use Procfile with Gunicorn
   - **AWS/Azure/GCP**: Use container services or VM instances

3. **Health Check**: The `/health` endpoint can be used for readiness probes:
   ```bash
   curl http://your-backend-url/health
   ```

### Frontend Deployment

1. **Build for Production**:
   ```bash
   cd Code/frontend
   npm run build
   ```

2. **Preview Build**:
   ```bash
   npm run preview
   ```

3. **Deploy Options**:
   - **Vercel**: Connect GitHub repo, auto-deploys on push
   - **Netlify**: Drag and drop `dist` folder or connect GitHub
   - **GitHub Pages**: Use GitHub Actions to build and deploy
   - **Static Hosting**: Upload `dist` folder to any static hosting service

4. **Environment Variables**: Set `VITE_SOCKET_URL` in your deployment platform to point to your backend URL

## 📡 API Documentation

### Socket.IO Events

#### Client → Server

**`message`**
- **Description**: Send a message to the chatbot
- **Payload**:
  ```json
  {
    "message": "How to improve soil fertility?",
    "language": "en"
  }
  ```
- **Response**: Server emits `recv_message` event

#### Server → Client

**`recv_message`**
- **Description**: Receive chatbot response
- **Payload**:
  ```json
  {
    "text": "To improve soil fertility, you can...",
    "language": "en",
    "intent": "soil_fertility",
    "timestamp": "2024-01-13T10:30:00Z"
  }
  ```

### REST Endpoints

**`GET /health`**
- **Description**: Health check endpoint
- **Response**:
  ```json
  {
    "status": "ok",
    "modelLoaded": true,
    "vocabularySize": 1500,
    "languages": ["en", "hi", "kn", "ml", "ta", "te"]
  }
  ```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Contribution

- Adding more agricultural intents and responses
- Supporting additional languages
- Improving UI/UX
- Adding new features (weather integration, market prices, etc.)
- Performance optimization
- Documentation improvements
