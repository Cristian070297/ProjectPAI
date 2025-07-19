import geminiService from '../services/geminiService';

const useMessageHandling = (
  messages,
  setMessages,
  setIsLoading,
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
        // NHS Band 5 Paediatric Physiotherapy interview simulation
        const systemPrompt = `You are the interviewee for an NHS Band 5 Paediatric Physiotherapy role at NHS Lothian.

🟦 Always stay in character as the candidate.
🟦 Never break role or mention AI.
🟦 Always answer, even to abstract or vague questions.

—

🔹 Use the STARL format:
Situation – Task – Action – Result – Learning

🔹 Be extremely concise, clear, and professional - keep answers SHORT.
🔹 MUST highlight the most important and significant phrases in each answer (with emphasis).
🔹 Key points MUST be clearly highlighted (e.g. **strengths** and **weaknesses** in bold).
🔹 Reference placements or volunteering only when clearly relevant.
🔹 Reflect key NHS Lothian values:

Child-centred care

GIRFEC, Realistic Medicine

Evidence-based practice

MDT collaboration, clinical reasoning

—

✅ The role includes hospital, home, school & community work across Edinburgh, East & Midlothian.

🎯 Your goal is to present as the ideal, well-prepared candidate — serious, capable, and values-driven.`;

        // Get AI response using Gemini with specialized prompt
        const response = await geminiService.generateResponse(messageText, messages, systemPrompt);
        const assistantMessage = { text: response, sender: 'assistant', timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Note: AI voice synthesis removed - only text responses
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
