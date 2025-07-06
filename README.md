# RoseAi - AI Assistant Desktop App

A modern AI assistant desktop application built with React, Electron, Google Gemini, and Deepgram Voice.

## Features

- 🤖 AI conversations powered by Google Gemini
- 🎤 Voice input with Deepgram speech recognition
- 📸 Screenshot analysis with AI
- 🔊 Text-to-speech responses
- 🎵 PC audio recording capability
- 🌹 Beautiful, responsive UI with Tailwind CSS

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.js        # App header
│   ├── MessageList.js   # Message container
│   ├── Message.js       # Individual message component
│   ├── LoadingIndicator.js # Loading animation
│   ├── VoiceStatus.js   # Voice feedback display
│   ├── InputArea.js     # Input controls container
│   ├── ActionButtons.js # Action buttons (mic, screenshot, etc.)
│   ├── MessageInput.js  # Text input field
│   └── index.js         # Component exports
├── hooks/              # Custom React hooks
│   ├── useAppState.js   # Main app state management
│   ├── useVoiceSetup.js # Voice initialization
│   ├── useMessageHandling.js # Message processing
│   ├── useVoiceHandling.js   # Voice command handling
│   ├── useScreenshotHandling.js # Screenshot functionality
│   └── index.js         # Hook exports
├── services/           # External service integrations
│   ├── geminiService.js      # Google Gemini API
│   ├── deepgramVoiceService.js # Deepgram voice processing
│   └── geminiMainService.js   # Alternative Gemini service
├── App.js              # Main application component
└── index.js            # Application entry point
```

## Development Scripts

```bash
# Start development server
npm run start-renderer

# Build for production
npm run build-renderer

# Start full Electron app
npm run start

# Build CSS
npm run build:css

# Watch CSS changes
npm run build:css:watch
```

## Architecture Benefits

### Before Refactoring
- ❌ Single 347-line component
- ❌ Mixed concerns in one file
- ❌ No reusable components
- ❌ Difficult to maintain
- ❌ 1000+ files in git (build artifacts)

### After Refactoring
- ✅ Modular component structure
- ✅ Custom hooks for logic separation
- ✅ Reusable UI components
- ✅ Clean separation of concerns
- ✅ Proper .gitignore (only source files tracked)
- ✅ Easy to test and maintain
- ✅ Improved developer experience

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

3. Start development:
   ```bash
   npm run start-dev
   ```

## API Configuration

The app requires:
- Google Gemini API key
- Deepgram API key

Add these to your `.env` file.

## Contributing

The refactored codebase makes it easy to:
- Add new components
- Extend functionality with custom hooks
- Maintain clean separation of concerns
- Write tests for individual components
- Debug issues efficiently

## License

ISC
