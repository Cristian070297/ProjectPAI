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

  async generateResponse(message, conversationHistory = [], customSystemPrompt = null) {
    try {
      // System prompt for IT interview content analysis
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

      // Use custom system prompt if provided, otherwise use default
      const activeSystemPrompt = customSystemPrompt || defaultSystemPrompt;

      if (this.isElectron && window.electron?.gemini) {
        // Use Electron backend
        const result = await window.electron.gemini.generateResponse(message, conversationHistory, activeSystemPrompt);
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

        const prompt = activeSystemPrompt + '\n\n' + context + `User: ${message}\nAssistant:`;
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