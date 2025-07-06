import { useState } from 'react';

const useAppState = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m RoseAi, your AI Assistant powered by Google Gemini. I can help with conversations, analyze images, and respond to voice commands!\n\n💡 Voice Tips:\n• Click 🎤 Mic to record from microphone\n• Click 🎵 Audio to record PC audio (music, videos, etc.)\n• Allow permissions when prompted\n• Speak clearly for 3-5 seconds\n• Uses Deepgram for reliable voice recognition', sender: 'assistant' }
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
