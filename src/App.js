import React, { useState, useEffect } from 'react';
import MessageList from './components/MessageList';
import VoiceStatus from './components/VoiceStatus';
import InputArea from './components/InputArea';
import AudioSetup from './components/AudioSetup';
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
  const [isSystemAudio, setIsSystemAudio] = useState(false);
  
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
    setVoiceStatus
  } = useAppState();

  const selectedVoice = useVoiceSetup();
  
  const { handleSendMessage } = useMessageHandling(
    messages,
    setMessages,
    setIsLoading,
    setInputValue,
    inputValue
  );

  const { handleVoiceCommand } = useVoiceHandling(
    setIsListening,
    setVoiceError,
    setVoiceStatus,
    handleSendMessage
  );

  const { handleScreenshot } = useScreenshotHandling(setIsLoading, setMessages);

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
      
      <VoiceStatus 
        voiceStatus={voiceStatus} 
        voiceError={voiceError} 
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
        deepgramVoiceService={deepgramVoiceService}
        onShowAudioSetup={() => setShowAudioSetup(true)}
        audioConfig={audioConfig}
        onSettingsClick={() => setShowApiKeySettings(true)}
      />
    </div>
  );
};

export default App;
