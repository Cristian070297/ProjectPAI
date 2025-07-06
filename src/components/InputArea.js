import React, { useState, useEffect } from 'react';
import ActionButtons from './ActionButtons';
import MessageInput from './MessageInput';

const InputArea = ({ 
  inputValue,
  setInputValue,
  handleSendMessage,
  handleScreenshot,
  handleVoiceCommand,
  isLoading,
  isListening,
  isMuted,
  setIsMuted,
  deepgramVoiceService,
  onShowAudioSetup,
  audioConfig
}) => {
  const [useSystemAudio, setUseSystemAudio] = useState(false);
  const [systemAudioAvailable, setSystemAudioAvailable] = useState(false);

  useEffect(() => {
    checkSystemAudioAvailability();
  }, []);

  const checkSystemAudioAvailability = async () => {
    try {
      const isAvailable = await deepgramVoiceService.isSystemAudioAvailable();
      setSystemAudioAvailable(isAvailable);
    } catch (error) {
      console.error('Failed to check system audio availability:', error);
    }
  };

  const handleVoiceCommandWithSystemAudio = () => {
    handleVoiceCommand(useSystemAudio);
  };

  return (
    <div className="bg-white border-t p-4 shadow-lg">
      {/* Audio Controls */}
      <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onShowAudioSetup}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <span>⚙️</span>
            <span>Audio Setup</span>
          </button>
          
          {systemAudioAvailable && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={useSystemAudio}
                onChange={(e) => setUseSystemAudio(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">System Audio</span>
              <span className="text-xs text-gray-500">
                (Capture internal audio)
              </span>
            </label>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Quality: {audioConfig.quality}</span>
          <span>•</span>
          <span>{audioConfig.sampleRate / 1000}kHz</span>
          <span>•</span>
          <span>{audioConfig.channels}ch</span>
        </div>
      </div>

      <ActionButtons
        handleScreenshot={handleScreenshot}
        handleVoiceCommand={handleVoiceCommandWithSystemAudio}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        deepgramVoiceService={deepgramVoiceService}
        useSystemAudio={useSystemAudio}
        systemAudioAvailable={systemAudioAvailable}
      />
      
      <MessageInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        💡 Pro tip: Enable "System Audio" to capture internal audio regardless of volume • Press Enter to send • Use voice input for hands-free interaction
      </div>
    </div>
  );
};

export default InputArea;
