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
      const defaultSystemPrompt = `You are a helpful AI assistant that answers questions directly and provides comprehensive responses regardless of the input format or topic. 

IMPORTANT: Always provide a complete, helpful answer to any question asked. Never ask the user to select categories, modes, or provide additional information unless absolutely critical information is missing.

You excel at:
- Answering technical questions and explaining concepts
- Solving coding problems and debugging code
- Providing career advice and interview preparation
- Analyzing resumes, job postings, and technical content
- System design explanations and code reviews
- General knowledge and problem-solving

Response Guidelines:
- Answer questions directly and completely
- Provide structured, well-organized responses
- Include relevant examples, code snippets, or explanations as needed
- Be concise but thorough
- Use clear formatting with headers, bullet points, or numbered lists when helpful
- If analyzing an image or document, extract the content and provide the requested analysis
- For coding problems, provide complete solutions with explanations
- For technical questions, explain concepts clearly with examples

Always respond helpfully to whatever the user asks, regardless of whether they specify a particular category or mode.`;

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
