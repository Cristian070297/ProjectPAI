import React from 'react';
import { Header, MessageList, VoiceStatus, InputArea } from './components';
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
    inputValue
  );

  const { handleVoiceCommand } = useVoiceHandling(
    setIsListening,
    setVoiceError,
    setVoiceStatus,
    handleSendMessage
  );

  const { handleScreenshot } = useScreenshotHandling(setIsLoading, setMessages);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      
      <MessageList messages={messages} isLoading={isLoading} />
      
      <VoiceStatus voiceStatus={voiceStatus} voiceError={voiceError} />
      
      <InputArea
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        handleScreenshot={handleScreenshot}
        handleVoiceCommand={handleVoiceCommand}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        deepgramVoiceService={deepgramVoiceService}
      />
    </div>
  );
};

export default App;
