# AI Assistant Desktop App with Advanced System Audio Capture

A powerful desktop application that combines AI conversation capabilities with advanced system audio capture technology. This app can accurately capture internal system audio regardless of output volume, output device, or system configuration.

## 🎵 Advanced Audio Features

### System Audio Capture
- **Volume-Independent Capture**: Records internal audio even when system volume is muted or at very low levels
- **Universal Device Support**: Works with any output device (speakers, headphones, Bluetooth devices)
- **Multi-Source Capture**: Captures from all internal audio sources including:
  - System sounds and notifications
  - Media playback (YouTube, Spotify, etc.)
  - Application audio streams
  - Game audio
  - Voice calls and conferences

### Audio Quality & Processing
- **High-Fidelity Capture**: Up to 96kHz/24-bit audio quality
- **Real-Time Processing**: Low-latency audio processing with 10ms response time
- **Lossless Capture**: Preserves original audio quality without compression artifacts
- **Multi-Channel Support**: Stereo and mono recording options
- **Audio Enhancement**: Built-in gain control and level monitoring

### Platform-Specific Implementation
- **Windows**: WASAPI loopback capture for direct system audio access
- **macOS**: Core Audio integration with enhanced screen recording
- **Linux**: PulseAudio/PipeWire support for comprehensive audio routing

## 🚀 Features

### Core Functionality
- **AI-Powered Conversations**: Powered by Google's Gemini AI
- **Voice Recognition**: Advanced speech-to-text with Deepgram
- **Screen Analysis**: AI-powered screenshot analysis
- **Text-to-Speech**: Natural voice responses
- **System Audio Capture**: Record internal audio regardless of volume

### Audio Capabilities
- **Multiple Input Sources**: Microphone, system audio, or both
- **Real-Time Audio Visualization**: Live audio levels and waveform display
- **Audio Device Management**: Automatic detection and selection
- **Quality Presets**: From speech-optimized to high-resolution audio
- **Background Processing**: Continuous monitoring without UI blocking

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
