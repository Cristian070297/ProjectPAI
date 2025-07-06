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
      // Use prefixed version for better compatibility
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('AudioContext initialized:', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
        baseLatency: this.audioContext.baseLatency,
        outputLatency: this.audioContext.outputLatency
      });

      return this.audioContext;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
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
      
      // Check if Electron APIs are available
      if (!window.electron || !window.electron.ipcRenderer) {
        throw new Error('Electron APIs not available');
      }

      // Request system audio sources from main process
      const audioSources = await window.electron.ipcRenderer.invoke('get-system-audio-sources', {
        types: ['screen', 'window'],
        fetchWindowIcons: false
      });

      console.log('Available audio sources from Electron:', audioSources?.length || 0);

      if (!audioSources || audioSources.length === 0) {
        console.warn('No audio sources available from Electron');
        return null;
      }

      // Find the best audio source for system audio
      const audioSource = audioSources.find(source => 
        source.name.toLowerCase().includes('entire screen') ||
        source.name.toLowerCase().includes('screen 1') ||
        source.name.toLowerCase().includes('primary') ||
        source.name.toLowerCase().includes('desktop')
      ) || audioSources[0];

      console.log('Selected audio source:', audioSource?.name);

      // Try to capture with the selected source
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: audioSource.id
            },
            optional: [
              { echoCancellation: false },
              { noiseSuppression: false },
              { autoGainControl: false },
              { googEchoCancellation: false },
              { googNoiseSuppression: false },
              { googAutoGainControl: false },
              { googHighpassFilter: false }
            ]
          }
        });

        console.log('Electron audio capture successful');
        return stream;
      } catch (streamError) {
        console.warn('Failed to create stream with Electron source:', streamError.message);
        return null;
      }

    } catch (error) {
      console.warn('Electron audio capture failed:', error.message);
      return null;
    }
  }

  async captureWithDisplayMedia(config) {
    try {
      console.log('Attempting display media audio capture...');
      
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia is not supported in this browser');
      }

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
          suppressLocalAudioPlayback: false, // Capture even when muted
          sampleRate: config.sampleRate || 48000,
          channelCount: config.channels || 2
        }
      };

      console.log('Requesting display media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      console.log('Display media stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Always remove video tracks since we only need audio
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

      return stream;
    } catch (error) {
      console.error('Display media capture failed:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing was denied. Please allow screen sharing and ensure "Share system audio" is selected.');
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

  // Enhanced method with multiple fallback strategies
  async captureAudioWithFallbacks(options = {}) {
    const config = {
      quality: options.quality || 'high',
      channels: options.channels || 2,
      sampleRate: options.sampleRate || 48000,
      bitDepth: options.bitDepth || 16,
      duration: options.duration || 0,
      preferSystemAudio: options.preferSystemAudio || false,
      allowMicrophoneFallback: options.allowMicrophoneFallback !== false,
      ...options
    };

    const attempts = [];
    let lastError = null;

    try {
      await this.initializeAudioContext();
      
      // Strategy 1: Native system audio (if supported)
      if (config.preferSystemAudio && window.electron && window.electron.ipcRenderer) {
        try {
          console.log('Attempting native system audio capture...');
          const stream = await this.captureWithElectron(config);
          if (stream) {
            const result = await this.processAudioStream(stream, config);
            return {
              ...result,
              isSystemAudio: true,
              captureMethod: 'native'
            };
          }
        } catch (error) {
          console.warn('Native system audio failed:', error);
          attempts.push({ method: 'native', error: error.message });
          lastError = error;
        }
      }

      // Strategy 2: Display media with system audio
      if (config.preferSystemAudio) {
        try {
          console.log('Attempting display media system audio capture...');
          const stream = await this.captureWithDisplayMedia(config);
          const result = await this.processAudioStream(stream, config);
          return {
            ...result,
            isSystemAudio: true,
            captureMethod: 'display-media'
          };
        } catch (error) {
          console.warn('Display media system audio failed:', error);
          attempts.push({ method: 'display-media', error: error.message });
          lastError = error;
        }
      }

      // Strategy 3: Microphone fallback (if allowed)
      if (config.allowMicrophoneFallback) {
        try {
          console.log('Attempting microphone fallback...');
          const stream = await this.captureWithMicrophone(config);
          const result = await this.processAudioStream(stream, config);
          return {
            ...result,
            isSystemAudio: false,
            captureMethod: 'microphone'
          };
        } catch (error) {
          console.warn('Microphone fallback failed:', error);
          attempts.push({ method: 'microphone', error: error.message });
          lastError = error;
        }
      }

      // If all strategies failed, provide comprehensive error
      const errorMessage = this.buildComprehensiveErrorMessage(attempts, config);
      throw new Error(errorMessage);

    } catch (error) {
      console.error('All audio capture strategies failed:', error);
      throw error;
    }
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

      if (hasPermissionError) {
        message += 'Please grant screen sharing permission and enable "Share system audio" in the browser dialog. ';
      } else if (hasDeviceError && isWindows) {
        message += 'No system audio devices found. Enable "Stereo Mix" in Windows Sound settings or install VB-Cable. ';
      } else {
        message += 'System audio capture is not available. ';
      }
    }

    if (!config.allowMicrophoneFallback) {
      message += 'Try enabling microphone fallback or check the audio setup guide.';
    } else {
      message += 'Microphone fallback also failed. Please check your audio permissions.';
    }

    return message;
  }

  async processAudioStream(stream, config) {
    try {
      // Create audio processing nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();

      // Configure analyser for real-time audio analysis
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.3;

      // Connect audio nodes
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);

      // Set initial gain (amplification)
      this.gainNode.gain.value = config.gain || 1.0;

      // Create MediaRecorder for audio capture
      const mimeType = this.getBestMimeType();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: config.bitRate || 256000
      });

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
        mimeType: mimeType,
        analyserSize: this.analyserNode.fftSize
      });

      return {
        stream: stream,
        audioContext: this.audioContext,
        sourceNode: this.sourceNode,
        gainNode: this.gainNode,
        analyserNode: this.analyserNode,
        mediaRecorder: this.mediaRecorder
      };
    } catch (error) {
      console.error('Audio stream processing failed:', error);
      throw error;
    }
  }

  getBestMimeType() {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/webm',
      'audio/mp4;codecs=aac',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Selected MIME type:', mimeType);
        return mimeType;
      }
    }

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
}

export default SystemAudioService;
