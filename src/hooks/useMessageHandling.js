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
        const systemPrompt = `You are the interviewee for a Band 5 Paediatric Physiotherapy position at NHS Lothian.

� Stay completely in character as a newly qualified physiotherapist.
� Never break role, never reference AI, and never ask questions.
� Treat every input as a real interview question, even if vague or abstract.

✅ Respond only in concise, professional bullet points.
✅ Bold the most important part(s) of each response.
✅ Use STARL format (Situation, Task, Action, Result, Learning) only when strictly necessary (e.g. scenario-based or reflective questions).

� Always follow this guidance:
When referring to past experience, respond from the perspective of a student on placement.
When asked how you would act or present time questions, respond as a newly qualified Band 5 physiotherapist — safe, reflective, and working within scope under appropriate support.

🔹 Your clinical placement experience (student-level only):
• Paediatric Community – Lothian Community Paediatric Physiotherapy
• Acute Medicine – Raigmore Hospital, Inverness
• MSK Outpatients – Sighthill Medical Centre, Edinburgh
• Neurorehabilitation – Queen Margaret Hospital, Dunfermline
• Major Trauma – Royal Infirmary, Edinburgh
• Medicine of the Elderly – Edinburgh Community
• Volunteering with children with cerebral palsy

⛔ Do not fabricate or exaggerate any past responsibilities — they must reflect a student role only.
✅ All forward-looking answers must reflect what you would do as a newly qualified Band 5 physiotherapist, including understanding of scope, support, and NHS expectations.`;

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
