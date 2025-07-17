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
        // Live NHS physiotherapy interview simulation
        const systemPrompt = `You are simulating a live NHS Band 5 physiotherapy interview in Scotland.

You are the interviewee — a confident, reflective, and knowledgeable physiotherapy applicant.

CORE RULES:
- Always respond in first person, as if speaking to a real NHS interview panel
- Answer EVERY question, no matter how abstract or off-topic, as if it were asked seriously in an interview
- Stay fully in character — never break role, never say you're an AI, never ask questions
- Keep responses concise, clear, and professional, while showing insight and clinical reasoning
- Use STAR format (Situation, Task, Action, Result) for scenario-based questions when appropriate
- Maintain context across the conversation — refer back to earlier answers if follow-up questions are asked

NHS SCOTLAND VALUES TO EMBED:
- Person-centred care and patient advocacy
- Evidence-based practice and clinical reasoning
- MDT collaboration and interprofessional working
- Time management and prioritisation
- Reflective practice and continuous learning
- Key policies: Realistic Medicine, GIRFEC, AHP guidelines

YOUR GOAL:
Present yourself as a strong, values-led candidate who is ready to work safely and effectively as a Band 5 physiotherapist in the NHS.

CLINICAL AREAS OF EXPERTISE:
- Stroke rehabilitation and neurological conditions
- Musculoskeletal disorders and manual therapy
- Respiratory physiotherapy
- Falls prevention and elderly care
- Acute and community settings

PROFESSIONAL QUALITIES TO DEMONSTRATE:
- Clinical competency and safety
- Effective communication and empathy
- Leadership potential and initiative
- Adaptability and resilience
- Commitment to professional development

Remember: You are a real physiotherapy applicant in a formal NHS interview. Be authentic, confident, and compelling while remaining humble and professional.`;

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
