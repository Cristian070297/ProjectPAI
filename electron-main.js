const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Initialize Deepgram
let deepgram = null;
try {
  const { createClient } = require('@deepgram/sdk');
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  
  if (deepgramApiKey && deepgramApiKey !== 'your_deepgram_api_key_here') {
    deepgram = createClient(deepgramApiKey);
    console.log('Deepgram API initialized successfully');
  } else {
    console.log('Deepgram API key not found - voice transcription will be limited');
  }
} catch (error) {
  console.log('Failed to initialize Deepgram:', error.message);
}

// Initialize Gemini service
const GeminiMainService = require('./src/services/geminiMainService');
const geminiService = new GeminiMainService();

function createWindow () {
  console.log('Creating Electron window...');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Temporarily disable for development
      enableRemoteModule: false
    }
  });

  // Load the index.html from Parcel's development server or built version
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('Development mode: loading from localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.resolve(__dirname, 'dist/index.html');
    console.log('Production mode: loading file:', filePath);
    mainWindow.loadURL('file://' + filePath);
    // Open DevTools only if explicitly requested
    if (process.env.DEBUG_ELECTRON) {
      mainWindow.webContents.openDevTools();
    }
  }
  mainWindow.setContentProtection(true);

  ipcMain.on('save-screenshot', (event, imageData) => {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const filename = `screenshot-${Date.now()}.png`;
    const tempPath = app.getPath('temp');
    const filePath = path.join(tempPath, filename);

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error('Failed to save screenshot:', err);
        event.reply('screenshot-saved', { success: false, error: err.message });
      } else {
        console.log('Screenshot saved to:', filePath);
        event.reply('screenshot-saved', { success: true, filePath: filePath });
      }
    });
  });

  // Gemini API IPC handlers
  ipcMain.handle('gemini-generate-response', async (event, message, conversationHistory) => {
    try {
      const response = await geminiService.generateResponse(message, conversationHistory);
      return { success: true, response };
    } catch (error) {
      console.error('Gemini generate response error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('gemini-analyze-image', async (event, imageData, prompt) => {
    try {
      const response = await geminiService.analyzeImage(imageData, prompt);
      return { success: true, response };
    } catch (error) {
      console.error('Gemini analyze image error:', error);
      return { success: false, error: error.message };
    }
  });

  // Screenshot IPC handler
  ipcMain.handle('take-screenshot', async (event) => {
    try {
      console.log('Taking screenshot...');
      const sources = await desktopCapturer.getSources({ 
        types: ['screen'], 
        thumbnailSize: { width: 1280, height: 720 }
      });
      
      if (sources && sources.length > 0) {
        const imageData = sources[0].thumbnail.toDataURL();
        console.log('Screenshot captured successfully');
        return { 
          success: true, 
          imageData: imageData,
          sourceName: sources[0].name,
          sourceCount: sources.length
        };
      } else {
        return { success: false, error: 'No screen sources found' };
      }
    } catch (error) {
      console.error('Screenshot error in main process:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle audio transcription
  ipcMain.on('transcribe-audio', async (event, audioData) => {
    console.log('Received audio transcription request with ID:', audioData.requestId);
    
    try {
      if (!deepgram) {
        console.log('Deepgram not available, sending error response');
        event.reply('transcription-result', {
          success: false,
          error: 'Deepgram API not configured. Please add DEEPGRAM_API_KEY to your .env file.',
          requestId: audioData.requestId
        });
        return;
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData.audioData, 'base64');
      console.log('Audio buffer size:', audioBuffer.length, 'bytes');
      
      // Transcribe with Deepgram
      console.log('Sending request to Deepgram...');
      const response = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          punctuate: true,
          diarize: false
        }
      );

      const transcript = response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      if (transcript && transcript.trim()) {
        console.log('Deepgram transcription successful:', transcript);
        event.reply('transcription-result', {
          success: true,
          transcript: transcript.trim(),
          requestId: audioData.requestId
        });
      } else {
        console.log('No transcript found in Deepgram response');
        event.reply('transcription-result', {
          success: false,
          error: 'No speech detected. Please speak clearly and try again.',
          requestId: audioData.requestId
        });
      }
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      event.reply('transcription-result', {
        success: false,
        error: 'Voice transcription failed. Please try again.',
        requestId: audioData.requestId
      });
    }
  });
}

app.whenReady().then(() => {
  console.log('Electron app is ready, creating window...');
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
