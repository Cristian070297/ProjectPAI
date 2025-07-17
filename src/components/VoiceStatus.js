import React from 'react';

const VoiceStatus = ({ voiceStatus, voiceError, isSystemAudio, onShowSystemAudioGuide }) => {

  if (!voiceStatus && !voiceError) return null;

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


    </div>
  );
};

export default VoiceStatus;
