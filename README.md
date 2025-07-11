# 💼 Career Coach AI - IT Graduate Interview Specialist

An AI-powered desktop application specifically designed to help recent graduates prepare for technical interviews at top-tier technology companies. Specializes in Software Engineering, Data Analytics, and Cybersecurity roles.

## 🎯 Purpose & Focus

This application is your personal interview coach for landing graduate positions at companies like:
- **Tech Giants**: Google, Amazon, Microsoft, Meta, Apple, Netflix
- **Defense/Aerospace**: BAE Systems, Lockheed Martin, Raytheon, Boeing  
- **Financial Services**: Goldman Sachs, JPMorgan Chase, BlackRock
- **Consulting**: McKinsey Digital, BCG Digital Ventures, Deloitte

## 🚀 Key Features

### Technical Interview Preparation
- **Coding Challenges**: Algorithm and data structure problems tailored to graduate level
- **System Design**: Beginner-friendly system design questions with guided solutions
- **Language-Specific Prep**: Java, Python, JavaScript, C++, SQL, and more
- **Platform-Specific Questions**: LeetCode-style problems with detailed explanations

### Behavioral Interview Coaching  
- **STAR Method Training**: Structured response formatting for behavioral questions
- **Company Culture Alignment**: Answers tailored to specific company values
- **Leadership Examples**: Guidance for demonstrating potential despite limited experience
- **Scenario-Based Practice**: Common graduate interview scenarios

### Role-Specific Guidance

#### 💻 Software Engineering
- Algorithms, data structures, coding best practices
- Frontend, backend, and full-stack development questions
- DevOps, cloud computing, and scalability concepts
- Object-oriented design and software architecture

#### 📊 Data Analytics
- SQL query optimization and database design
- Python/R for data analysis and visualization
- Statistics, machine learning fundamentals
- Business intelligence and reporting tools

#### 🔒 Cybersecurity
- Security fundamentals and threat analysis
- Network security and penetration testing
- Incident response and risk management
- Compliance frameworks and security tools

## 🎵 Advanced Audio Features

### Voice-Enabled Interview Practice
- **Real-Time Practice**: Conduct mock interviews using voice commands
- **System Audio Capture**: Record and analyze presentation audio
- **Speech Recognition**: Advanced speech-to-text for voice-based practice
- **Natural Responses**: AI-powered voice feedback during mock interviews

### Quick Action Interface
- **One-Click Scenarios**: Jump into specific interview types instantly
- **Customizable Practice**: Tailor questions to your target company and role
- **Progress Tracking**: Monitor your improvement across different topics

## 🛠 Technical Implementation

### AI-Powered Core
- **Google Gemini Integration**: Advanced language model for realistic interview scenarios
- **Contextual Memory**: Maintains conversation history for personalized coaching
- **Company-Specific Training**: Knowledge base of actual interview processes

### Cross-Platform Desktop App
- **Electron Framework**: Native desktop experience on Windows, macOS, and Linux
- **React Frontend**: Modern, responsive user interface
- **Real-Time Audio**: Deepgram integration for voice interaction

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── Header.js        # Application header with branding
│   ├── MessageList.js   # Chat conversation display
│   ├── Message.js       # Individual message formatting
│   ├── InterviewQuickActions.js # Quick interview prep buttons
│   ├── VoiceStatus.js   # Voice interaction feedback
│   ├── InputArea.js     # User input interface
│   └── AudioSetup.js    # Audio configuration tools
├── hooks/              # Custom React hooks
│   ├── useAppState.js   # Global application state
│   ├── useMessageHandling.js # Chat functionality
│   ├── useVoiceHandling.js   # Voice interaction logic
│   └── useVoiceSetup.js      # Audio device setup
├── services/           # Backend integration services
│   ├── geminiService.js      # AI chat integration
│   ├── geminiMainService.js  # Main process AI service
│   ├── deepgramVoiceService.js # Speech recognition
│   └── windowsAudioCapture.js  # System audio capture
│   ├── MessageInput.js  # Text input field
│   └── index.js         # Component exports
├── hooks/              # Custom React hooks
│   ├── useAppState.js   # Main app state management
│   ├── useVoiceSetup.js # Voice initialization
│   ├── useMessageHandling.js # Message processing
│   ├── useVoiceHandling.js   # Voice command handling
└── electron-main.js    # Main Electron process
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Deepgram API key ([Sign up here](https://console.deepgram.com/signup))

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd career-coach-ai
   npm install
   ```

2. **Configure API Keys**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   NODE_ENV=development
   ```

3. **Start the Application**
   ```bash
   # Development mode with hot reload
   npm run start-dev
   
   # Or build and start production
   npm run start
   ```

## 💡 Usage Examples

### Getting Started
1. **Launch the app** and you'll see the welcome screen with quick action buttons
2. **Choose a focus area**: Technical Prep, Behavioral Prep, Role-Specific, or Mock Interview
3. **Start practicing**: Use text input or voice commands to interact

### Sample Questions You Can Ask
- *"Give me a coding challenge for a Google Software Engineer interview"*
- *"Help me prepare for behavioral questions at Amazon"*
- *"What cybersecurity questions should I expect at BAE Systems?"*
- *"Conduct a mock interview for a Data Analyst position"*
- *"How do I answer 'Why do you want to work here?' for Microsoft?"*

### Voice Features
- 🎤 **Microphone Mode**: Click the mic button and speak your questions
- 🎵 **System Audio**: Capture audio from your computer for analysis
- 🔇 **Mute Toggle**: Control whether responses are spoken aloud

## 🎯 Target Audience

This application is specifically designed for:
- **Recent Computer Science Graduates** seeking their first tech role
- **Career Changers** transitioning into IT fields
- **Bootcamp Graduates** preparing for technical interviews
- **Students** in their final year preparing for graduate recruitment
- **Job Seekers** targeting specific companies or roles

## 🏢 Supported Companies & Roles

### Primary Target Companies
- **FAANG**: Facebook/Meta, Apple, Amazon, Netflix, Google
- **Microsoft** and other major tech companies
- **Defense Contractors**: BAE Systems, Lockheed Martin, Raytheon
- **Financial Tech**: Goldman Sachs, JPMorgan, BlackRock
- **Consulting**: McKinsey Digital, BCG Digital Ventures

### Graduate-Level Positions
- Software Engineer / Developer (Graduate schemes)
- Data Analyst / Data Scientist (Entry level)
- Cybersecurity Analyst / Security Engineer
- DevOps Engineer / Cloud Engineer
- Product Analyst / Business Intelligence roles

## 🔧 Development

### Available Scripts
```bash
npm run start-dev      # Start development with hot reload
npm run start-renderer # Start React development server only
npm run build-renderer # Build React app for production
npm run build:css      # Compile Tailwind CSS
npm run build         # Build Electron app for distribution
```

### Tech Stack
- **Frontend**: React 18, Tailwind CSS
- **Desktop**: Electron with Node.js backend
- **AI Services**: Google Gemini, Deepgram Speech API
- **Build Tools**: Parcel bundler, PostCSS

## 📄 License

ISC License - Feel free to use this for your interview preparation!
