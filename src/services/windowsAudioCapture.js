// Windows WASAPI Audio Capture Module
// This module provides direct access to Windows audio system for loopback recording

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class WindowsAudioCapture {
  constructor() {
    this.isCapturing = false;
    this.ffmpegProcess = null;
    this.outputPath = null;
    this.isWindows = os.platform() === 'win32';
    this.audioDevices = [];
    this.defaultDevice = null;
    
    console.log('WindowsAudioCapture initialized');
  }

  async initialize() {
    if (!this.isWindows) {
      console.warn('Windows Audio Capture is only supported on Windows');
      return false;
    }

    try {
      // Check if FFmpeg is available
      await this.checkFFmpeg();
      
      // Get audio devices
      await this.getAudioDevices();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Windows Audio Capture:', error);
      return false;
    }
  }

  async checkFFmpeg() {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      
      ffmpeg.on('error', (error) => {
        console.error('FFmpeg not found. Please install FFmpeg for advanced audio capture.');
        reject(new Error('FFmpeg not available'));
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('FFmpeg is available');
          resolve();
        } else {
          reject(new Error('FFmpeg test failed'));
        }
      });
    });
  }

  async getAudioDevices() {
    return new Promise((resolve, reject) => {
      // Use ffmpeg to list audio devices
      const ffmpeg = spawn('ffmpeg', ['-list_devices', 'true', '-f', 'dshow', '-i', 'dummy']);
      
      let output = '';
      ffmpeg.stderr.on('data', (data) => {
        output += data.toString();
      });

      ffmpeg.on('close', () => {
        try {
          const devices = this.parseAudioDevices(output);
          this.audioDevices = devices;
          
          // Find default audio device (usually "Stereo Mix" or "What U Hear")
          this.defaultDevice = devices.find(device => 
            device.name.toLowerCase().includes('stereo mix') ||
            device.name.toLowerCase().includes('what u hear') ||
            device.name.toLowerCase().includes('loopback')
          ) || devices[0];
          
          console.log('Found audio devices:', devices.length);
          console.log('Default device:', this.defaultDevice?.name);
          
          resolve(devices);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  parseAudioDevices(output) {
    const devices = [];
    const lines = output.split('\n');
    
    let inAudioSection = false;
    for (const line of lines) {
      if (line.includes('DirectShow audio devices')) {
        inAudioSection = true;
        continue;
      }
      
      if (inAudioSection && line.includes('DirectShow video devices')) {
        break;
      }
      
      if (inAudioSection && line.includes('[dshow @')) {
        const match = line.match(/"([^"]+)"/);
        if (match) {
          devices.push({
            name: match[1],
            type: 'audio',
            id: match[1]
          });
        }
      }
    }
    
    return devices;
  }

  async startCapture(options = {}) {
    if (!this.isWindows) {
      throw new Error('Windows Audio Capture is only supported on Windows');
    }

    if (this.isCapturing) {
      await this.stopCapture();
    }

    const config = {
      device: options.device || this.defaultDevice?.name || 'Stereo Mix',
      duration: options.duration || 30, // seconds
      sampleRate: options.sampleRate || 48000,
      channels: options.channels || 2,
      bitrate: options.bitrate || '256k',
      format: options.format || 'wav',
      ...options
    };

    // Create temporary output file
    this.outputPath = path.join(os.tmpdir(), `audio_capture_${Date.now()}.${config.format}`);

    try {
      // FFmpeg command for WASAPI loopback capture
      const ffmpegArgs = [
        '-f', 'dshow',
        '-i', `audio="${config.device}"`,
        '-acodec', 'pcm_s16le',
        '-ar', config.sampleRate.toString(),
        '-ac', config.channels.toString(),
        '-t', config.duration.toString(),
        '-y', // Overwrite output file
        this.outputPath
      ];

      console.log('Starting FFmpeg capture with args:', ffmpegArgs);
      
      this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      this.isCapturing = true;

      // Handle process events
      this.ffmpegProcess.stdout.on('data', (data) => {
        console.log('FFmpeg stdout:', data.toString());
      });

      this.ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('FFmpeg stderr:', output);
        
        // Check for errors
        if (output.includes('error') || output.includes('Error')) {
          console.error('FFmpeg error:', output);
        }
      });

      this.ffmpegProcess.on('close', (code) => {
        console.log('FFmpeg process closed with code:', code);
        this.isCapturing = false;
        
        if (code !== 0) {
          console.error('FFmpeg capture failed with code:', code);
        }
      });

      this.ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        this.isCapturing = false;
      });

      return {
        outputPath: this.outputPath,
        process: this.ffmpegProcess
      };
    } catch (error) {
      console.error('Failed to start Windows audio capture:', error);
      this.isCapturing = false;
      throw error;
    }
  }

  async stopCapture() {
    if (this.ffmpegProcess && this.isCapturing) {
      try {
        // Send SIGTERM to gracefully stop FFmpeg
        this.ffmpegProcess.kill('SIGTERM');
        
        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force kill if still running
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
          this.ffmpegProcess.kill('SIGKILL');
        }
        
        this.isCapturing = false;
        console.log('Windows audio capture stopped');
      } catch (error) {
        console.error('Error stopping Windows audio capture:', error);
      }
    }
  }

  async getCapturedAudio() {
    if (!this.outputPath || !fs.existsSync(this.outputPath)) {
      throw new Error('No captured audio file found');
    }

    try {
      const audioData = fs.readFileSync(this.outputPath);
      
      // Clean up temporary file
      fs.unlinkSync(this.outputPath);
      this.outputPath = null;
      
      return audioData;
    } catch (error) {
      console.error('Error reading captured audio:', error);
      throw error;
    }
  }

  async captureSystemAudio(durationSeconds = 10) {
    try {
      await this.initialize();
      
      const captureResult = await this.startCapture({
        duration: durationSeconds,
        sampleRate: 48000,
        channels: 2,
        format: 'wav'
      });

      // Wait for capture to complete
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Capture timeout'));
        }, (durationSeconds + 5) * 1000);

        this.ffmpegProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Capture failed with code ${code}`));
          }
        });
      });

      // Get the captured audio data
      const audioData = await this.getCapturedAudio();
      
      return {
        data: audioData,
        format: 'wav',
        sampleRate: 48000,
        channels: 2
      };
    } catch (error) {
      console.error('System audio capture failed:', error);
      throw error;
    }
  }

  getAvailableDevices() {
    return this.audioDevices;
  }

  isSupported() {
    return this.isWindows;
  }

  cleanup() {
    if (this.isCapturing) {
      this.stopCapture();
    }
    
    if (this.outputPath && fs.existsSync(this.outputPath)) {
      try {
        fs.unlinkSync(this.outputPath);
      } catch (error) {
        console.warn('Failed to cleanup temporary file:', error);
      }
    }
  }
}

module.exports = WindowsAudioCapture;
