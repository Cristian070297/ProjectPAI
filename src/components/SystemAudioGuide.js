import React, { useState } from 'react';

const SystemAudioGuide = ({ onClose, isVisible }) => {
  const [activeTab, setActiveTab] = useState('browser');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">System Audio Setup Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab('browser')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'browser'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Browser Setup
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'windows'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Windows Setup
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'troubleshoot'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Troubleshooting
          </button>
        </div>

        {/* Browser Setup Tab */}
        {activeTab === 'browser' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Browser Setup for System Audio</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Step-by-Step Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Click the "🎵 System Audio" button</li>
                <li>In the browser dialog, select your entire screen or a specific window</li>
                <li><strong>Important:</strong> Check the "Share system audio" checkbox</li>
                <li>Click "Share" to start capturing</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>System audio capture works even when your speakers are muted</li>
                <li>You must have audio playing for the capture to detect sound</li>
                <li>Works best with Chrome, Edge, or Firefox browsers</li>
                <li>The Electron app provides better system audio support</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Supported Browsers:</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li><strong>Google Chrome:</strong> Full support with system audio</li>
                <li><strong>Microsoft Edge:</strong> Full support with system audio</li>
                <li><strong>Mozilla Firefox:</strong> Limited support, may require additional setup</li>
                <li><strong>Safari:</strong> Not supported for system audio capture</li>
              </ul>
            </div>
          </div>
        )}

        {/* Windows Setup Tab */}
        {activeTab === 'windows' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Windows System Audio Setup</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Method 1: Enable Stereo Mix (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Right-click the speaker icon in your system tray</li>
                <li>Select "Open Sound settings"</li>
                <li>Click "Sound Control Panel" (or go to Control Panel → Sound)</li>
                <li>Go to the "Recording" tab</li>
                <li>Right-click in empty area → "Show Disabled Devices"</li>
                <li>Find "Stereo Mix" and right-click → "Enable"</li>
                <li>Right-click "Stereo Mix" → "Set as Default Device"</li>
              </ol>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Method 2: Virtual Audio Cable</h4>
              <div className="space-y-2 text-purple-700">
                <p>If Stereo Mix is not available:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Download and install VB-Cable (free virtual audio cable)</li>
                  <li>Set VB-Cable as your default audio output device</li>
                  <li>Use VB-Cable Input as your recording device</li>
                </ol>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Method 3: FFmpeg (Advanced)</h4>
              <div className="space-y-2 text-gray-700">
                <p>For advanced users with FFmpeg installed:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The app can use WASAPI loopback automatically</li>
                  <li>Provides direct system audio access</li>
                  <li>Works regardless of Stereo Mix availability</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Tab */}
        {activeTab === 'troubleshoot' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Troubleshooting Common Issues</h3>
            
            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">❌ "No audio tracks available"</h4>
                <div className="text-red-700 space-y-1">
                  <p><strong>Solution:</strong> Make sure to check "Share system audio" in the browser dialog</p>
                  <p><strong>Also try:</strong> Play some audio before starting capture</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">⚠️ "Screen sharing was denied"</h4>
                <div className="text-orange-700 space-y-1">
                  <p><strong>Solution:</strong> Allow screen sharing permissions in your browser</p>
                  <p><strong>Chrome:</strong> Click the camera icon in address bar → Allow</p>
                  <p><strong>Edge:</strong> Settings → Site permissions → Screen sharing</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ "No system audio detected"</h4>
                <div className="text-yellow-700 space-y-1">
                  <p><strong>Solution:</strong> Enable Stereo Mix in Windows sound settings</p>
                  <p><strong>Alternative:</strong> Use a virtual audio cable like VB-Cable</p>
                  <p><strong>Test:</strong> Try playing music while capturing</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">🔧 General Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Use the Electron app for better system audio support</li>
                  <li>Restart your browser after changing audio settings</li>
                  <li>Test with different audio sources (YouTube, Spotify, etc.)</li>
                  <li>Check that your audio drivers are up to date</li>
                  <li>Try the microphone button as a fallback option</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-500">
            💡 Need more help? Check the full setup guide in the project documentation.
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open('https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API', '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAudioGuide;
