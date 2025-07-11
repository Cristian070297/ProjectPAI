import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = window.electron?.process?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    this.isElectron = typeof window !== 'undefined' && window.electron;
    
    if (this.isElectron) {
      // In Electron, use the backend service
      console.log('GeminiService initialized, Electron available:', window.electron);
    } else if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      // Direct browser initialization (fallback)
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('GeminiService initialized with direct API');
    } else {
      console.log('GeminiService: No API key configured');
    }
  }

  async generateResponse(message, conversationHistory = []) {
    try {
      // System prompt for IT interview content analysis
      const systemPrompt = `You are an expert IT career coach and interview specialist who excels at analyzing and answering questions from multiple input sources. You specialize in helping recent graduates prepare for technical interviews at top-tier companies by providing detailed analysis of:

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

      if (this.isElectron && window.electron?.gemini) {
        // Use Electron backend
        const result = await window.electron.gemini.generateResponse(message, conversationHistory, systemPrompt);
        if (result.success) {
          return result.response;
        } else {
          throw new Error(result.error || 'Failed to generate response');
        }
      } else if (this.model) {
        // Direct API call (fallback)
        // Build context from conversation history
        let context = '';
        if (conversationHistory && conversationHistory.length > 0) {
          const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
          context = recentHistory
            .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n') + '\n\n';
        }

        const prompt = systemPrompt + '\n\n' + context + `User: ${message}\nAssistant:`;
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } else {
        throw new Error('Gemini service not properly configured');
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async analyzeImage(imageData, prompt = "Analyze this screenshot in the context of IT interview preparation. What do you see and how can I use this for my technical interview practice?") {
    try {
      if (this.isElectron && window.electron?.gemini) {
        // Use Electron backend
        const result = await window.electron.gemini.analyzeImage(imageData, prompt);
        if (result.success) {
          return result.response;
        } else {
          throw new Error(result.error || 'Failed to analyze image');
        }
      } else if (this.model) {
        // Direct API call (fallback)
        const imagePart = {
          inlineData: {
            data: imageData.split(',')[1], // Remove data URL prefix
            mimeType: 'image/png'
          }
        };
        const result = await this.model.generateContent([prompt, imagePart]);
        return result.response.text();
      } else {
        throw new Error('Gemini API not configured. Please add your GEMINI_API_KEY to the .env file.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      if (error.message.includes('API key')) {
        throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file to use image analysis features.');
      } else {
        throw new Error(`Image analysis failed: ${error.message}`);
      }
    }
  }
}

export default new GeminiService();
