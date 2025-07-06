import deepgramVoiceService from '../services/deepgramVoiceService';

const useVoiceHandling = (
  setIsListening,
  setVoiceError,
  setVoiceStatus,
  handleSendMessage
) => {
  const handleVoiceCommand = async (useSystemAudio = false) => {
    if (!deepgramVoiceService.isSupported) {
      setVoiceError('Microphone not supported in this browser. Please use a modern browser.');
      return;
    }

    if (deepgramVoiceService.isListening) {
      deepgramVoiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceError('');
    setVoiceStatus(`🎤 Recording ${useSystemAudio ? 'PC audio' : 'microphone'}... speak now!`);
    
    deepgramVoiceService.startListening(
      // onResult
      (transcript) => {
        console.log('Deepgram transcript:', transcript);
        setIsListening(false);
        setVoiceStatus('✅ Voice processed successfully!');
        setTimeout(() => setVoiceStatus(''), 2000);
        handleSendMessage(transcript, true);
      },
      // onError
      (error) => {
        console.log('Deepgram voice error:', error);
        setIsListening(false);
        setVoiceStatus('');
        setVoiceError(error);
      },
      // onEnd
      () => {
        setIsListening(false);
        setVoiceStatus('🔄 Processing audio with Deepgram...');
      },
      useSystemAudio
    );
  };

  return { handleVoiceCommand };
};

export default useVoiceHandling;
