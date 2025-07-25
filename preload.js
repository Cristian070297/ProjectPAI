const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  },
  screenshot: {
    take: () => ipcRenderer.invoke('take-screenshot')
  },
  gemini: {
    generateResponse: (message, conversationHistory, systemPrompt) => ipcRenderer.invoke('gemini-generate-response', message, conversationHistory, systemPrompt),
    analyzeImage: (imageData, prompt) => ipcRenderer.invoke('gemini-analyze-image', imageData, prompt)
  },
  files: {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    setUserContext: (contextData) => ipcRenderer.invoke('set-user-context', contextData),
    getUserContext: () => ipcRenderer.invoke('get-user-context'),
    clearUserContext: () => ipcRenderer.invoke('clear-user-context')
  },
  apiKeys: {
    getCurrentKeys: () => ipcRenderer.invoke('api-keys-get-current'),
    updateKeys: (keys) => ipcRenderer.invoke('api-keys-update', keys)
  },
  audio: {
    // Enhanced audio capture APIs
    getSystemAudioSources: (options) => ipcRenderer.invoke('get-system-audio-sources', options),
    getAudioSources: () => ipcRenderer.invoke('get-audio-sources'),
    checkAudioPermissions: () => ipcRenderer.invoke('check-audio-permissions'),
    requestAudioPermissions: () => ipcRenderer.invoke('request-audio-permissions'),
    
    // Windows-specific audio capture
    captureWindowsAudio: (options) => ipcRenderer.invoke('windows-audio-capture', options),
    getWindowsAudioDevices: () => ipcRenderer.invoke('get-windows-audio-devices'),
    
    // Enhanced system audio capture
    captureSystemAudio: (options) => ipcRenderer.invoke('capture-system-audio', options)
  },
  process: {
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
  }
});
