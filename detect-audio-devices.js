#!/usr/bin/env node

// Device detection script for Windows audio capture
const { spawn } = require('child_process');

async function listAudioDevices() {
  console.log('🎵 Detecting Windows Audio Devices...\n');
  
  return new Promise((resolve, reject) => {
    console.log('Running FFmpeg device detection...');
    
    // Use ffmpeg to list audio devices
    const ffmpeg = spawn('ffmpeg', ['-list_devices', 'true', '-f', 'dshow', '-i', 'dummy']);
    
    let output = '';
    ffmpeg.stderr.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', () => {
      try {
        console.log('\n📋 Raw FFmpeg Output:');
        console.log('═'.repeat(60));
        console.log(output);
        console.log('═'.repeat(60));
        
        // Parse audio devices
        const devices = parseAudioDevices(output);
        
        console.log('\n🎵 Available Audio Devices:');
        if (devices.length === 0) {
          console.log('❌ No audio devices found');
          console.log('\n💡 Possible solutions:');
          console.log('   1. Enable "Stereo Mix" in Windows Sound settings');
          console.log('   2. Install a virtual audio cable (VB-Cable)');
          console.log('   3. Use Windows Audio Session API (WASAPI)');
          console.log('   4. Check if DirectShow audio devices are available');
        } else {
          devices.forEach((device, index) => {
            console.log(`   ${index + 1}. "${device.name}" (${device.type})`);
          });
        }
        
        // Test with actual available devices
        if (devices.length > 0) {
          console.log('\n🧪 Testing with first available device...');
          testWithDevice(devices[0].name);
        }
        
        resolve(devices);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function parseAudioDevices(output) {
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

async function testWithDevice(deviceName) {
  console.log(`\n🎯 Testing audio capture with device: "${deviceName}"`);
  
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'dshow',
    '-i', `audio="${deviceName}"`,
    '-t', '2',
    '-f', 'null',
    '-'
  ]);
  
  let stderr = '';
  ffmpeg.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  
  ffmpeg.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Device test successful!');
    } else {
      console.log(`❌ Device test failed with code: ${code}`);
      console.log('Error details:', stderr);
    }
  });
}

// Additional Windows audio information
async function getWindowsAudioInfo() {
  console.log('\n🔍 Windows Audio System Information:');
  console.log('─'.repeat(40));
  
  // Check if Windows Audio Service is running
  const wmic = spawn('wmic', ['service', 'where', 'name="AudioSrv"', 'get', 'State']);
  
  let wmicOutput = '';
  wmic.stdout.on('data', (data) => {
    wmicOutput += data.toString();
  });
  
  wmic.on('close', () => {
    if (wmicOutput.includes('Running')) {
      console.log('✅ Windows Audio Service is running');
    } else {
      console.log('❌ Windows Audio Service may not be running');
    }
  });
  
  // List audio endpoints using PowerShell
  const powershell = spawn('powershell', [
    '-Command',
    'Get-WmiObject -Class Win32_SoundDevice | Select-Object Name, Status'
  ]);
  
  let psOutput = '';
  powershell.stdout.on('data', (data) => {
    psOutput += data.toString();
  });
  
  powershell.on('close', () => {
    console.log('\n🎵 Windows Audio Devices (WMI):');
    console.log(psOutput);
  });
}

// Main execution
async function main() {
  try {
    await listAudioDevices();
    await getWindowsAudioInfo();
    
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Right-click on the speaker icon in the system tray');
    console.log('2. Select "Open Sound settings"');
    console.log('3. Click "Sound Control Panel"');
    console.log('4. Go to the "Recording" tab');
    console.log('5. Right-click in the empty area and select "Show Disabled Devices"');
    console.log('6. If you see "Stereo Mix", right-click it and select "Enable"');
    console.log('7. Set "Stereo Mix" as the default recording device');
    
    console.log('\n🔄 Alternative Solutions:');
    console.log('• Install VB-Cable for virtual audio routing');
    console.log('• Use Windows WASAPI loopback mode');
    console.log('• Configure application-specific audio capture');
    
  } catch (error) {
    console.error('❌ Error during device detection:', error);
  }
}

main();
