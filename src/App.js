import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MessageList from './components/MessageList';
import VoiceStatus from './components/VoiceStatus';
import InputArea from './components/InputArea';
import AudioSetup from './components/AudioSetup';
import InterviewQuickActions from './components/InterviewQuickActions';
import ContextFileManager from './components/ContextFileManager';
import ApiKeySetup from './components/ApiKeySetup';
import ApiKeySettings from './components/ApiKeySettings';
import SystemAudioGuide from './components/SystemAudioGuide';
import { 
  useAppState, 
  useVoiceSetup, 
  useMessageHandling, 
  useVoiceHandling, 
  useScreenshotHandling 
} from './hooks';
import deepgramVoiceService from './services/deepgramVoiceService';

const App = () => {
  console.log('App component rendering');
  
  // Audio setup state
  const [showAudioSetup, setShowAudioSetup] = useState(false);
  const [showSystemAudioGuide, setShowSystemAudioGuide] = useState(false);
  const [audioConfig, setAudioConfig] = useState({
    sampleRate: 48000,
    channels: 2,
    quality: 'high',
    gain: 1.0
  });
  const [audioLevels, setAudioLevels] = useState(null);
  const [isSystemAudio, setIsSystemAudio] = useState(false);
  
  // User context state
  const [userContext, setUserContext] = useState(null);
  
  // API key setup state
  const [showApiKeySetup, setShowApiKeySetup] = useState(true);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  
  // Settings modal state
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);

  // Check if API keys are configured
  useEffect(() => {
    const checkApiKeys = () => {
      const geminiKey = window.electron?.process?.env?.GEMINI_API_KEY;
      const hasValidGeminiKey = geminiKey && geminiKey !== 'your_gemini_api_key_here';
      setApiKeysConfigured(hasValidGeminiKey);
      setShowApiKeySetup(!hasValidGeminiKey);
    };
    
    checkApiKeys();
  }, []);

  // Custom hooks for state management
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isListening,
    setIsListening,
    isLoading,
    setIsLoading,
    voiceError,
    setVoiceError,
    voiceStatus,
    setVoiceStatus,
    isMuted,
    setIsMuted
  } = useAppState();

  const selectedVoice = useVoiceSetup();
  
  const { handleSendMessage } = useMessageHandling(
    messages,
    setMessages,
    setIsLoading,
    selectedVoice,
    isMuted,
    setInputValue,
    inputValue,
    userContext
  );

  const { handleVoiceCommand } = useVoiceHandling(
    setIsListening,
    setVoiceError,
    setVoiceStatus,
    handleSendMessage
  );

  const { handleScreenshot } = useScreenshotHandling(setIsLoading, setMessages);

  // Set up audio level monitoring
  useEffect(() => {
    deepgramVoiceService.setAudioLevelCallback(setAudioLevels);
    
    return () => {
      deepgramVoiceService.setAudioLevelCallback(null);
    };
  }, []);

  // Enhanced voice command with system audio support
  const handleSystemAudioVoiceCommand = async (useSystemAudio = false) => {
    setIsSystemAudio(useSystemAudio);
    
    if (useSystemAudio) {
      // Apply audio configuration
      deepgramVoiceService.setSystemAudioGain(audioConfig.gain);
    }
    
    await handleVoiceCommand(useSystemAudio);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header onSettingsClick={() => setShowApiKeySettings(true)} />
      
      {/* API Key Setup Notification */}
      {showApiKeySetup && !apiKeysConfigured && (
        <ApiKeySetup 
          onDismiss={() => setShowApiKeySetup(false)} 
          onOpenSettings={() => {
            setShowApiKeySettings(true);
            setShowApiKeySetup(false);
          }}
        />
      )}
      
      {/* API Key Settings Modal */}
      <ApiKeySettings 
        isOpen={showApiKeySettings}
        onClose={() => setShowApiKeySettings(false)}
        onKeysUpdated={() => {
          setApiKeysConfigured(true);
          setShowApiKeySetup(false);
        }}
      />
      
      {/* Audio Setup Modal */}
      {showAudioSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Audio Setup</h2>
              <button
                onClick={() => setShowAudioSetup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <AudioSetup
              onConfigChange={setAudioConfig}
              currentConfig={audioConfig}
            />
          </div>
        </div>
      )}
      
      {/* System Audio Guide Modal */}
      {showSystemAudioGuide && (
        <SystemAudioGuide
          isVisible={showSystemAudioGuide}
          onClose={() => setShowSystemAudioGuide(false)}
        />
      )}

      <MessageList messages={messages} isLoading={isLoading} />
      
      {/* Context File Manager and Reload Button */}
      <div className="px-4 flex items-center gap-2">
        <div className="flex-1">
          <ContextFileManager onContextChange={setUserContext} />
        </div>
        <button
          onClick={() => {
            setMessages([
              { 
                text: `👋 Welcome to **Career Coach AI** - Your IT Interview Content Analyzer!

I specialize in analyzing and answering questions from **any input source** to help you prepare for Software Engineering, Data Analytics, and Cybersecurity interviews.

## 📎 **NEW: Personal Context Feature**
Upload your **CV/Resume** or portfolio to get personalized advice based on your specific experience and skills!

## 🎯 **How I Help You:**

### 📸 **Screenshot Analysis**
• **Coding Problems** - Paste/upload coding challenges and get step-by-step solutions
• **Job Postings** - Analyze requirements and get preparation advice
• **Technical Diagrams** - Understand system designs and architecture
• **Resume Review** - Get feedback on your CV for IT roles

### 📝 **Text Content Analysis**  
• **Code Review** - Analyze your solutions and suggest improvements
• **Interview Questions** - Get detailed answers with multiple approaches
• **Technical Concepts** - Clear explanations with interview context
• **Written Responses** - Review and improve your prepared answers

### 🎤 **Voice Interaction**
• **Verbal Practice** - Ask questions using voice and get spoken responses
• **Mock Interviews** - Practice explaining solutions aloud
• **Real-time Feedback** - Immediate analysis of your verbal responses

## 🏢 **Target Companies I Know:**
**Tech:** Google, Amazon, Microsoft, Meta, Apple, Netflix
**Defense:** BAE Systems, Lockheed Martin, Raytheon
**Finance:** Goldman Sachs, JPMorgan, BlackRock

## 💡 **Getting Started:**
1. **📎 Upload your CV** for personalized advice (optional but recommended)
2. **📸 Take screenshots** of coding problems, job posts, or technical content
3. **📝 Paste text** of interview questions or code you want reviewed  
4. **🎤 Use voice** to ask questions or practice explanations

**Ready to analyze your content? Upload your context file and share what you'd like help with!**`, 
                sender: 'assistant' 
              }
            ]);
            setUserContext(null);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 whitespace-nowrap"
          title="Reset conversation and clear context"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>
      
      {/* Show interview quick actions only when there's just the welcome message */}
      {messages.length === 1 && (
        <div className="px-4">
          <InterviewQuickActions 
            onQuickAction={handleSendMessage} 
            isLoading={isLoading}
          />
        </div>
      )}
      
      <VoiceStatus 
        voiceStatus={voiceStatus} 
        voiceError={voiceError} 
        audioLevels={audioLevels}
        isSystemAudio={isSystemAudio}
        onShowSystemAudioGuide={() => setShowSystemAudioGuide(true)}
      />
      
      <InputArea
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        handleScreenshot={handleScreenshot}
        handleVoiceCommand={handleSystemAudioVoiceCommand}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        deepgramVoiceService={deepgramVoiceService}
        onShowAudioSetup={() => setShowAudioSetup(true)}
        audioConfig={audioConfig}
      />
    </div>
  );
};

export default App;
