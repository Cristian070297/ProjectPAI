import React, { useState, useEffect } from 'react';

const VoiceStatus = ({ voiceStatus, voiceError, audioLevels, isSystemAudio, onShowSystemAudioGuide }) => {
  const [audioHistory, setAudioHistory] = useState([]);
  const [peakLevel, setPeakLevel] = useState(0);

  useEffect(() => {
    if (audioLevels) {
      // Update audio history for visualization
      setAudioHistory(prev => {
        const newHistory = [...prev, audioLevels.volume];
        return newHistory.slice(-50); // Keep last 50 samples
      });
      
      // Update peak level
      setPeakLevel(Math.max(peakLevel * 0.95, audioLevels.volume)); // Decay peak
    }
  }, [audioLevels]);

  if (!voiceStatus && !voiceError && !audioLevels) return null;

  const getVolumeColor = (level) => {
    if (level < 0.1) return 'bg-gray-300';
    if (level < 0.3) return 'bg-green-400';
    if (level < 0.7) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getVolumeText = (level) => {
    if (level < 0.01) return 'Silent';
    if (level < 0.1) return 'Very Low';
    if (level < 0.3) return 'Low';
    if (level < 0.7) return 'Medium';
    return 'High';
  };

  // Check if error is related to system audio
  const isSystemAudioError = voiceError && (
    voiceError.includes('system audio') ||
    voiceError.includes('System audio') ||
    voiceError.includes('display media') ||
    voiceError.includes('Screen sharing') ||
    voiceError.includes('Share system audio') ||
    voiceError.includes('audio devices') ||
    voiceError.includes('Stereo Mix') ||
    voiceError.includes('Permission denied')
  );

  return (
    <div className="px-4 py-2">
      {/* Voice Status/Error */}
      {(voiceStatus || voiceError) && (
        <div className={`text-sm p-2 rounded mb-2 ${
          voiceError 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {voiceError || voiceStatus}
            </div>
            {isSystemAudioError && onShowSystemAudioGuide && (
              <button
                onClick={onShowSystemAudioGuide}
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Setup Guide
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audio Level Visualization */}
      {audioLevels && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">
              Audio Level: {getVolumeText(audioLevels.volume)}
              {isSystemAudio && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  System Audio
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(audioLevels.volume * 100)}%
            </div>
          </div>

          {/* Volume Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-100 ${getVolumeColor(audioLevels.volume)}`}
              style={{ width: `${Math.min(audioLevels.volume * 100, 100)}%` }}
            />
          </div>

          {/* Peak Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Peak: {Math.round(peakLevel * 100)}%</span>
            <span>Avg: {Math.round(audioLevels.average * 100)}%</span>
          </div>

          {/* Audio Waveform */}
          <div className="mt-2 h-8 bg-gray-200 rounded flex items-end justify-end overflow-hidden">
            {audioHistory.map((level, index) => (
              <div
                key={index}
                className={`w-1 transition-all duration-75 ${getVolumeColor(level)}`}
                style={{ 
                  height: `${Math.max(level * 100, 2)}%`,
                  opacity: 0.3 + (index / audioHistory.length) * 0.7
                }}
              />
            ))}
          </div>

          {/* Frequency Visualization */}
          {audioLevels.frequencyData && (
            <div className="mt-2 h-6 bg-gray-200 rounded flex items-end justify-center overflow-hidden">
              {Array.from(audioLevels.frequencyData)
                .filter((_, index) => index % 4 === 0) // Sample every 4th frequency bin
                .slice(0, 32) // Show first 32 bins (lower frequencies)
                .map((freq, index) => (
                  <div
                    key={index}
                    className="w-1 bg-purple-400 opacity-70 mx-px"
                    style={{ height: `${Math.max((freq / 255) * 100, 2)}%` }}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceStatus;
