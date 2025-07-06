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
      if (this.isElectron && window.electron?.gemini) {
        // Use Electron backend
        const result = await window.electron.gemini.generateResponse(message, conversationHistory);
        if (result.success) {
          return result.response;
        } else {
          throw new Error(result.error || 'Failed to generate response');
        }
      } else if (this.model) {
        // Direct API call (fallback)
        const result = await this.model.generateContent(message);
        return result.response.text();
      } else {
        throw new Error('Gemini service not properly configured');
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async analyzeImage(imageData, prompt = "What do you see in this image?") {
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
        throw new Error('Gemini service not properly configured');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}

export default new GeminiService();
