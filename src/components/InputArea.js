import React from 'react';
import ActionButtons from './ActionButtons';
import MessageInput from './MessageInput';

const InputArea = ({ 
  inputValue,
  setInputValue,
  handleSendMessage,
  handleScreenshot,
  handleVoiceCommand,
  isLoading,
  isListening,
  isMuted,
  setIsMuted,
  deepgramVoiceService
}) => {
  return (
    <div className="bg-white border-t p-4 shadow-lg">
      <ActionButtons
        handleScreenshot={handleScreenshot}
        handleVoiceCommand={handleVoiceCommand}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        deepgramVoiceService={deepgramVoiceService}
      />
      
      <MessageInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        💡 Pro tip: Press Enter to send, use voice input for hands-free interaction, or mute voice responses
      </div>
    </div>
  );
};

export default InputArea;
