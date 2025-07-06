import React from 'react';

const VoiceStatus = ({ voiceStatus, voiceError }) => {
  if (!voiceStatus && !voiceError) return null;

  return (
    <div className="px-4 py-2">
      <div className={`text-sm p-2 rounded ${
        voiceError 
          ? 'bg-red-100 text-red-700 border border-red-200' 
          : 'bg-blue-100 text-blue-700 border border-blue-200'
      }`}>
        {voiceError || voiceStatus}
      </div>
    </div>
  );
};

export default VoiceStatus;
