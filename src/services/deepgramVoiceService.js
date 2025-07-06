import { createClient } from '@deepgram/sdk';

class DeepgramVoiceService {
  constructor() {
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isSupported = this.checkSupport();
    // Note: We don't initialize Deepgram in the renderer process due to CORS
    console.log('DeepgramVoiceService initialized for Electron backend processing');
  }

  checkSupport() {
    const hasBasicSupport = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const hasDisplayMedia = 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices;
    
    console.log('Media support check:', {
      hasBasicSupport,
      hasDisplayMedia,
      userAgent: navigator.userAgent
    });
    
    return hasBasicSupport;
  }

  async startListening(onResult, onError, onEnd, useSystemAudio = false) {
    if (!this.isSupported) {
      onError('Microphone not supported in this browser. Please use a modern browser.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      let stream;
      if (useSystemAudio) {
        // Check if getDisplayMedia is available
        if (!navigator.mediaDevices.getDisplayMedia) {
          console.warn('getDisplayMedia not supported, falling back to microphone');
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000
            } 
          });
        } else {
          try {
            // Capture system audio (what you hear from PC)
            // Note: getDisplayMedia requires video, so we request minimal video and extract audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
              video: {
                mediaSource: 'screen',
                width: { ideal: 1, max: 1 },
                height: { ideal: 1, max: 1 },
                frameRate: { ideal: 1, max: 5 }
              },
              audio: {
                echoCancellation: false, // Keep system audio as-is
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 16000,
                channelCount: 2
              } 
            });
            
            console.log('Display stream tracks:', displayStream.getTracks().map(t => t.kind));
            
            // Extract only the audio track
            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length > 0) {
              console.log('Found audio tracks:', audioTracks.length);
              stream = new MediaStream(audioTracks);
              // Stop and remove video tracks since we don't need them
              displayStream.getVideoTracks().forEach(track => {
                track.stop();
                displayStream.removeTrack(track);
              });
            } else {
              console.warn('No audio tracks found in display stream');
              displayStream.getTracks().forEach(track => track.stop());
              throw new Error('No audio track found in system capture. Make sure to check "Share system audio" when prompted.');
            }
          } catch (systemError) {
            console.warn('System audio capture failed:', systemError);
            // Fallback to microphone if system audio fails
            console.log('Falling back to microphone...');
            stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
              } 
            });
            console.log('Using microphone as fallback');
          }
        }
      } else {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000  // Optimal for speech recognition
          } 
        });
      }

      this.isListening = true;
      this.audioChunks = [];

      // Create MediaRecorder with better format for speech recognition
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000  // Lower bitrate for smaller files
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
        options.audioBitsPerSecond = 16000;
      }

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
          
          // Always use Electron backend for transcription (avoids CORS issues)
          await this.transcribeWithElectron(audioBlob, onResult, onError);
        } catch (error) {
          console.log('Error processing audio:', error.message);
          onError('Failed to process audio recording. Please try again.');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.mediaRecorder.onerror = (event) => {
        console.warn('MediaRecorder error:', event);
        onError('Recording error occurred. Please try again.');
        this.isListening = false;
        stream.getTracks().forEach(track => track.stop());
        if (onEnd) onEnd();
      };

      // Start recording
      this.mediaRecorder.start();
      console.log(`Started recording with Deepgram voice service (${useSystemAudio ? 'System Audio' : 'Microphone'} backend)`);

      // Auto-stop after 5 seconds (reduced from 10 to create smaller files)
      setTimeout(() => {
        if (this.isListening && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopListening();
        }
      }, 5000);

    } catch (error) {
      console.warn('Error accessing audio:', error.message);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        useSystemAudio: useSystemAudio
      });
      this.isListening = false;
      
      if (error.name === 'NotAllowedError') {
        onError(`${useSystemAudio ? 'System audio sharing' : 'Microphone'} access denied. Please allow permissions and try again.`);
      } else if (error.name === 'NotFoundError') {
        onError(`No ${useSystemAudio ? 'audio source' : 'microphone'} found. Please try again.`);
      } else if (error.name === 'AbortError') {
        onError(`${useSystemAudio ? 'System audio sharing' : 'Microphone access'} was cancelled. Please try again.`);
      } else if (useSystemAudio && error.message.includes('audio track')) {
        onError('No system audio detected. Make sure to check "Share system audio" when prompted, or try playing some audio first.');
      } else if (useSystemAudio) {
        onError('System audio capture failed. Falling back to microphone worked, but for best results with background audio, ensure you select "Share system audio" in the browser dialog.');
      } else {
        onError(`Failed to access microphone. Please check your microphone permissions and try again.`);
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
      this.isListening = false;
    }
  }

  // Text-to-Speech functionality (using browser built-in)
  speak(text, options = {}) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;
      utterance.lang = options.lang || 'en-US';

      // Use provided voice or find a suitable one
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.includes('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => console.log('Speech synthesis started');
      utterance.onend = () => console.log('Speech synthesis ended');
      utterance.onerror = (event) => console.error('Speech synthesis error:', event);

      window.speechSynthesis.speak(utterance);
    }
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export default new DeepgramVoiceService();
