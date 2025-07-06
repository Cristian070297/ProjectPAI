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

  async generateResponse(message, conversationHistory = []) {
    if (!this.model) {
      throw new Error('Gemini API not configured. Please add GEMINI_API_KEY to your .env file.');
    }

    try {
      // Build context from conversation history
      let context = '';
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
        context = recentHistory
          .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n') + '\n\n';
      }

      const prompt = context + `User: ${message}\nAssistant:`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async analyzeImage(imageData, prompt = "What do you see in this image?") {
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
