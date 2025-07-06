import React, { useState, useEffect } from 'react';

const AudioSetup = ({ onConfigChange, currentConfig = {} }) => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [audioLevels, setAudioLevels] = useState(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [systemAudioAvailable, setSystemAudioAvailable] = useState(false);
  const [windowsDevices, setWindowsDevices] = useState([]);
  const [setupStatus, setSetupStatus] = useState('checking');
  
  const [config, setConfig] = useState({
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    bitrate: 256000,
    gain: 1.0,
    quality: 'high',
    method: 'auto',
    ...currentConfig
  });

  useEffect(() => {
    checkAudioSetup();
  }, []);

  const checkAudioSetup = async () => {
    try {
      setSetupStatus('checking');
      
      // Check if Electron is available
      if (window.electron && window.electron.ipcRenderer) {
        // Check permissions
        const permissions = await window.electron.ipcRenderer.invoke('check-audio-permissions');
        console.log('Audio permissions:', permissions);
        
        // Get audio sources
        const sources = await window.electron.ipcRenderer.invoke('get-audio-sources');
        setAudioDevices(sources || []);
        
        // Check Windows-specific devices
        if (navigator.platform.toLowerCase().includes('win')) {
          const windowsResult = await window.electron.ipcRenderer.invoke('get-windows-audio-devices');
          if (windowsResult.success) {
            setWindowsDevices(windowsResult.devices);
          }
        }
        
        setSystemAudioAvailable(permissions.systemAudio);
        setSetupStatus('ready');
      } else {
        // Browser-only environment
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
        }
        
        setSystemAudioAvailable(!!navigator.mediaDevices.getDisplayMedia);
        setSetupStatus('browser');
      }
    } catch (error) {
      console.error('Audio setup check failed:', error);
      setSetupStatus('error');
    }
  };

  const testAudioCapture = async () => {
    setIsTestingAudio(true);
    
    try {
      // Test system audio capture
      if (window.electron && window.electron.ipcRenderer) {
        const result = await window.electron.ipcRenderer.invoke('capture-system-audio', {
          duration: 3,
          sampleRate: config.sampleRate,
          channels: config.channels
        });
        
        if (result.success) {
          console.log('Audio test successful:', result.method);
          setSetupStatus('working');
        } else {
          console.error('Audio test failed:', result.error);
          setSetupStatus('error');
        }
      } else {
        // Browser test
        const stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: false
        });
        
        if (stream.getAudioTracks().length > 0) {
          console.log('Browser audio test successful');
          setSetupStatus('working');
          stream.getTracks().forEach(track => track.stop());
        } else {
          setSetupStatus('error');
        }
      }
    } catch (error) {
      console.error('Audio test failed:', error);
      setSetupStatus('error');
    } finally {
      setIsTestingAudio(false);
    }
  };

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const requestPermissions = async () => {
    try {
      if (window.electron && window.electron.ipcRenderer) {
        const permissions = await window.electron.ipcRenderer.invoke('request-audio-permissions');
        setSystemAudioAvailable(permissions.systemAudio);
      } else {
        // Browser permission request
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      checkAudioSetup();
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const getStatusColor = () => {
    switch (setupStatus) {
      case 'checking': return 'text-yellow-600';
      case 'ready': return 'text-green-600';
      case 'working': return 'text-green-600';
      case 'browser': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (setupStatus) {
      case 'checking': return 'Checking audio setup...';
      case 'ready': return 'Audio capture ready';
      case 'working': return 'Audio capture working';
      case 'browser': return 'Browser mode (limited)';
      case 'error': return 'Audio setup error';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Audio Setup</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* System Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">System Audio</span>
            <span className={`text-sm font-medium ${systemAudioAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {systemAudioAvailable ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Audio Devices</span>
            <span className="text-sm font-medium text-gray-700">
              {audioDevices.length} found
            </span>
          </div>
          {windowsDevices.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Windows Devices</span>
              <span className="text-sm font-medium text-gray-700">
                {windowsDevices.length} found
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Audio Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Rate
            </label>
            <select
              value={config.sampleRate}
              onChange={(e) => handleConfigChange('sampleRate', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={16000}>16 kHz (Speech)</option>
              <option value={44100}>44.1 kHz (CD Quality)</option>
              <option value={48000}>48 kHz (Professional)</option>
              <option value={96000}>96 kHz (High-Res)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channels
            </label>
            <select
              value={config.channels}
              onChange={(e) => handleConfigChange('channels', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Mono</option>
              <option value={2}>Stereo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality
            </label>
            <select
              value={config.quality}
              onChange={(e) => handleConfigChange('quality', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low (16 kHz, 64 kbps)</option>
              <option value="medium">Medium (44.1 kHz, 128 kbps)</option>
              <option value="high">High (48 kHz, 256 kbps)</option>
              <option value="ultra">Ultra (96 kHz, 512 kbps)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gain: {config.gain.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={config.gain}
              onChange={(e) => handleConfigChange('gain', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1x</span>
              <span>5.0x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={testAudioCapture}
          disabled={isTestingAudio}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTestingAudio ? 'Testing...' : 'Test Audio Capture'}
        </button>

        <button
          onClick={requestPermissions}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Request Permissions
        </button>

        <button
          onClick={checkAudioSetup}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Refresh Setup
        </button>
      </div>

      {/* Audio Devices List */}
      {audioDevices.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Available Audio Devices</h3>
          <div className="max-h-32 overflow-y-auto">
            {audioDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <div className="font-medium text-sm text-gray-700">{device.name}</div>
                  <div className="text-xs text-gray-500">{device.type || device.kind}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {device.hasAudio ? '🔊' : '🔇'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Windows Devices List */}
      {windowsDevices.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Windows Audio Devices</h3>
          <div className="max-h-32 overflow-y-auto">
            {windowsDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <div className="font-medium text-sm text-gray-700">{device.name}</div>
                  <div className="text-xs text-gray-500">{device.type}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {device.name.toLowerCase().includes('mix') ? '🔊' : '🎤'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Setup Help</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Windows:</strong> Enable "Stereo Mix" in sound settings for system audio</p>
          <p>• <strong>macOS:</strong> Enable screen recording permissions for system audio</p>
          <p>• <strong>Linux:</strong> Use PulseAudio loopback or PipeWire</p>
          <p>• <strong>Browser:</strong> Select "Share system audio" when prompted</p>
        </div>
      </div>
    </div>
  );
};

export default AudioSetup;
