# System Audio Capture Setup Guide

This application provides advanced system audio capture capabilities that work regardless of output volume or device. Here's how to set it up for optimal performance:

## Windows Setup

### Method 1: Enable Stereo Mix (Recommended)
1. **Right-click** on the speaker icon in the system tray
2. Select **"Open Sound settings"**
3. Click **"Sound Control Panel"** (or go to Control Panel > Sound)
4. Go to the **"Recording"** tab
5. **Right-click** in the empty area and select **"Show Disabled Devices"**
6. Find **"Stereo Mix"** and **right-click** it
7. Select **"Enable"**
8. **Right-click** "Stereo Mix" again and select **"Set as Default Device"**
9. Click **"OK"** to save changes

### Method 2: Use Virtual Audio Cable (Advanced)
1. **Download** and install VB-Cable or similar virtual audio cable software
2. Set the virtual cable as your **default audio device**
3. Route your audio through the virtual cable for capture

### Method 3: FFmpeg with WASAPI (Automatic)
- The application will automatically use FFmpeg with WASAPI loopback if available
- Install FFmpeg from https://ffmpeg.org/download.html
- Add FFmpeg to your system PATH

### Required Permissions
- **Screen Recording**: Required for display media capture
- **Microphone**: Required for fallback audio capture
- **Audio Devices**: Required for device enumeration

## macOS Setup

### Method 1: Built-in Screen Recording
1. **Go to** System Preferences > Security & Privacy > Privacy
2. Select **"Screen Recording"** from the left sidebar
3. **Enable** screen recording for your browser or the Electron app
4. **Enable** "Include system audio" when prompted during capture

### Method 2: Soundflower (Advanced)
1. **Download** and install Soundflower
2. Set **Soundflower (2ch)** as your audio output device
3. Use **Audio MIDI Setup** to create a multi-output device

### Method 3: BlackHole (Recommended)
1. **Install** BlackHole virtual audio driver
2. Create a **multi-output device** including BlackHole
3. Set the multi-output device as your default output

## Linux Setup

### Method 1: PulseAudio Loopback
```bash
# Enable PulseAudio loopback module
pactl load-module module-loopback latency_msec=1

# List audio sources
pactl list short sources

# Use monitor source for capture
# Usually named like "alsa_output.pci-0000_00_1f.3.analog-stereo.monitor"
```

### Method 2: PipeWire (Modern Linux)
```bash
# PipeWire automatically provides loopback capabilities
# Use pw-link to connect audio streams
pw-link --output
pw-link --input
```

### Method 3: ALSA with dmix
- Configure ALSA with dmix for audio mixing
- Use `arecord` with loopback device

## Application Configuration

### Audio Quality Settings
- **Sample Rate**: 48000 Hz (default), 44100 Hz, or 16000 Hz
- **Channels**: 2 (stereo) or 1 (mono)
- **Bit Depth**: 16-bit (default) or 24-bit
- **Bitrate**: 256 kbps (default) or higher for better quality

### Advanced Options
- **Echo Cancellation**: Disabled for system audio
- **Noise Suppression**: Disabled for system audio
- **Auto Gain Control**: Disabled for system audio
- **Latency**: 10ms for real-time processing

## Troubleshooting

### No Audio Captured
1. **Check** if system audio is playing
2. **Verify** that "Share system audio" is enabled in browser prompts
3. **Enable** Stereo Mix or use virtual audio cable
4. **Restart** the application after changing audio settings

### Low Audio Quality
1. **Increase** sample rate to 48000 Hz
2. **Use** 2 channels (stereo) instead of 1 (mono)
3. **Increase** bitrate to 320 kbps or higher
4. **Disable** all audio processing (echo cancellation, etc.)

### Permission Errors
1. **Enable** microphone permissions in browser/system settings
2. **Enable** screen recording permissions (macOS)
3. **Run** the application as administrator (Windows) if needed

### Audio Devices Not Detected
1. **Refresh** audio device list in system settings
2. **Restart** audio services (Windows: restart Windows Audio service)
3. **Reinstall** audio drivers if necessary

## Best Practices

1. **Use wired headphones** instead of speakers to avoid feedback
2. **Close unnecessary applications** that might interfere with audio
3. **Test audio capture** before important recording sessions
4. **Monitor audio levels** using the built-in visualizer
5. **Adjust gain** if audio is too quiet or too loud

## Performance Optimization

1. **Close unnecessary browser tabs** to free up system resources
2. **Use dedicated audio interface** if available
3. **Disable Windows audio enhancements** for raw audio capture
4. **Set high priority** for the application process
5. **Use SSD storage** for temporary audio files

## Security Considerations

1. **Audio capture requires permissions** - only grant to trusted applications
2. **Temporary audio files** are automatically cleaned up
3. **Network transmission** of audio is encrypted
4. **Local processing** is preferred over cloud processing when possible

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your audio device configuration
3. Test with different audio sources
4. Try different capture methods
5. Contact support with detailed error logs

---

*This guide covers the most common scenarios. Some advanced configurations may require additional steps specific to your system.*
