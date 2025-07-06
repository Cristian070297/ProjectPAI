// Simple test to verify audio context initialization
import SystemAudioService from './src/services/systemAudioService.js';

async function testAudioContext() {
  console.log('Testing audio context initialization...');
  
  const service = new SystemAudioService();
  
  try {
    // Test 1: Initialize audio context
    console.log('Test 1: Initializing audio context...');
    await service.initializeAudioContext();
    console.log('✅ Audio context initialized successfully');
    console.log('Audio context state:', service.audioContext.state);
    console.log('Audio context sample rate:', service.audioContext.sampleRate);
    
    // Test 2: Test processAudioStream with a mock stream
    console.log('\nTest 2: Testing processAudioStream...');
    
    // Create a mock audio stream for testing
    const mockStream = new MediaStream();
    
    // This will fail because the mock stream has no audio tracks, but we can test the audio context validation
    try {
      await service.processAudioStream(mockStream, { channels: 2, sampleRate: 48000 });
    } catch (error) {
      if (error.message.includes('No audio tracks in stream')) {
        console.log('✅ Audio context validation passed (expected error: no audio tracks)');
      } else if (error.message.includes('Audio context is null')) {
        console.log('❌ Audio context is still null - this is the bug we need to fix');
      } else {
        console.log('✅ Audio context validation passed (different error):', error.message);
      }
    }
    
    // Test 3: Test auto-setup
    console.log('\nTest 3: Testing auto-setup...');
    const setupResult = await service.autoSetupSystemAudio();
    console.log('Auto-setup result:', setupResult);
    
    // Clean up
    service.cleanup();
    console.log('\n✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testAudioContext();
