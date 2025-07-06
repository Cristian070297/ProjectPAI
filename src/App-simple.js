import React, { useState, useEffect } from 'react';
import geminiService from './services/geminiService';
import deepgramVoiceService from './services/deepgramVoiceService';

const App = () => {
  console.log('App component rendering');
  
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m RoseAi, your AI Assistant powered by Google Gemini. I can help with conversations, analyze images, and respond to voice commands!\n\n💡 Voice Tips:\n• Click 🎤 Mic to record from microphone\n• Click 🎵 Audio to record PC audio (music, videos, etc.)\n• Allow permissions when prompted\n• Speak clearly for 3-5 seconds\n• Uses Deepgram for reliable voice recognition', sender: 'assistant' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // Add CSS animations and load George voice
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);

    // Load George voice specifically
    const loadGeorgeVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Find George voice or fallback to a good English voice
      const georgeVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('george')
      ) || voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
      
      setSelectedVoice(georgeVoice);
    };

    // Load voices immediately
    loadGeorgeVoice();
    
    // Also load when voices change (some browsers load them asynchronously)
    window.speechSynthesis.addEventListener('voiceschanged', loadGeorgeVoice);
    
    return () => {
      document.head.removeChild(style);
      window.speechSynthesis.removeEventListener('voiceschanged', loadGeorgeVoice);
    };
  }, []);
  
  const handleSendMessage = async (text, fromVoice = false) => {
    const messageText = text || inputValue;
    if (messageText.trim()) {
      // Add user message
      const userMessage = { text: messageText, sender: 'user', timestamp: Date.now() };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      
      try {
        // Get AI response using Gemini
        const response = await geminiService.generateResponse(messageText, messages);
        const assistantMessage = { text: response, sender: 'assistant', timestamp: Date.now() };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Speak the response if it was a voice input and not muted
        if (fromVoice && !isMuted) {
          const voiceOptions = selectedVoice ? { voice: selectedVoice } : {};
          deepgramVoiceService.speak(response, voiceOptions);
        }
      } catch (error) {
        console.log('Error getting AI response:', error.message); // Changed from console.error
        const errorMessage = { 
          text: 'I apologize, but I encountered an error processing your request. Please check your API configuration.', 
          sender: 'assistant', 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVoiceCommand = async (useSystemAudio = false) => {
    if (!deepgramVoiceService.isSupported) {
      setVoiceError('Microphone not supported in this browser. Please use a modern browser.');
      return;
    }

    if (isListening) {
      deepgramVoiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceError('');
    setVoiceStatus(`🎤 Recording ${useSystemAudio ? 'PC audio' : 'microphone'}... speak now!`);
    
    deepgramVoiceService.startListening(
      // onResult
      (transcript) => {
        console.log('Deepgram transcript:', transcript);
        setIsListening(false);
        setVoiceStatus('✅ Voice processed successfully!');
        setTimeout(() => setVoiceStatus(''), 2000); // Clear after 2 seconds
        handleSendMessage(transcript, true); // true indicates it's from voice
      },
      // onError
      (error) => {
        console.log('Deepgram voice error:', error);
        setIsListening(false);
        setVoiceStatus('');
        setVoiceError(error);
      },
      // onEnd
      () => {
        setIsListening(false);
        if (!voiceError) {
          setVoiceStatus('🔄 Processing audio with Deepgram...');
        }
      },
      useSystemAudio // Pass the system audio flag
    );
  };

  const handleScreenshot = () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { text: 'Taking screenshot...', sender: 'assistant' }]);
    
    // Use setTimeout to avoid React error boundary issues
    setTimeout(async () => {
      try {
        if (!window.electron?.screenshot) {            setMessages(prev => [...prev, { text: 'Screenshot feature not available', sender: 'assistant' }]);
            setIsLoading(false);
            return;
          }

          const result = await window.electron.screenshot.take();
          
          if (result.success) {
            // Analyze the screenshot with Gemini
            try {
              const analysis = await geminiService.analyzeImage(
                result.imageData,
                'Analyze this screenshot and describe what you see. Be helpful and specific.'
              );
              
              setMessages(prev => [
                ...prev.slice(0, -1), // Remove "Taking screenshot..." message
                { 
                  text: '📸 Screenshot captured and analyzed:\n\n' + analysis, 
                  sender: 'assistant',
                  image: result.imageData
                }
              ]);
            } catch (analysisError) {
              console.log('Screenshot analysis error:', analysisError.message);
              setMessages(prev => [
                ...prev.slice(0, -1),
                { 
                  text: '📸 Screenshot captured, but analysis failed. Please check your Gemini API configuration.', 
                  sender: 'assistant',
                  image: result.imageData
                }
              ]);
            }
          } else {
            setMessages(prev => [
              ...prev.slice(0, -1),
              { text: `Screenshot failed: ${result.error}`, sender: 'assistant' }
            ]);
          }
        } catch (error) {
          console.log('Screenshot error:', error.message);
          setMessages(prev => [
            ...prev.slice(0, -1),
            { text: 'Screenshot failed: ' + error.message, sender: 'assistant' }
          ]);
        } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold">🌹 RoseAi</h1>
        <p className="text-sm opacity-90">Powered by Google Gemini & Deepgram Voice</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none border'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {message.text}
              </pre>
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Screenshot" 
                  className="mt-2 max-w-full h-auto rounded border"
                />
              )}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 p-3 rounded-lg rounded-bl-none border shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Status */}
      {(voiceStatus || voiceError) && (
        <div className="px-4 py-2">
          <div className={`text-sm p-2 rounded ${
            voiceError 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {voiceError || voiceStatus}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t p-4 shadow-lg">
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={handleScreenshot}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            📸 Screenshot
          </button>
          
          <button
            onClick={() => handleVoiceCommand(false)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            } disabled:bg-gray-400`}
            style={isListening ? {
              animation: 'pulse 1s ease-in-out infinite'
            } : {}}
          >
            {isListening ? '🔴 Stop' : '🎤 Mic'}
          </button>

          <button
            onClick={() => handleVoiceCommand(true)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } disabled:bg-gray-400`}
            style={isListening ? {
              animation: 'pulse 1s ease-in-out infinite'
            } : {}}
          >
            {isListening ? '🔴 Stop' : '🎵 Audio'}
          </button>

          {/* Mute Button */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted) {
                deepgramVoiceService.stopSpeaking();
              }
            }}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isMuted
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isMuted ? '🔇 Muted' : '🔊 Voice'}
          </button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message or use voice input..."
            disabled={isLoading}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          💡 Pro tip: Press Enter to send, use voice input for hands-free interaction, or mute voice responses
        </div>
      </div>
    </div>
  );
};

export default App;
