import { useState, useEffect } from 'react';

const useVoiceSetup = () => {
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    // Add CSS animations
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

  return selectedVoice;
};

export default useVoiceSetup;
