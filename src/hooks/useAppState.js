import { useState } from 'react';

const useAppState = () => {
  const [messages, setMessages] = useState([
    { 
      text: `👋 Hello! I'm here to help you, ask away!`, 
      sender: 'assistant' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  return {
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
  };
};

export default useAppState;
