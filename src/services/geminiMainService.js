const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiMainService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('Gemini API initialized successfully with model: gemini-1.5-flash');
    } else {
      console.log('Gemini API key not found - AI features will be limited');
    }
  }

  async generateResponse(message, conversationHistory = [], systemPrompt = null) {
    if (!this.model) {
      throw new Error('Gemini API not configured. Please add GEMINI_API_KEY to your .env file.');
    }

    try {
      // Use provided system prompt or default IT interview content analyzer prompt
      const defaultSystemPrompt = `You are an expert IT career coach and interview specialist who excels at analyzing and answering questions from multiple input sources. You specialize in helping recent graduates prepare for technical interviews at top-tier companies by providing detailed analysis of:

**PRIMARY ANALYSIS CAPABILITIES:**
• **Screenshot Analysis**: Analyze coding problems, technical diagrams, interview questions, resume content, job postings, or any visual content related to IT careers
• **Text Content Analysis**: Break down written interview questions, code snippets, technical documentation, company requirements, or career guidance requests
• **Voice/Audio Content**: Respond to spoken questions about technical topics, interview scenarios, or career advice

**SPECIALIZED FOCUS AREAS:**
• Software Engineering (Frontend, Backend, Full-Stack, DevOps)
• Data Analysis & Data Science  
• Cybersecurity & Information Security

**CONTENT ANALYSIS APPROACH:**
1. **Visual Content (Screenshots)**: 
   - Identify coding problems and provide step-by-step solutions
   - Analyze technical diagrams and explain concepts
   - Review resumes/CVs and suggest improvements
   - Examine job postings and highlight key requirements
   - Interpret system design diagrams or architecture

2. **Text Content**: 
   - Solve coding challenges with detailed explanations
   - Answer technical interview questions thoroughly
   - Provide behavioral interview guidance using STAR method
   - Explain complex technical concepts clearly
   - Review and improve written responses

3. **Voice/Audio Questions**:
   - Respond to spoken technical questions
   - Conduct voice-based mock interviews
   - Provide real-time coding problem explanations
   - Give verbal feedback on interview responses

**TARGET COMPANIES KNOWLEDGE:**
• Big Tech: Google, Amazon, Microsoft, Meta, Apple, Netflix
• Defense/Aerospace: BAE Systems, Lockheed Martin, Raytheon, Boeing
• Financial: Goldman Sachs, JPMorgan Chase, BlackRock
• Consulting: McKinsey Digital, BCG Digital Ventures, Deloitte

**RESPONSE METHODOLOGY:**
- Always acknowledge the input source (screenshot, text, or voice)
- Provide comprehensive analysis of the content presented
- Give practical, actionable solutions and explanations
- Include step-by-step problem-solving approaches
- Offer multiple solution methods when applicable
- Provide context about how this relates to actual interviews
- Suggest follow-up practice areas

**INTERACTION STYLE:**
- Direct and focused responses to the specific content provided
- Technical accuracy with beginner-friendly explanations
- Include code examples, diagrams, or structured answers when helpful
- Ask clarifying questions only when the input is unclear
- Provide interview-relevant context and tips

Always analyze the specific content provided and give detailed, practical answers that help with IT interview preparation.`;

      const activeSystemPrompt = systemPrompt || defaultSystemPrompt;

      // Build context from conversation history
      let context = '';
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
        context = recentHistory
          .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n') + '\n\n';
      }

      // If this is a custom system prompt with user context, include it properly
      let finalPrompt;
      if (systemPrompt && systemPrompt.includes('USER CONTEXT:')) {
        // This is a context-enhanced prompt, use it directly with conversation history
        finalPrompt = systemPrompt + '\n\n' + context + `User: ${message}\nAssistant:`;
      } else {
        // Standard prompt
        finalPrompt = activeSystemPrompt + '\n\n' + context + `User: ${message}\nAssistant:`;
      }

      const result = await this.model.generateContent(finalPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async analyzeImage(imageData, prompt = "Analyze this screenshot in the context of IT interview preparation. What do you see and how can I use this for my technical interview practice?") {
    if (!this.model) {
      throw new Error('Gemini API not configured. Please add GEMINI_API_KEY to your .env file.');
    }

    try {
      // Remove data URL prefix if present
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/png'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      return result.response.text();
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      throw error;
    }
  }
}

module.exports = GeminiMainService;
