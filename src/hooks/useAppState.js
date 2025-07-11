import { useState } from 'react';

const useAppState = () => {
  const [messages, setMessages] = useState([
    { 
      text: `👋 Welcome to **Career Coach AI** - Your IT Interview Content Analyzer!

I specialize in analyzing and answering questions from **any input source** to help you prepare for Software Engineering, Data Analytics, and Cybersecurity interviews.

## 📎 **NEW: Personal Context Feature**
Upload your **CV/Resume** or portfolio to get personalized advice based on your specific experience and skills!

## 🎯 **How I Help You:**

### 📸 **Screenshot Analysis**
• **Coding Problems** - Paste/upload coding challenges and get step-by-step solutions
• **Job Postings** - Analyze requirements and get preparation advice
• **Technical Diagrams** - Understand system designs and architecture
• **Resume Review** - Get feedback on your CV for IT roles

### 📝 **Text Content Analysis**  
• **Code Review** - Analyze your solutions and suggest improvements
• **Interview Questions** - Get detailed answers with multiple approaches
• **Technical Concepts** - Clear explanations with interview context
• **Written Responses** - Review and improve your prepared answers

### 🎤 **Voice Interaction**
• **Verbal Practice** - Ask questions using voice and get spoken responses
• **Mock Interviews** - Practice explaining solutions aloud
• **Real-time Feedback** - Immediate analysis of your verbal responses

## 🏢 **Target Companies I Know:**
**Tech:** Google, Amazon, Microsoft, Meta, Apple, Netflix
**Defense:** BAE Systems, Lockheed Martin, Raytheon
**Finance:** Goldman Sachs, JPMorgan, BlackRock

## 💡 **Getting Started:**
1. **📎 Upload your CV** for personalized advice (optional but recommended)
2. **📸 Take screenshots** of coding problems, job posts, or technical content
3. **📝 Paste text** of interview questions or code you want reviewed  
4. **🎤 Use voice** to ask questions or practice explanations

**Ready to analyze your content? Upload your context file and share what you'd like help with!**`, 
      sender: 'assistant' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isListening,
    setIsListening,
    isLoading,
    setIsLoading,
    voiceError,
    setVoiceError,
    voiceStatus,
    setVoiceStatus,
    isMuted,
    setIsMuted
  };
};

export default useAppState;
