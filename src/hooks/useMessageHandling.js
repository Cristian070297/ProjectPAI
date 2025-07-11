import geminiService from '../services/geminiService';
import deepgramVoiceService from '../services/deepgramVoiceService';

const useMessageHandling = (
  messages,
  setMessages,
  setIsLoading,
  selectedVoice,
  isMuted,
  setInputValue,
  inputValue,
  userContext
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
        // Create enhanced system prompt with user context
        let systemPrompt = null;
        if (userContext) {
          systemPrompt = `You are an expert IT career coach and interview specialist. You have access to the user's personal context information:

**USER CONTEXT:**
- Document: ${userContext.name} (${userContext.type})
- Content: ${userContext.content.substring(0, 2000)}${userContext.content.length > 2000 ? '...' : ''}

**INSTRUCTIONS:**
- Use this context to provide personalized interview advice
- Reference specific skills, experiences, or qualifications from their document
- Tailor coding challenges to their apparent skill level
- Suggest improvements based on their background
- Make recommendations specific to their experience and goals
- When analyzing screenshots or answering questions, consider their background

Always provide responses that are specifically relevant to this user's experience and qualifications as shown in their uploaded context.`;
        }

        // Get AI response using Gemini with context
        const response = await geminiService.generateResponse(messageText, messages, systemPrompt);
        const assistantMessage = { text: response, sender: 'assistant', timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Speak the response if it was a voice input and not muted
        if (fromVoice && !isMuted) {
          const voiceOptions = selectedVoice ? { voice: selectedVoice } : {};
          deepgramVoiceService.speak(response, voiceOptions);
        }
      } catch (error) {
        console.log('Error getting AI response:', error.message);
        
        let errorMessage = 'I apologize, but I encountered an error processing your request.';
        if (error.message.includes('API key') || error.message.includes('not configured')) {
          errorMessage = '⚠️ **API Key Required**: Please add your Gemini API key to the .env file to use AI features.\n\nGet your free key at: https://makersuite.google.com/app/apikey';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = '⚠️ **API Limit Reached**: You\'ve reached your API quota. Please check your Gemini API usage or upgrade your plan.';
        } else {
          errorMessage += ' Please check your internet connection and API configuration.';
        }
        
        const errorResponse = { 
          text: errorMessage, 
          sender: 'assistant', 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { handleSendMessage };
};

export default useMessageHandling;
