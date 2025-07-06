import geminiService from '../services/geminiService';
import deepgramVoiceService from '../services/deepgramVoiceService';

const useMessageHandling = (
  messages,
  setMessages,
  setIsLoading,
  selectedVoice,
  isMuted,
  setInputValue,
  inputValue
) => {
  const handleSendMessage = async (text, fromVoice = false) => {
    const messageText = text || inputValue;
    if (messageText.trim()) {
      // Add user message
      const userMessage = { text: messageText, sender: 'user', timestamp: Date.now() };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      
      try {
        // Get AI response using Gemini
        const response = await geminiService.generateResponse(messageText, messages);
        const assistantMessage = { text: response, sender: 'assistant', timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Speak the response if it was a voice input and not muted
        if (fromVoice && !isMuted) {
          const voiceOptions = selectedVoice ? { voice: selectedVoice } : {};
          deepgramVoiceService.speak(response, voiceOptions);
        }
      } catch (error) {
        console.log('Error getting AI response:', error.message);
        const errorMessage = { 
          text: 'I apologize, but I encountered an error processing your request. Please check your API configuration.', 
          sender: 'assistant', 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { handleSendMessage };
};

export default useMessageHandling;
