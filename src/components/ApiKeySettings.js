import React, { useState, useEffect } from 'react';

const ApiKeySettings = ({ isOpen, onClose, onKeysUpdated }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [isLoading, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentKeys();
    }
  }, [isOpen]);

  const loadCurrentKeys = async () => {
    try {
      if (window.electron?.apiKeys) {
        const result = await window.electron.apiKeys.getCurrentKeys();
        if (result.success) {
          setGeminiKey(result.keys.gemini || '');
          setDeepgramKey(result.keys.deepgram || '');
        }
      }
    } catch (error) {
      console.error('Failed to load current keys:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('');

    try {
      if (!window.electron?.apiKeys) {
        setSaveStatus('❌ API key management not available');
        setSaving(false);
        return;
      }

      const result = await window.electron.apiKeys.updateKeys({
        gemini: geminiKey.trim(),
        deepgram: deepgramKey.trim()
      });

      if (result.success) {
        setSaveStatus('✅ API keys saved successfully! Please restart the app to apply changes.');
        onKeysUpdated?.();
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
          setSaveStatus('');
        }, 3000);
      } else {
        setSaveStatus(`❌ Failed to save: ${result.error}`);
      }
    } catch (error) {
      setSaveStatus(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGetGeminiKey = () => {
    window.open('https://makersuite.google.com/app/apikey', '_blank');
  };

  const handleGetDeepgramKey = () => {
    window.open('https://console.deepgram.com/signup', '_blank');
  };

  const maskKey = (key) => {
    if (!key || key.length <= 8) return key;
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              🔑 API Key Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Gemini API Key */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                🤖 Google Gemini API Key
              </label>
              <button
                onClick={handleGetGeminiKey}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Get Free Key
              </button>
            </div>
            <div className="relative">
              <input
                type={showKeys ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showKeys ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Required for AI chat, screenshot analysis, and content review
            </p>
          </div>

          {/* Deepgram API Key */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                🎤 Deepgram API Key <span className="text-gray-500">(Optional)</span>
              </label>
              <button
                onClick={handleGetDeepgramKey}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Get Free Trial
              </button>
            </div>
            <div className="relative">
              <input
                type={showKeys ? 'text' : 'password'}
                value={deepgramKey}
                onChange={(e) => setDeepgramKey(e.target.value)}
                placeholder="Enter your Deepgram API key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showKeys ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Required for voice recognition and audio transcription features
            </p>
          </div>

          {/* Status Message */}
          {saveStatus && (
            <div className={`p-3 rounded-md mb-4 text-sm ${
              saveStatus.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isLoading || !geminiKey.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save API Keys'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">🛟 Need Help?</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Gemini API key is required for all AI features</li>
              <li>• Deepgram API key enables voice interaction</li>
              <li>• Both services offer free tiers for getting started</li>
              <li>• Keys are stored locally and never shared</li>
              <li>• Restart the app after saving keys</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;
