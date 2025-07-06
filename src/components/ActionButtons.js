import React from 'react';

const ActionButtons = ({ 
  handleScreenshot, 
  handleVoiceCommand, 
  isLoading, 
  isListening, 
  isMuted, 
  setIsMuted, 
  deepgramVoiceService 
}) => {
  const buttonClass = "px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:bg-gray-400";
  const pulseStyle = { animation: 'pulse 1s ease-in-out infinite' };

  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      <button
        onClick={handleScreenshot}
        disabled={isLoading}
        className={`${buttonClass} bg-green-500 hover:bg-green-600 text-white`}
      >
        📸 Screenshot
      </button>
      
      <button
        onClick={() => handleVoiceCommand(false)}
        disabled={isLoading}
        className={`${buttonClass} ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
        style={isListening ? pulseStyle : {}}
      >
        {isListening ? '🔴 Stop' : '🎤 Mic'}
      </button>

      <button
        onClick={() => handleVoiceCommand(true)}
        disabled={isLoading}
        className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white`}
        style={isListening ? pulseStyle : {}}
      >
        {isListening ? '🔴 Stop' : '🎵 Audio'}
      </button>

      <button
        onClick={() => {
          setIsMuted(!isMuted);
          if (!isMuted) {
            deepgramVoiceService.stopSpeaking();
          }
        }}
        className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white`}
      >
        {isMuted ? '🔇 Muted' : '🔊 Voice'}
      </button>
    </div>
  );
};

export default ActionButtons;
