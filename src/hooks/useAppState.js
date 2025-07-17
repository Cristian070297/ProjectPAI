import { useState } from 'react';

const useAppState = () => {
  const [messages, setMessages] = useState([
    { 
      text: `**Ready to begin your interview preparation?**
*Ask me a practice question, or say "Give me a stroke scenario" to start!*`, 
      sender: 'assistant' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');

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
    setVoiceStatus
  };
};

export default useAppState;
