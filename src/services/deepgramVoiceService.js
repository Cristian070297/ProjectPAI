import { createClient } from '@deepgram/sdk';
import SystemAudioService from './systemAudioService.js';

class DeepgramVoiceService {
  constructor() {
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isSupported = this.checkSupport();
    this.systemAudioService = new SystemAudioService();
    this.audioLevelCallback = null;
    // Note: We don't initialize Deepgram in the renderer process due to CORS
    console.log('DeepgramVoiceService initialized with SystemAudioService integration');
  }

  checkSupport() {
    const hasBasicSupport = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const hasDisplayMedia = 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices;
    const hasElectron = typeof window !== 'undefined' && window.electron;
    
    console.log('Media support check:', {
      hasBasicSupport,
      hasDisplayMedia,
      hasElectron,
      systemAudioSupport: this.systemAudioService?.isSupported,
      userAgent: navigator.userAgent
    });
    
    return hasBasicSupport && (hasDisplayMedia || hasElectron);
  }

  async startListening(onResult, onError, onEnd, useSystemAudio = false) {
    if (!this.isSupported) {
      onError('Audio capture not supported in this browser. Please use a modern browser or the Electron app.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      let stream;
      let audioCapture;

      if (useSystemAudio) {
        console.log('Starting advanced system audio capture...');
        
        // Check permissions first
        if (window.electron && window.electron.ipcRenderer) {
          const permissions = await window.electron.ipcRenderer.invoke('check-audio-permissions');
          console.log('Audio permissions:', permissions);
          
          if (!permissions.systemAudio) {
            console.log('Requesting system audio permissions...');
            const granted = await window.electron.ipcRenderer.invoke('request-audio-permissions');
            if (!granted.systemAudio) {
              throw new Error('System audio permission denied. Please enable screen recording permissions.');
            }
          }
        }

        // Use SystemAudioService for advanced capture
        try {
          console.log('Attempting automatic system audio capture first...');
          
          // Try automatic capture first (no user interaction)
          try {
            audioCapture = await this.systemAudioService.quickSystemAudioCapture({
              quality: 'high',
              channels: 2,
              sampleRate: 48000,
              bitDepth: 16,
              gain: 1.0
            });
            
            stream = audioCapture.stream;
            console.log('✅ Automatic system audio capture successful!');
            
          } catch (autoError) {
            console.log('Automatic capture failed, trying simple method:', autoError.message);
            
            // Try simple capture method (no complex processing)
            try {
              audioCapture = await this.systemAudioService.simpleSystemAudioCapture({
                quality: 'high',
                channels: 2,
                sampleRate: 48000
              });
              
              stream = audioCapture.stream;
              console.log('✅ Simple system audio capture successful!');
              
            } catch (simpleError) {
              console.log('Simple capture failed, trying basic methods:', simpleError.message);
              
              // Try basic capture method (no audio context)
              try {
                audioCapture = await this.systemAudioService.basicSystemAudioCapture({
                  quality: 'high',
                  channels: 2,
                  sampleRate: 48000
                });
                
                stream = audioCapture.stream;
                console.log('✅ Basic system audio capture successful!');
                
              } catch (basicError) {
                console.log('Basic capture failed, trying manual methods:', basicError.message);
                
                // Fallback to manual capture methods
                audioCapture = await this.systemAudioService.captureAudioWithFallbacks({
                  quality: 'high',
                  channels: 2,
                  sampleRate: 48000,
                  bitDepth: 16,
                  gain: 1.0,
                  preferSystemAudio: true,
                  allowMicrophoneFallback: false, // Don't fallback to mic for system audio mode
                  autoCapture: true
                });
                
                stream = audioCapture.stream;
              }
            }
          }
          
          // Start audio level monitoring (if available)
          try {
            this.systemAudioService.startAudioLevelMonitoring((levels) => {
              if (this.audioLevelCallback) {
                this.audioLevelCallback(levels);
              }
            }, 100);
            console.log('Audio level monitoring started');
          } catch (monitorError) {
            console.warn('Audio level monitoring not available (no audio context):', monitorError.message);
            // Continue without audio level monitoring
          }
          
          if (audioCapture.isSystemAudio) {
            console.log(`Advanced system audio capture initialized (method: ${audioCapture.captureMethod})`);
          } else {
            console.log(`Using microphone fallback (method: ${audioCapture.captureMethod})`);
          }
        } catch (systemError) {
          console.warn('All system audio capture methods failed:', systemError);
          
          // Final fallback to microphone if all else fails
          if (systemError.message.includes('microphone fallback')) {
            // Try microphone one more time with relaxed constraints
            try {
              audioCapture = await this.systemAudioService.captureAudioWithFallbacks({
                quality: 'high',
                channels: 2,
                sampleRate: 48000,
                preferSystemAudio: false,
                allowMicrophoneFallback: true
              });
              
              stream = audioCapture.stream;
              
              this.systemAudioService.startAudioLevelMonitoring((levels) => {
                if (this.audioLevelCallback) {
                  this.audioLevelCallback(levels);
                }
              }, 100);
              
              console.log('Microphone fallback successful');
            } catch (micError) {
              console.error('Final microphone fallback failed:', micError);
              throw systemError; // Throw the original system error with guidance
            }
          } else {
            throw systemError;
          }
        }
      } else {
        // Standard microphone capture
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2
          } 
        });
      }

      if (!stream) {
        throw new Error('Failed to obtain audio stream');
      }

      this.isListening = true;
      this.audioChunks = [];

      // Create MediaRecorder with optimal settings
      const options = this.getOptimalRecordingOptions();
      
      // For system audio, we need to use the processed stream from SystemAudioService
      const recordingStream = audioCapture && audioCapture.processedStream ? audioCapture.processedStream : stream;
      console.log('Using recording stream:', recordingStream.getAudioTracks().length, 'audio tracks');
      
      this.mediaRecorder = new MediaRecorder(recordingStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          
          // Validate audio blob size
          if (audioBlob.size < 1000) { // Less than 1KB is likely empty
            console.warn('Audio blob is too small:', audioBlob.size, 'bytes');
            onError('No speech detected. Please speak clearly and try again.');
            return;
          }
          
          // Check if we captured any audio levels during recording
          if (useSystemAudio && this.systemAudioService) {
            const levels = this.systemAudioService.getAudioLevels();
            if (levels && levels.volume < 0.01) { // Very low volume threshold
              console.warn('Audio levels too low:', levels);
              onError('No audio detected. Please ensure audio is playing and try again.');
              return;
            }
          }
          
          // Always use Electron backend for transcription (avoids CORS issues)
          await this.transcribeWithElectron(audioBlob, onResult, onError);
        } catch (error) {
          console.log('Error processing audio:', error.message);
          onError('Failed to process audio recording. Please try again.');
        }
        
        // Clean up
        this.cleanup();
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.mediaRecorder.onerror = (event) => {
        console.warn('MediaRecorder error:', event);
        onError('Recording error occurred. Please try again.');
        this.cleanup();
        this.isListening = false;
        if (onEnd) onEnd();
      };

      // Start recording
      this.mediaRecorder.start();
      console.log(`Started recording with advanced audio service (${useSystemAudio ? 'System Audio' : 'Microphone'} mode)`);
      
      // Monitor audio levels during recording for debugging
      let audioLevelCheck = null;
      if (useSystemAudio && this.systemAudioService) {
        audioLevelCheck = setInterval(() => {
          const levels = this.systemAudioService.getAudioLevels();
          if (levels) {
            console.log('Audio levels during recording:', {
              volume: levels.volume.toFixed(3),
              peak: levels.peak.toFixed(3),
              average: levels.average.toFixed(3)
            });
          }
        }, 2000); // Check every 2 seconds
        
        // Store the interval reference so it can be cleared when stopping manually
        this.audioLevelCheck = audioLevelCheck;
      }

    } catch (error) {
      console.warn('Error accessing audio:', error.message);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        useSystemAudio: useSystemAudio
      });
      
      this.cleanup();
      this.isListening = false;
      
      if (error.name === 'NotAllowedError') {
        onError(`${useSystemAudio ? 'System audio sharing' : 'Microphone'} access denied. Please allow permissions and try again.`);
      } else if (error.name === 'NotFoundError') {
        onError(`No ${useSystemAudio ? 'screen sources' : 'microphone'} found. Please check your ${useSystemAudio ? 'display' : 'audio'} devices.`);
      } else if (error.name === 'AbortError') {
        onError(`${useSystemAudio ? 'Screen sharing' : 'Microphone access'} was cancelled. Please try again.`);
      } else if (error.name === 'NotSupportedError') {
        onError(`${useSystemAudio ? 'Screen sharing' : 'Microphone'} is not supported in this browser. Please use Chrome, Edge, or Firefox.`);
      } else if (useSystemAudio && error.message.includes('permission')) {
        onError('System audio capture requires screen recording permissions. Please enable them in your system settings.');
      } else if (useSystemAudio && (error.message.includes('audio track') || error.message.includes('Share system audio'))) {
        onError('No system audio detected. Please ensure "Share system audio" is checked when prompted, or try playing some audio first.');
      } else if (useSystemAudio && error.message.includes('getDisplayMedia')) {
        onError('Screen sharing is not available. Please use a supported browser (Chrome, Edge, Firefox) or enable the Electron app.');
      } else {
        const baseMessage = `Failed to access ${useSystemAudio ? 'system audio' : 'microphone'}`;
        const suggestion = useSystemAudio 
          ? 'Try using the microphone button instead, or check browser permissions for screen sharing.'
          : 'Please check your microphone permissions and try again.';
        onError(`${baseMessage}. ${suggestion}`);
      }
    }
  }

  async transcribeWithElectron(audioBlob, onResult, onError) {
    try {
      // Convert blob to base64 using FileReader (more efficient for large files)
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send to electron main process for Deepgram processing
      if (window.electron && window.electron.ipcRenderer) {
        console.log('Sending audio to Electron backend for Deepgram transcription...');
        
        // Generate unique request ID to prevent conflicts
        const requestId = Date.now() + '_' + Math.random().toString(36).substring(2);
        
        // Remove any existing listeners first to prevent accumulation
        window.electron.ipcRenderer.removeAllListeners('transcription-result');
        
        // Create a promise-based approach to avoid event listener issues
        const transcriptionPromise = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            window.electron.ipcRenderer.removeAllListeners('transcription-result');
            reject(new Error('Voice recognition timed out. Please try again.'));
          }, 15000);

          const handleTranscriptionResult = (result) => {
            if (result.requestId === requestId) {
              clearTimeout(timeoutId);
              window.electron.ipcRenderer.removeAllListeners('transcription-result');
              
              if (result.success && result.transcript) {
                console.log('Electron Deepgram transcript:', result.transcript);
                resolve(result.transcript);
              } else {
                console.warn('Transcription failed:', result.error);
                reject(new Error(result.error || 'Voice recognition failed. Please try again.'));
              }
            }
          };

          // Use once to ensure the listener is only called once
          window.electron.ipcRenderer.once('transcription-result', handleTranscriptionResult);
        });

        window.electron.ipcRenderer.send('transcribe-audio', {
          audioData: base64Audio,
          mimeType: audioBlob.type,
          requestId: requestId
        });

        // Wait for the result
        const transcript = await transcriptionPromise;
        onResult(transcript);
        
      } else {
        onError('Voice recognition service not available. Please ensure you are running the Electron app.');
      }
    } catch (error) {
      console.warn('Electron transcription error:', error.message);
      onError(error.message || 'Voice recognition failed. Please try again or type your message.');
    }
  }

  stopListening() {
    if (this.mediaRecorder && this.isListening) {
      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      } catch (error) {
        console.warn('Error stopping recorder:', error.message);
      }
      // Note: cleanup is handled in the onstop event
    }
  }

  // Text-to-Speech functionality (using browser built-in)
  speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Invalid text provided for speech synthesis');
      return;
    }

    try {
      // Cancel any ongoing synthesis
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.1, Math.min(2.0, options.rate || 0.9));
      utterance.pitch = Math.max(0.1, Math.min(2.0, options.pitch || 1));
      utterance.volume = Math.max(0.1, Math.min(1.0, options.volume || 0.8));
      utterance.lang = options.lang || 'en-US';

      // Use provided voice or find a suitable one
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        // Wait for voices to be loaded if they're not available yet
        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            const preferredVoice = voices.find(voice => 
              voice.lang.includes('en') && (
                voice.name.includes('Google') || 
                voice.name.includes('Microsoft') ||
                voice.name.includes('Natural')
              )
            ) || voices.find(voice => voice.lang.includes('en'));
            
            if (preferredVoice) {
              utterance.voice = preferredVoice;
              console.log('Selected voice:', preferredVoice.name, preferredVoice.lang);
            }
          }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          // Voices not loaded yet, wait for them
          window.speechSynthesis.onvoiceschanged = () => {
            setVoice();
            window.speechSynthesis.onvoiceschanged = null; // Remove listener
          };
        } else {
          setVoice();
        }
      }

      utterance.onstart = () => {
        console.log('Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('Speech synthesis ended');
      };
      
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', {
          error: event.error,
          name: event.name,
          type: event.type,
          text: text.substring(0, 50) + '...'
        });
        
        // Don't throw error, just log it
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };

      utterance.onpause = () => {
        console.log('Speech synthesis paused');
      };

      utterance.onresume = () => {
        console.log('Speech synthesis resumed');
      };

      // Start synthesis
      window.speechSynthesis.speak(utterance);
      
      // Fallback timeout to prevent hanging
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          console.log('Speech synthesis timeout, cancelling...');
          window.speechSynthesis.cancel();
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('Failed to start speech synthesis:', error);
    }
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          console.log('Speech synthesis stopped');
        }
      } catch (error) {
        console.warn('Error stopping speech synthesis:', error);
      }
    }
  }

  async captureWithDisplayMediaFallback() {
    try {
      console.log('Attempting display media fallback...');
      
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          mediaSource: 'screen',
          width: { ideal: 1, max: 1 },
          height: { ideal: 1, max: 1 },
          frameRate: { ideal: 1, max: 5 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
          suppressLocalAudioPlayback: false
        } 
      });
      
      console.log('Display stream tracks:', displayStream.getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        label: t.label,
        enabled: t.enabled
      })));
      
      // Extract only the audio track
      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('Found audio tracks:', audioTracks.length);
        const stream = new MediaStream(audioTracks);
        
        // Stop and remove video tracks since we don't need them
        displayStream.getVideoTracks().forEach(track => {
          track.stop();
          displayStream.removeTrack(track);
        });
        
        return stream;
      } else {
        console.warn('No audio tracks found in display stream');
        displayStream.getTracks().forEach(track => track.stop());
        throw new Error('No audio track found in system capture. Make sure to check "Share system audio" when prompted.');
      }
    } catch (error) {
      console.error('Display media fallback failed:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission denied. Please allow screen sharing and select "Share system audio".');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No screen sources available. Please try again.');
      } else if (error.name === 'AbortError') {
        throw new Error('Screen sharing was cancelled. Please try again and select "Share system audio".');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Screen sharing is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      } else if (error.message.includes('audio track')) {
        throw new Error('No system audio detected. Please ensure "Share system audio" is checked in the dialog.');
      } else {
        throw new Error(`System audio capture failed: ${error.message}`);
      }
    }
  }

  getOptimalRecordingOptions() {
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000 // Balanced quality for speech recognition
    };
    
    // Prioritize MIME types that work well with speech recognition
    const fallbackTypes = [
      'audio/webm;codecs=opus',   // Best for speech recognition
      'audio/webm;codecs=pcm',    // Uncompressed, good quality
      'audio/webm',               // Basic WebM
      'audio/mp4;codecs=aac',     // Good compatibility
      'audio/mp4',                // Basic MP4
      'audio/ogg;codecs=opus',    // Opus in OGG
      'audio/wav'                 // Fallback for older browsers
    ];
    
    for (const mimeType of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        console.log('Selected MIME type for recording:', mimeType);
        break;
      }
    }
    
    // Adjust bitrate based on MIME type
    if (options.mimeType.includes('opus')) {
      options.audioBitsPerSecond = 128000; // Opus works well at 128kbps
    } else if (options.mimeType.includes('aac')) {
      options.audioBitsPerSecond = 256000; // AAC needs higher bitrate
    } else if (options.mimeType.includes('pcm')) {
      options.audioBitsPerSecond = 512000; // PCM is uncompressed
    }
    
    return options;
  }

  cleanup() {
    try {
      // Clear audio level check interval if it exists
      if (this.audioLevelCheck) {
        clearInterval(this.audioLevelCheck);
        this.audioLevelCheck = null;
      }
      
      // Clean up SystemAudioService
      if (this.systemAudioService) {
        this.systemAudioService.stopAudioLevelMonitoring();
        this.systemAudioService.cleanup();
      }
      
      // Clean up any remaining streams
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      
      console.log('DeepgramVoiceService cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  setAudioLevelCallback(callback) {
    this.audioLevelCallback = callback;
  }

  // Get real-time audio levels (when system audio is active)
  getAudioLevels() {
    if (this.systemAudioService && this.systemAudioService.isCapturing) {
      return this.systemAudioService.getAudioLevels();
    }
    return null;
  }

  // Adjust system audio gain
  setSystemAudioGain(gain) {
    if (this.systemAudioService) {
      this.systemAudioService.setGain(gain);
    }
  }

  // Get available audio devices
  async getAudioDevices() {
    try {
      const devices = await this.systemAudioService.getAudioDeviceInfo();
      return devices;
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  // Check if system audio is available
  async isSystemAudioAvailable() {
    try {
      if (window.electron && window.electron.ipcRenderer) {
        const permissions = await window.electron.ipcRenderer.invoke('check-audio-permissions');
        return permissions.systemAudio;
      }
      return navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
    } catch (error) {
      console.error('Failed to check system audio availability:', error);
      return false;
    }
  }

  getSystemAudioErrorMessage(systemError, displayError) {
    const isWindows = navigator.platform.toLowerCase().includes('win');
    
    let message = 'System audio capture failed. ';
    
    // Check for common error patterns
    if (displayError && displayError.message.includes('Permission denied')) {
      message += 'Please grant screen sharing permission and make sure to check "Share system audio" in the browser dialog.';
    } else if (displayError && displayError.message.includes('NotAllowedError')) {
      message += 'Screen sharing was denied. Please click "Allow" and enable "Share system audio" when prompted.';
    } else if (systemError && systemError.message.includes('No audio devices')) {
      if (isWindows) {
        message += 'No system audio devices found. Please enable "Stereo Mix" in Windows Sound settings or install a virtual audio cable like VB-Cable.';
      } else {
        message += 'No system audio devices found. Please check your audio system configuration.';
      }
    } else if (systemError && systemError.message.includes('FFmpeg')) {
      message += 'Audio capture engine not available. Please ensure FFmpeg is installed and accessible.';
    } else {
      // Generic guidance based on platform
      if (isWindows) {
        message += 'Try: 1) Enable "Stereo Mix" in Sound settings, 2) Install VB-Cable, or 3) Use the microphone mode instead.';
      } else {
        message += 'Please check your system audio configuration or use microphone mode instead.';
      }
    }
    
    message += '\n\nFor detailed setup instructions, click the "Audio Setup Guide" button.';
    
    return message;
  }
}

export default new DeepgramVoiceService();
