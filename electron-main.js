const { app, BrowserWindow, desktopCapturer, ipcMain, systemPreferences, dialog } = require('electron');
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
const WindowsAudioCapture = require('./src/services/windowsAudioCapture');

const geminiService = new GeminiMainService();
const windowsAudioCapture = new WindowsAudioCapture();

function createWindow () {
  console.log('Creating Electron window...');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    skipTaskbar: true,
    autoHideMenuBar: true,
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
    console.log('Development mode: loading from localhost:3001');
    mainWindow.loadURL('http://localhost:3001');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In packaged app, files are in different location
    let filePath;
    if (app.isPackaged) {
      // In packaged app, look for index.html in the resources/app/dist folder
      filePath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
      console.log('Packaged mode: trying resources path:', filePath);
      
      // Fallback to app directory if resources path doesn't work
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'dist', 'index.html');
        console.log('Packaged mode: falling back to app path:', filePath);
      }
    } else {
      // Development build
      filePath = path.resolve(__dirname, 'dist/index.html');
      console.log('Development build mode: loading file:', filePath);
    }
    
    console.log('Loading file:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    mainWindow.loadFile(filePath);
    
    // Open DevTools only if explicitly requested
    if (process.env.DEBUG_ELECTRON) {
      mainWindow.webContents.openDevTools();
    }
  }
  
  // Add debugging event listeners
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load page:', errorCode, errorDescription, validatedURL);
  });
  
  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM ready');
  });
  
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
  ipcMain.handle('gemini-generate-response', async (event, message, conversationHistory, systemPrompt) => {
    try {
      const response = await geminiService.generateResponse(message, conversationHistory, systemPrompt);
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

  // File upload and context management handlers
  ipcMain.handle('open-file-dialog', async (event) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Read file content based on type
      let content = '';
      let fileType = 'unknown';

      if (['.txt', '.md', '.js', '.py', '.java', '.cpp', '.html', '.css'].includes(fileExtension)) {
        // Text files
        content = fs.readFileSync(filePath, 'utf8');
        fileType = 'text';
      } else if (['.jpg', '.jpeg', '.png', '.bmp', '.gif'].includes(fileExtension)) {
        // Image files
        const imageBuffer = fs.readFileSync(filePath);
        content = `data:image/${fileExtension.slice(1)};base64,${imageBuffer.toString('base64')}`;
        fileType = 'image';
      } else if (['.pdf', '.doc', '.docx'].includes(fileExtension)) {
        // Document files - for now, just store the path
        content = `Document file: ${fileName} (${fileExtension.toUpperCase()})`;
        fileType = 'document';
      }

      return {
        success: true,
        file: {
          name: fileName,
          path: filePath,
          content: content,
          type: fileType,
          extension: fileExtension
        }
      };
    } catch (error) {
      console.error('File dialog error:', error);
      return { success: false, error: error.message };
    }
  });

  // Store user context (CV, portfolio, etc.)
  let userContext = null;
  
  ipcMain.handle('set-user-context', async (event, contextData) => {
    try {
      userContext = contextData;
      console.log('User context updated:', contextData.type);
      return { success: true };
    } catch (error) {
      console.error('Set user context error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-user-context', async (event) => {
    return { success: true, context: userContext };
  });

  ipcMain.handle('clear-user-context', async (event) => {
    userContext = null;
    return { success: true };
  });

  // API Key management handlers
  ipcMain.handle('api-keys-get-current', async (event) => {
    try {
      return {
        success: true,
        keys: {
          gemini: process.env.GEMINI_API_KEY || '',
          deepgram: process.env.DEEPGRAM_API_KEY || ''
        }
      };
    } catch (error) {
      console.error('Get API keys error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api-keys-update', async (event, keys) => {
    try {
      const envPath = path.join(__dirname, '.env');
      let envContent = '';

      // Read existing .env file if it exists
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (error) {
        // File doesn't exist, we'll create it
        console.log('.env file not found, creating new one');
      }

      // Update or add API keys
      const lines = envContent.split('\n');
      const updatedLines = [];
      let geminiUpdated = false;
      let deepgramUpdated = false;

      for (const line of lines) {
        if (line.startsWith('GEMINI_API_KEY=')) {
          updatedLines.push(`GEMINI_API_KEY=${keys.gemini || 'your_gemini_api_key_here'}`);
          geminiUpdated = true;
        } else if (line.startsWith('DEEPGRAM_API_KEY=')) {
          updatedLines.push(`DEEPGRAM_API_KEY=${keys.deepgram || 'your_deepgram_api_key_here'}`);
          deepgramUpdated = true;
        } else if (line.trim() !== '') {
          updatedLines.push(line);
        }
      }

      // Add missing keys
      if (!geminiUpdated) {
        updatedLines.push(`GEMINI_API_KEY=${keys.gemini || 'your_gemini_api_key_here'}`);
      }
      if (!deepgramUpdated) {
        updatedLines.push(`DEEPGRAM_API_KEY=${keys.deepgram || 'your_deepgram_api_key_here'}`);
      }

      // Ensure NODE_ENV is set
      const hasNodeEnv = updatedLines.some(line => line.startsWith('NODE_ENV='));
      if (!hasNodeEnv) {
        updatedLines.push('NODE_ENV=development');
      }

      // Write updated .env file
      const newEnvContent = updatedLines.filter(line => line.trim() !== '').join('\n') + '\n';
      fs.writeFileSync(envPath, newEnvContent, 'utf8');

      console.log('API keys updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update API keys error:', error);
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

  // Enhanced system audio sources handler
  ipcMain.handle('get-system-audio-sources', async (event, options = {}) => {
    try {
      console.log('Getting system audio sources...');
      
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window', 'audio'],
        thumbnailSize: { width: 150, height: 150 },
        fetchWindowIcons: options.fetchWindowIcons || false
      });

      // Filter and enhance audio sources
      const audioSources = sources.filter(source => {
        const name = source.name.toLowerCase();
        return name.includes('audio') || 
               name.includes('speaker') || 
               name.includes('system') ||
               name.includes('output') ||
               name.includes('sound') ||
               source.id.includes('audio');
      });

      console.log('Found audio sources:', audioSources.length);
      
      return audioSources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : null,
        display_id: source.display_id,
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
      }));
    } catch (error) {
      console.error('Failed to get system audio sources:', error);
      return [];
    }
  });

  // Get all available audio sources (including system audio)
  ipcMain.handle('get-audio-sources', async (event) => {
    try {
      console.log('Getting all audio sources...');
      
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }
      });

      console.log(`Found ${sources.length} total sources`);

      // Process and prioritize sources for system audio capture
      const audioSources = sources.map(source => {
        const isScreen = source.name.toLowerCase().includes('screen') || 
                         source.name.toLowerCase().includes('entire screen') ||
                         source.name.toLowerCase().includes('display');
        
        return {
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : null,
          hasAudio: true, // All sources can potentially have audio
          type: isScreen ? 'screen' : 'window',
          display_id: source.display_id,
          // Add priority for system audio - screens are better than windows
          priority: isScreen ? 1 : 2
        };
      });

      // Sort by priority (screens first, then windows)
      audioSources.sort((a, b) => a.priority - b.priority);

      console.log('Processed audio sources:', audioSources.map(s => `${s.name} (${s.type})`));
      return audioSources;
    } catch (error) {
      console.error('Failed to get audio sources:', error);
      return [];
    }
  });

  // Check audio permissions and capabilities
  ipcMain.handle('check-audio-permissions', async (event) => {
    try {
      const permissions = {
        microphone: false,
        systemAudio: false,
        screenCapture: false
      };

      // Check microphone permission
      if (process.platform === 'darwin') {
        permissions.microphone = systemPreferences.getMediaAccessStatus('microphone') === 'granted';
        permissions.screenCapture = systemPreferences.getMediaAccessStatus('screen') === 'granted';
      } else {
        // For Windows and Linux, assume permissions are available
        permissions.microphone = true;
        permissions.screenCapture = true;
      }

      permissions.systemAudio = permissions.screenCapture; // System audio requires screen capture

      console.log('Audio permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Failed to check audio permissions:', error);
      return {
        microphone: false,
        systemAudio: false,
        screenCapture: false
      };
    }
  });

  // Request audio permissions
  ipcMain.handle('request-audio-permissions', async (event) => {
    try {
      if (process.platform === 'darwin') {
        const microphoneAccess = await systemPreferences.askForMediaAccess('microphone');
        const screenAccess = await systemPreferences.askForMediaAccess('screen');
        
        return {
          microphone: microphoneAccess,
          systemAudio: screenAccess,
          screenCapture: screenAccess
        };
      } else {
        // For Windows and Linux, return true (handled at browser level)
        return {
          microphone: true,
          systemAudio: true,
          screenCapture: true
        };
      }
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      return {
        microphone: false,
        systemAudio: false,
        screenCapture: false
      };
    }
  });

  // Windows-specific system audio capture
  ipcMain.handle('windows-audio-capture', async (event, options = {}) => {
    try {
      if (!windowsAudioCapture.isSupported()) {
        throw new Error('Windows audio capture is only supported on Windows');
      }

      console.log('Starting Windows system audio capture...');
      const captureResult = await windowsAudioCapture.captureSystemAudio(
        options.duration || 10
      );

      // Convert to base64 for transmission
      const base64Audio = captureResult.data.toString('base64');
      
      return {
        success: true,
        audioData: base64Audio,
        format: captureResult.format,
        sampleRate: captureResult.sampleRate,
        channels: captureResult.channels
      };
    } catch (error) {
      console.error('Windows audio capture failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get Windows audio devices
  ipcMain.handle('get-windows-audio-devices', async (event) => {
    try {
      await windowsAudioCapture.initialize();
      const devices = windowsAudioCapture.getAvailableDevices();
      
      return {
        success: true,
        devices: devices
      };
    } catch (error) {
      console.error('Failed to get Windows audio devices:', error);
      return {
        success: false,
        error: error.message,
        devices: []
      };
    }
  });

  // Enhanced system audio capture with multiple methods
  ipcMain.handle('capture-system-audio', async (event, options = {}) => {
    try {
      console.log('Starting enhanced system audio capture...');
      
      // Try Windows-specific capture first (if on Windows)
      if (windowsAudioCapture.isSupported()) {
        try {
          const result = await windowsAudioCapture.captureSystemAudio(options.duration || 10);
          return {
            success: true,
            method: 'windows-wasapi',
            audioData: result.data.toString('base64'),
            format: result.format,
            sampleRate: result.sampleRate,
            channels: result.channels
          };
        } catch (windowsError) {
          console.warn('Windows audio capture failed, trying alternative methods:', windowsError);
        }
      }
      
      // Fallback to other methods
      throw new Error('No suitable system audio capture method available');
    } catch (error) {
      console.error('Enhanced system audio capture failed:', error);
      return {
        success: false,
        error: error.message
      };
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
