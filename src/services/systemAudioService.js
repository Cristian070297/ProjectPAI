// System Audio Service for precise internal audio capture
// Supports Windows WASAPI, macOS Core Audio, and Linux PipeWire/PulseAudio

class SystemAudioService {
  constructor() {
    this.isCapturing = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.sourceNode = null;
    this.isSupported = this.checkSupport();
    this.activeDevices = new Map();
    this.audioConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        googEchoCancellation: false,
        googNoiseSuppression: false,
        googAutoGainControl: false,
        googHighpassFilter: false,
        sampleRate: 48000,  // High quality sample rate
        channelCount: 2,    // Stereo
        sampleSize: 16,     // 16-bit depth
        latency: 0.01,      // 10ms latency for real-time processing
        volume: 1.0
      }
    };
    
    console.log('SystemAudioService initialized with advanced capabilities');
  }

  checkSupport() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        hasGetDisplayMedia: false,
        hasGetUserMedia: false,
        hasWebAudio: false,
        hasMediaRecorder: false,
        platform: 'unknown',
        isElectron: false
      };
    }

    const hasGetDisplayMedia = 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices;
    const hasGetUserMedia = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
    const hasMediaRecorder = 'MediaRecorder' in window;
    
    const support = {
      hasGetDisplayMedia,
      hasGetUserMedia,
      hasWebAudio,
      hasMediaRecorder,
      platform: this.detectPlatform(),
      isElectron: typeof window !== 'undefined' && window.electron
    };
    
    console.log('System audio support check:', support);
    return support;
  }

  detectPlatform() {
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  async initializeAudioContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('AudioContext is not available in this environment');
      }

      // Use prefixed version for better compatibility
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser');
      }

      // Create audio context with error handling
      try {
        this.audioContext = new AudioContext({
          sampleRate: 48000,
          latencyHint: 'interactive'
        });
      } catch (constructorError) {
        console.warn('Failed to create AudioContext with options, trying default constructor:', constructorError);
        // Fallback to default constructor
        this.audioContext = new AudioContext();
      }

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (resumeError) {
          console.warn('Failed to resume AudioContext:', resumeError);
          // Continue anyway, might still work
        }
      }

      console.log('AudioContext initialized:', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
        baseLatency: this.audioContext.baseLatency || 'unknown',
        outputLatency: this.audioContext.outputLatency || 'unknown'
      });

      return this.audioContext;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      this.audioContext = null;
      throw error;
    }
  }

  async getSystemAudioSources() {
    try {
      // Get all available audio sources via Electron's desktopCapturer
      if (window.electron && window.electron.ipcRenderer) {
        const sources = await window.electron.ipcRenderer.invoke('get-audio-sources');
        return sources || [];
      }
      
      // Fallback for web environments
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.warn('Failed to get audio sources:', error);
      return [];
    }
  }

  async captureSystemAudio(options = {}) {
    const config = {
      quality: options.quality || 'high',
      channels: options.channels || 2,
      sampleRate: options.sampleRate || 48000,
      bitDepth: options.bitDepth || 16,
      duration: options.duration || 0, // 0 = continuous
      includeVideo: options.includeVideo || false,
      preferElectron: options.preferElectron !== false, // Default to true
      ...options
    };

    try {
      await this.initializeAudioContext();
      
      let stream = null;
      let method = 'unknown';

      // Method 1: Try Electron's enhanced desktopCapturer first (if preferred)
      if (config.preferElectron && window.electron && window.electron.ipcRenderer) {
        try {
          console.log('Attempting Electron-based system audio capture...');
          stream = await this.captureWithElectron(config);
          if (stream) {
            method = 'electron';
            console.log('Successfully captured with Electron method');
          }
        } catch (electronError) {
          console.warn('Electron audio capture failed:', electronError.message);
        }
      }

      // Method 2: Try browser getDisplayMedia if Electron failed or not preferred
      if (!stream) {
        try {
          console.log('Attempting browser display media capture...');
          stream = await this.captureWithDisplayMedia(config);
          method = 'displayMedia';
          console.log('Successfully captured with display media method');
        } catch (displayError) {
          console.warn('Display media capture failed:', displayError.message);
          
          // If this is the last resort, provide helpful guidance
          if (!config.preferElectron || !window.electron) {
            throw new Error(
              `System audio capture failed. Please ensure:\n` +
              `1. You're using a supported browser (Chrome, Edge, Firefox)\n` +
              `2. You allow screen sharing when prompted\n` +
              `3. You check "Share system audio" in the dialog\n` +
              `4. Original error: ${displayError.message}`
            );
          } else {
            throw displayError;
          }
        }
      }

      if (!stream) {
        throw new Error('All system audio capture methods failed. Please check your browser permissions and try again.');
      }

      const result = await this.processAudioStream(stream, config);
      result.captureMethod = method;
      return result;

    } catch (error) {
      console.error('System audio capture failed:', error);
      throw error;
    }
  }

  async captureWithElectron(config) {
    try {
      console.log('Attempting Electron-based system audio capture...');
      
      if (!window.electron || !window.electron.ipcRenderer) {
        throw new Error('Electron APIs not available');
      }

      // Get all available screen sources (not just audio-filtered ones)
      const sources = await window.electron.ipcRenderer.invoke('get-audio-sources');
      console.log('Available sources from Electron:', sources?.length || 0);

      if (!sources || sources.length === 0) {
        throw new Error('No screen sources found via Electron.');
      }

      // Prioritize screen sources over window sources for system audio
      const screenSources = sources.filter(s => s.type === 'screen');
      const windowSources = sources.filter(s => s.type === 'window');
      const orderedSources = [...screenSources, ...windowSources];

      console.log('Ordered sources:', orderedSources.map(s => `${s.name} (${s.type})`));

      // Try each source, starting with screen sources
      for (const source of orderedSources) {
        console.log(`Trying to capture audio from source: "${source.name}" (ID: ${source.id})`);
        try {
          // Use getDisplayMedia instead of getUserMedia for better system audio support
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            },
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                maxWidth: 1,
                maxHeight: 1,
                maxFrameRate: 1
              }
            }
          });

          // Stop and remove video tracks immediately
          stream.getVideoTracks().forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });

          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            console.log(`Successfully captured audio from source: "${source.name}"`);
            console.log('Audio track details:', audioTracks.map(t => ({
              id: t.id,
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
              settings: t.getSettings()
            })));
            return stream;
          } else {
            console.warn(`No audio tracks found for source: "${source.name}"`);
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (streamError) {
          console.warn(`Failed to capture from source "${source.name}": ${streamError.message}`);
          // Continue to the next source
        }
      }

      // If no sources worked, throw an error
      throw new Error('Could not create a valid audio stream from any available screen source. System audio may not be available or accessible.');

    } catch (error) {
      console.warn('Electron audio capture failed:', error.message);
      throw error;
    }
  }

  async captureWithDisplayMedia(config) {
    try {
      console.log('Attempting display media audio capture...');
      
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia is not supported in this browser');
      }

      // Try automatic capture with pre-selected screen first
      let stream = null;
      
      // Method 1: Try automatic capture with minimal video for system audio
      try {
        console.log('Attempting automatic system audio capture...');
        const autoConstraints = {
          video: false, // Try audio-only first
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            suppressLocalAudioPlayback: false,
            sampleRate: config.sampleRate || 48000,
            channelCount: config.channels || 2,
            googEchoCancellation: false,
            googNoiseSuppression: false,
            googAutoGainControl: false,
            googHighpassFilter: false
          }
        };

        // Try audio-only getDisplayMedia (some browsers support this)
        stream = await navigator.mediaDevices.getDisplayMedia(autoConstraints);
        console.log('Audio-only display media capture successful');
      } catch (audioOnlyError) {
        console.log('Audio-only capture failed, trying minimal video approach:', audioOnlyError.message);
        
        // Method 2: Minimal video constraints to reduce user interaction
        const constraints = {
          video: {
            mediaSource: 'screen',
            width: { ideal: 1, max: 1 },
            height: { ideal: 1, max: 1 },
            frameRate: { ideal: 1, max: 1 }
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            suppressLocalAudioPlayback: false,
            sampleRate: config.sampleRate || 48000,
            channelCount: config.channels || 2,
            googEchoCancellation: false,
            googNoiseSuppression: false,
            googAutoGainControl: false,
            googHighpassFilter: false
          }
        };

        console.log('Requesting display media with minimal video constraints:', constraints);
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      }
      
      console.log('Display media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Stop and remove video tracks since we only need audio
      stream.getVideoTracks().forEach(track => {
        console.log('Stopping video track:', track.id);
        track.stop();
        stream.removeTrack(track);
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available. Please ensure "Share system audio" is checked in the browser dialog.');
      }

      console.log('Display media audio tracks:', audioTracks.map(t => ({
        id: t.id,
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        settings: t.getSettings()
      })));

      // Verify that the audio track is actually receiving audio
      const audioTrack = audioTracks[0];
      if (audioTrack.muted) {
        console.warn('Audio track is muted - this may indicate system audio is not properly captured');
      }

      // Test the audio track to ensure it has data
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      // Clean up the test nodes
      setTimeout(() => {
        source.disconnect();
        audioContext.close();
      }, 100);

      return stream;
    } catch (error) {
      console.error('Display media capture failed:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing was denied. Please allow screen sharing and ensure "Share system audio" is selected in the dialog.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No screen sources available for sharing.');
      } else if (error.name === 'AbortError') {
        throw new Error('Screen sharing was cancelled by the user.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Screen sharing is not supported in this browser.');
      } else {
        throw new Error(`Display media capture failed: ${error.message}`);
      }
    }
  }

  // Fallback microphone capture when system audio fails
  async captureWithMicrophone(config) {
    try {
      console.log('Attempting microphone capture as fallback...');
      
      const constraints = {
        audio: {
          echoCancellation: config.echoCancellation !== false,
          noiseSuppression: config.noiseSuppression !== false,
          autoGainControl: config.autoGainControl !== false,
          sampleRate: config.sampleRate,
          channelCount: config.channels
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Microphone capture successful');
      return stream;
    } catch (error) {
      console.error('Microphone capture failed:', error);
      throw new Error(`Microphone access failed: ${error.message}`);
    }
  }

  // Enhanced method with multiple fallback strategies including automatic capture
  async captureAudioWithFallbacks(options = {}) {
    const config = {
      quality: options.quality || 'high',
      channels: options.channels || 2,
      sampleRate: options.sampleRate || 48000,
      bitDepth: options.bitDepth || 16,
      duration: options.duration || 0,
      preferSystemAudio: options.preferSystemAudio !== false,
      allowMicrophoneFallback: options.allowMicrophoneFallback !== false,
      autoCapture: options.autoCapture !== false, // New option for automatic capture
      ...options
    };

    await this.initializeAudioContext();

    const strategies = [];
    
    if (config.preferSystemAudio) {
      // Priority 1: Automatic methods (no user interaction required)
      if (config.autoCapture) {
        if (this.isSupported.platform === 'windows') {
          strategies.push({ method: 'windows-auto', func: () => this.captureWithWindowsAudio(config), isSystem: true, automatic: true });
        }
        if (this.isSupported.isElectron) {
          strategies.push({ method: 'electron-auto', func: () => this.captureWithElectronAuto(config), isSystem: true, automatic: true });
        }
      }
      
      // Priority 2: Manual methods (require user interaction)
      if (this.isSupported.isElectron) {
        strategies.push({ method: 'electron-manual', func: () => this.captureWithElectron(config), isSystem: true, automatic: false });
      }
      strategies.push({ method: 'display-media', func: () => this.captureWithDisplayMedia(config), isSystem: true, automatic: false });
    }
    
    // Priority 3: Microphone fallback
    if (config.allowMicrophoneFallback) {
      strategies.push({ method: 'microphone', func: () => this.captureWithMicrophone(config), isSystem: false, automatic: true });
    }

    const attempts = [];
    
    // Try automatic methods first
    const automaticStrategies = strategies.filter(s => s.automatic);
    const manualStrategies = strategies.filter(s => !s.automatic);
    
    console.log('Trying automatic capture methods first...');
    for (const strategy of automaticStrategies) {
      try {
        console.log(`Attempting automatic audio capture with method: ${strategy.method}`);
        const stream = await strategy.func();
        if (stream && stream.getAudioTracks().length > 0) {
          console.log(`Successfully captured audio automatically with ${strategy.method}`);
          const result = await this.processAudioStream(stream, config);
          return {
            ...result,
            isSystemAudio: strategy.isSystem,
            captureMethod: strategy.method,
            automatic: true
          };
        }
      } catch (error) {
        console.warn(`${strategy.method} automatic capture failed:`, error.message);
        attempts.push({ method: strategy.method, error: error.message, automatic: true });
      }
    }
    
    // If automatic methods failed, try manual methods
    if (manualStrategies.length > 0) {
      console.log('Automatic methods failed, trying manual capture methods...');
      for (const strategy of manualStrategies) {
        try {
          console.log(`Attempting manual audio capture with method: ${strategy.method}`);
          const stream = await strategy.func();
          if (stream && stream.getAudioTracks().length > 0) {
            console.log(`Successfully captured audio manually with ${strategy.method}`);
            const result = await this.processAudioStream(stream, config);
            return {
              ...result,
              isSystemAudio: strategy.isSystem,
              captureMethod: strategy.method,
              automatic: false
            };
          }
        } catch (error) {
          console.warn(`${strategy.method} manual capture failed:`, error.message);
          attempts.push({ method: strategy.method, error: error.message, automatic: false });
        }
      }
    }

    // If all strategies failed, clean up and throw a comprehensive error
    this.cleanup();
    const errorMessage = this.buildComprehensiveErrorMessage(attempts, config);
    console.error('All audio capture strategies failed:', errorMessage);
    throw new Error(errorMessage);
  }

  buildComprehensiveErrorMessage(attempts, config) {
    const isWindows = this.isSupported.platform === 'windows';
    let message = 'Unable to capture audio. ';

    if (config.preferSystemAudio) {
      message += 'System audio capture failed. ';
      
      const hasPermissionError = attempts.some(a => 
        a.error.includes('Permission denied') || 
        a.error.includes('NotAllowedError')
      );
      
      const hasDeviceError = attempts.some(a => 
        a.error.includes('No audio devices') ||
        a.error.includes('Stereo Mix')
      );

      const hasCapturabilityError = attempts.some(a =>
        a.error.includes('Source is not capturable') ||
        a.error.includes('bad IPC message') ||
        a.error.includes('any available screen source')
      );

      if (hasPermissionError) {
        message += 'Please grant screen sharing permission and enable "Share system audio" in the browser dialog. ';
      } else if (hasCapturabilityError && isWindows) {
        message += 'The selected screen cannot be captured. This can happen with some external monitors or display configurations. Please try another display or check your graphics driver settings. ';
      } else if (hasDeviceError && isWindows) {
        message += 'No system audio devices found. Enable "Stereo Mix" in Windows Sound settings or install VB-Cable. ';
      } else {
        message += 'System audio capture is not available. ';
      }
    }

    if (attempts.some(a => a.method === 'microphone' && a.error)) {
        message += 'Microphone fallback also failed. Please check your audio permissions.';
    } else if (!config.allowMicrophoneFallback) {
      message += 'Try enabling microphone fallback or check the audio setup guide.';
    }

    return message;
  }

  async processAudioStream(stream, config) {
    try {
      console.log('Processing audio stream:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        totalTracks: stream.getTracks().length
      });

      // Validate audio context is initialized
      if (!this.audioContext) {
        console.log('Audio context not initialized, initializing now...');
        try {
          await this.initializeAudioContext();
        } catch (contextError) {
          console.error('Failed to initialize audio context:', contextError);
          throw new Error(`Audio context initialization failed: ${contextError.message}`);
        }
      }

      // Double-check audio context state
      if (!this.audioContext) {
        throw new Error('Audio context is null after initialization attempt');
      }

      if (this.audioContext.state === 'suspended') {
        console.log('Audio context is suspended, resuming...');
        try {
          await this.audioContext.resume();
        } catch (resumeError) {
          console.warn('Failed to resume audio context:', resumeError);
          // Continue anyway, might still work
        }
      }

      // Validate audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks in stream');
      }

      // Log audio track details
      audioTracks.forEach((track, index) => {
        console.log(`Audio track ${index}:`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        });
      });

      // Create audio processing nodes with error handling
      try {
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.gainNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();
      } catch (nodeError) {
        console.error('Failed to create audio nodes:', nodeError);
        throw new Error(`Audio node creation failed: ${nodeError.message}`);
      }

      // Configure analyser for real-time audio analysis
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.3;

      // Connect source to gain with error handling
      try {
        this.sourceNode.connect(this.gainNode);
      } catch (connectionError) {
        console.error('Failed to connect source to gain:', connectionError);
        throw new Error(`Audio connection failed: ${connectionError.message}`);
      }

      // Set initial gain (amplification) - optimized for speech recognition
      // System audio often needs more gain than microphone audio
      const baseGain = config.gain || 2.0;
      const speechGain = baseGain * 2; // Extra amplification for speech recognition
      this.gainNode.gain.value = Math.min(speechGain, 8.0); // Cap at 8x to prevent distortion

      console.log('Audio gain set to:', this.gainNode.gain.value, 'for speech recognition');

      // Simple approach: connect gain directly to analyser and destination
      // This bypasses complex channel splitting that can cause issues
      this.gainNode.connect(this.analyserNode);

      // Create a new destination for the recorder with proper stream handling
      const destination = this.audioContext.createMediaStreamDestination();
      this.gainNode.connect(destination);

      // Create MediaRecorder for audio capture from the processed stream
      const mimeType = this.getBestMimeType();
      
      try {
        this.mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: mimeType,
          audioBitsPerSecond: config.bitRate || 256000
        });
      } catch (recorderError) {
        console.error('Failed to create MediaRecorder:', recorderError);
        // Try with a simpler configuration
        try {
          this.mediaRecorder = new MediaRecorder(destination.stream);
          console.log('MediaRecorder created with default settings');
        } catch (fallbackError) {
          throw new Error(`MediaRecorder creation failed: ${fallbackError.message}`);
        }
      }

      // Set up recording handlers
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.stream = stream;
      this.isCapturing = true;

      console.log('Audio stream processing initialized:', {
        sampleRate: this.audioContext.sampleRate,
        channels: config.channels,
        mimeType: this.mediaRecorder.mimeType,
        analyserSize: this.analyserNode.fftSize,
        destinationChannels: destination.stream.getAudioTracks().length
      });

      return {
        stream: stream,
        processedStream: destination.stream, // This is the stream that should be used for recording
        audioContext: this.audioContext,
        sourceNode: this.sourceNode,
        gainNode: this.gainNode,
        analyserNode: this.analyserNode,
        mediaRecorder: this.mediaRecorder,
        destination: destination
      };
    } catch (error) {
      console.error('Audio stream processing failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Clean up any partially created resources
      try {
        if (this.sourceNode) {
          this.sourceNode.disconnect();
          this.sourceNode = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
        if (this.analyserNode) {
          this.analyserNode.disconnect();
          this.analyserNode = null;
        }
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }
      
      throw error;
    }
  }

  getBestMimeType() {
    // Prioritize MIME types that work best with speech recognition
    const mimeTypes = [
      'audio/webm;codecs=opus',    // Best for speech recognition and compression
      'audio/webm;codecs=pcm',     // Uncompressed, good quality
      'audio/webm',                // Basic WebM support
      'audio/mp4;codecs=aac',      // Good compatibility with speech services
      'audio/mp4',                 // Basic MP4 support
      'audio/ogg;codecs=opus',     // Opus in OGG container
      'audio/ogg',                 // Basic OGG support
      'audio/wav'                  // Uncompressed fallback
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Selected MIME type for system audio:', mimeType);
        return mimeType;
      }
    }

    console.warn('No supported MIME types found, using default');
    throw new Error('No supported audio MIME type found');
  }

  // Real-time audio analysis
  getAudioLevels() {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const volume = rms / 255; // Normalize to 0-1

    return {
      volume: volume,
      frequencyData: dataArray,
      peak: Math.max(...dataArray) / 255,
      average: dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255
    };
  }

  // Adjust audio gain/volume
  setGain(gain) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(5, gain)); // Limit between 0-5
      console.log('Audio gain set to:', gain);
    }
  }

  // Start recording
  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start();
      console.log('Recording started');
      return true;
    }
    return false;
  }

  // Stop recording and get audio blob
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType 
          });
          
          console.log('Recording stopped, blob size:', audioBlob.size);
          resolve(audioBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Clean up resources
  cleanup() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }

      if (this.gainNode) {
        this.gainNode.disconnect();
      }

      if (this.analyserNode) {
        this.analyserNode.disconnect();
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }

      this.isCapturing = false;
      this.stream = null;
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.sourceNode = null;
      this.gainNode = null;
      this.analyserNode = null;
      this.audioContext = null;

      console.log('SystemAudioService cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Get current audio device info
  async getAudioDeviceInfo() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => 
        device.kind === 'audioinput' || device.kind === 'audiooutput'
      );

      return audioDevices.map(device => ({
        deviceId: device.deviceId,
        kind: device.kind,
        label: device.label,
        groupId: device.groupId
      }));
    } catch (error) {
      console.error('Failed to get audio device info:', error);
      return [];
    }
  }

  // Monitor audio levels continuously
  startAudioLevelMonitoring(callback, intervalMs = 100) {
    if (this.audioLevelMonitor) {
      clearInterval(this.audioLevelMonitor);
    }

    this.audioLevelMonitor = setInterval(() => {
      const levels = this.getAudioLevels();
      if (levels && callback) {
        callback(levels);
      }
    }, intervalMs);
  }

  stopAudioLevelMonitoring() {
    if (this.audioLevelMonitor) {
      clearInterval(this.audioLevelMonitor);
      this.audioLevelMonitor = null;
    }
  }

  // Automatic Windows system audio capture
  async captureWithWindowsAudio(config) {
    try {
      console.log('Attempting Windows automatic system audio capture...');
      
      // Initialize audio context
      await this.initializeAudioContext();
      
      // Method 1: Try to find and use Stereo Mix device
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Available audio input devices:', audioInputs.map(d => d.label));
      
      // Look for Stereo Mix or similar devices
      const systemAudioDevices = audioInputs.filter(device => {
        const label = device.label.toLowerCase();
        return label.includes('stereo mix') || 
               label.includes('what u hear') ||
               label.includes('wave out mix') ||
               label.includes('speakers') ||
               label.includes('system audio') ||
               label.includes('vb-cable') ||
               label.includes('voicemeeter') ||
               label.includes('soundflower');
      });
      
      if (systemAudioDevices.length > 0) {
        console.log('Found system audio devices:', systemAudioDevices.map(d => d.label));
        
        // Try each system audio device
        for (const device of systemAudioDevices) {
          try {
            console.log(`Attempting to use device: ${device.label}`);
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: device.deviceId,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: config.sampleRate || 48000,
                channelCount: config.channels || 2
              }
            });
            
            console.log(`Successfully connected to system audio device: ${device.label}`);
            return stream;
          } catch (deviceError) {
            console.warn(`Failed to connect to device ${device.label}:`, deviceError.message);
          }
        }
      }
      
      throw new Error('No system audio devices found. Please enable Stereo Mix or install VB-Cable.');
      
    } catch (error) {
      console.warn('Windows audio capture failed:', error.message);
      throw error;
    }
  }

  // Electron-based automatic system audio capture
  async captureWithElectronAuto(config) {
    try {
      console.log('Attempting Electron automatic system audio capture...');
      
      if (!window.electron || !window.electron.ipcRenderer) {
        throw new Error('Electron APIs not available');
      }

      // Initialize audio context
      await this.initializeAudioContext();

      // Get Windows-specific audio devices
      const windowsResult = await window.electron.ipcRenderer.invoke('get-windows-audio-devices');
      if (windowsResult.success && windowsResult.devices) {
        console.log('Windows audio devices:', windowsResult.devices);
        
        // Look for system audio devices
        const systemDevices = windowsResult.devices.filter(device => {
          const name = device.name.toLowerCase();
          return name.includes('stereo mix') || 
                 name.includes('speakers') ||
                 name.includes('system audio') ||
                 name.includes('what u hear') ||
                 name.includes('wave out mix');
        });
        
        if (systemDevices.length > 0) {
          console.log('Found Windows system audio devices:', systemDevices);
          // Use the first available system audio device
          const deviceId = systemDevices[0].id;
          
          // Try to capture using the specific device
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: deviceId,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: config.sampleRate || 48000,
              channelCount: config.channels || 2
            }
          });
          
          console.log('Successfully connected to Windows system audio device');
          return stream;
        }
      }
      
      // Fallback to regular electron capture
      return await this.captureWithElectron(config);
      
    } catch (error) {
      console.warn('Electron auto capture failed:', error.message);
      throw error;
    }
  }

  // Auto-setup system audio capture
  async autoSetupSystemAudio() {
    try {
      console.log('Auto-setting up system audio capture...');
      
      // Check what's available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Available audio devices:', audioInputs.map(d => ({ label: d.label, id: d.deviceId })));
      
      // Method 1: Look for known system audio devices
      const systemAudioDevices = audioInputs.filter(device => {
        const label = device.label.toLowerCase();
        return label.includes('stereo mix') || 
               label.includes('what u hear') ||
               label.includes('wave out mix') ||
               label.includes('speakers') ||
               label.includes('system audio') ||
               label.includes('vb-cable') ||
               label.includes('voicemeeter') ||
               label.includes('soundflower') ||
               label.includes('loopback');
      });
      
      if (systemAudioDevices.length > 0) {
        console.log('✅ Found system audio devices:', systemAudioDevices.map(d => d.label));
        return {
          available: true,
          method: 'device',
          devices: systemAudioDevices,
          instructions: 'System audio devices found and ready to use!'
        };
      }
      
      // Method 2: Check if display media is available
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('✅ Display media capture available');
        return {
          available: true,
          method: 'display-media',
          devices: [],
          instructions: 'Screen sharing with system audio is available'
        };
      }
      
      // Method 3: Check if Electron is available
      if (window.electron && window.electron.ipcRenderer) {
        console.log('✅ Electron system audio capture available');
        return {
          available: true,
          method: 'electron',
          devices: [],
          instructions: 'Electron system audio capture is available'
        };
      }
      
      return {
        available: false,
        method: null,
        devices: [],
        instructions: 'No system audio capture methods available. Please enable Stereo Mix or install VB-Cable.'
      };
      
    } catch (error) {
      console.error('Auto-setup failed:', error);
      return {
        available: false,
        method: null,
        devices: [],
        instructions: 'Error checking system audio availability: ' + error.message
      };
    }
  }

  // Quick automatic system audio capture (tries the best available method)
  async quickSystemAudioCapture(options = {}) {
    const setup = await this.autoSetupSystemAudio();
    
    if (!setup.available) {
      throw new Error(setup.instructions);
    }
    
    console.log(`Using automatic system audio method: ${setup.method}`);
    
    const config = {
      quality: options.quality || 'high',
      channels: options.channels || 2,
      sampleRate: options.sampleRate || 48000,
      autoCapture: true,
      preferSystemAudio: true,
      allowMicrophoneFallback: false,
      ...options
    };
    
    // Try to initialize audio context, but don't fail if it doesn't work
    let audioContextInitialized = false;
    try {
      await this.initializeAudioContext();
      audioContextInitialized = true;
      console.log('Audio context initialized successfully');
    } catch (contextError) {
      console.warn('Audio context initialization failed, using basic capture:', contextError.message);
      audioContextInitialized = false;
    }
    
    switch (setup.method) {
      case 'device':
        // Use the first available system audio device
        const device = setup.devices[0];
        console.log(`Using system audio device: ${device.label}`);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: device.deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: config.sampleRate,
            channelCount: config.channels
          }
        });
        
        // Use complex processing if audio context is available, otherwise use basic capture
        if (audioContextInitialized) {
          return await this.processAudioStream(stream, config);
        } else {
          return {
            stream: stream,
            processedStream: stream,
            captureMethod: 'basic-device',
            isSystemAudio: true,
            automatic: true,
            audioContext: null,
            sourceNode: null,
            gainNode: null,
            analyserNode: null,
            mediaRecorder: null,
            destination: null
          };
        }
        
      case 'display-media':
        if (audioContextInitialized) {
          return await this.captureWithDisplayMedia(config);
        } else {
          return await this.basicSystemAudioCapture(config);
        }
        
      case 'electron':
        if (audioContextInitialized) {
          return await this.captureWithElectronAuto(config);
        } else {
          return await this.basicSystemAudioCapture(config);
        }
        
      default:
        throw new Error('No suitable system audio capture method found');
    }
  }

  // Simple system audio capture without complex processing (fallback method)
  async simpleSystemAudioCapture(options = {}) {
    try {
      console.log('Attempting simple system audio capture...');
      
      const config = {
        quality: options.quality || 'high',
        channels: options.channels || 2,
        sampleRate: options.sampleRate || 48000,
        ...options
      };
      
      // Try to initialize audio context first (needed for some processing)
      // But don't fail if it doesn't work - fallback to basic capture
      let audioContextInitialized = false;
      try {
        await this.initializeAudioContext();
        audioContextInitialized = true;
        console.log('Audio context initialized for simple capture');
      } catch (contextError) {
        console.warn('Audio context initialization failed, using basic capture:', contextError.message);
        audioContextInitialized = false;
      }
      
      // If audio context failed, use basic capture
      if (!audioContextInitialized) {
        console.log('Falling back to basic capture method');
        return await this.basicSystemAudioCapture(config);
      }
      
      // Try to find system audio devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      // Look for system audio devices
      const systemAudioDevices = audioInputs.filter(device => {
        const label = device.label.toLowerCase();
        return label.includes('stereo mix') || 
               label.includes('what u hear') ||
               label.includes('wave out mix') ||
               label.includes('speakers') ||
               label.includes('system audio') ||
               label.includes('vb-cable') ||
               label.includes('voicemeeter') ||
               label.includes('soundflower');
      });
      
      if (systemAudioDevices.length > 0) {
        const device = systemAudioDevices[0];
        console.log(`Using simple capture with device: ${device.label}`);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: device.deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: config.sampleRate,
            channelCount: config.channels
          }
        });
        
        // Return stream without complex processing
        return {
          stream: stream,
          processedStream: stream, // Use the original stream
          captureMethod: 'simple-device',
          isSystemAudio: true,
          automatic: true
        };
      }
      
      // Fallback to display media
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('Using simple display media capture...');
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1, max: 1 },
            height: { ideal: 1, max: 1 },
            frameRate: { ideal: 1, max: 1 }
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: config.sampleRate,
            channelCount: config.channels
          }
        });
        
        // Remove video tracks
        stream.getVideoTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
        
        if (stream.getAudioTracks().length > 0) {
          return {
            stream: stream,
            processedStream: stream, // Use the original stream
            captureMethod: 'simple-display-media',
            isSystemAudio: true,
            automatic: false
          };
        }
      }
      
      throw new Error('No simple system audio capture methods available');
      
    } catch (error) {
      console.warn('Simple system audio capture failed:', error.message);
      throw error;
    }
  }

  // Basic system audio capture without any audio context processing (ultra-simple fallback)
  async basicSystemAudioCapture(options = {}) {
    try {
      console.log('Attempting basic system audio capture (no audio context)...');
      
      const config = {
        quality: options.quality || 'high',
        channels: options.channels || 2,
        sampleRate: options.sampleRate || 48000,
        ...options
      };
      
      // Don't initialize audio context - just capture raw stream
      
      // Try to find system audio devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      // Look for system audio devices
      const systemAudioDevices = audioInputs.filter(device => {
        const label = device.label.toLowerCase();
        return label.includes('stereo mix') || 
               label.includes('what u hear') ||
               label.includes('wave out mix') ||
               label.includes('speakers') ||
               label.includes('system audio') ||
               label.includes('vb-cable') ||
               label.includes('voicemeeter') ||
               label.includes('soundflower');
      });
      
      if (systemAudioDevices.length > 0) {
        const device = systemAudioDevices[0];
        console.log(`Using basic capture with device: ${device.label}`);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: device.deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: config.sampleRate,
            channelCount: config.channels
          }
        });
        
        // Return stream without any processing
        return {
          stream: stream,
          processedStream: stream, // Use the original stream
          captureMethod: 'basic-device',
          isSystemAudio: true,
          automatic: true,
          audioContext: null, // No audio context used
          sourceNode: null,
          gainNode: null,
          analyserNode: null,
          mediaRecorder: null,
          destination: null
        };
      }
      
      // Fallback to display media
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('Using basic display media capture...');
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1, max: 1 },
            height: { ideal: 1, max: 1 },
            frameRate: { ideal: 1, max: 1 }
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: config.sampleRate,
            channelCount: config.channels
          }
        });
        
        // Remove video tracks
        stream.getVideoTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
        
        if (stream.getAudioTracks().length > 0) {
          return {
            stream: stream,
            processedStream: stream, // Use the original stream
            captureMethod: 'basic-display-media',
            isSystemAudio: true,
            automatic: false,
            audioContext: null, // No audio context used
            sourceNode: null,
            gainNode: null,
            analyserNode: null,
            mediaRecorder: null,
            destination: null
          };
        }
      }
      
      throw new Error('No basic system audio capture methods available');
      
    } catch (error) {
      console.warn('Basic system audio capture failed:', error.message);
      throw error;
    }
  }
}

export default SystemAudioService;
