import React, { useState } from 'react';

const ApiKeySetup = ({ onDismiss, onOpenSettings }) => {
  const [showInstructions, setShowInstructions] = useState(true);

  if (!showInstructions) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-md rounded-lg shadow-lg z-50">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">⚠️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            API Keys Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">To use AI features, add your API keys to the <code className="bg-yellow-100 px-1 rounded">.env</code> file:</p>
            
            <div className="bg-yellow-100 p-2 rounded text-xs font-mono mb-3">
              GEMINI_API_KEY=your_key_here<br/>
              DEEPGRAM_API_KEY=your_key_here
            </div>
            
            <div className="space-y-1 text-xs">
              <div>🔗 <strong>Gemini API:</strong> <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Get free key</a></div>
              <div>🔗 <strong>Deepgram API:</strong> <a href="https://console.deepgram.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Get free trial</a></div>
            </div>
            
            <p className="mt-2 text-xs">
              Restart the app after adding keys.
            </p>
          </div>
          <div className="mt-3 flex justify-between">
            <button
              onClick={() => setShowInstructions(false)}
              className="text-xs text-yellow-600 hover:text-yellow-500"
            >
              Dismiss
            </button>
            <div className="space-x-2">
              <button
                onClick={onOpenSettings}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={onDismiss}
                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
