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
    generateResponse: (message, conversationHistory) => ipcRenderer.invoke('gemini-generate-response', message, conversationHistory),
    analyzeImage: (imageData, prompt) => ipcRenderer.invoke('gemini-analyze-image', imageData, prompt)
  },
  process: {
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
  }
});
