import geminiService from '../services/geminiService';

const useScreenshotHandling = (setIsLoading, setMessages) => {
  const handleScreenshot = () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { text: 'Taking screenshot...', sender: 'assistant' }]);
    
    // Use setTimeout to avoid React error boundary issues
    setTimeout(async () => {
      try {
        if (!window.electron?.screenshot) {
          setMessages(prev => [...prev, { text: 'Screenshot feature not available', sender: 'assistant' }]);
          setIsLoading(false);
          return;
        }

        const result = await window.electron.screenshot.take();
        
        if (result.success) {
          // Analyze the screenshot with Gemini
          try {
            const analysis = await geminiService.analyzeImage(
              result.imageData,
              'Analyze this screenshot and describe what you see. Be helpful and specific.'
            );
            
            setMessages(prev => [
              ...prev.slice(0, -1), // Remove "Taking screenshot..." message
              { 
                text: '📸 Screenshot captured and analyzed:\n\n' + analysis, 
                sender: 'assistant',
                image: result.imageData
              }
            ]);
          } catch (analysisError) {
            console.log('Screenshot analysis error:', analysisError.message);
            
            // Provide helpful error message based on the type of error
            let errorMessage = '📸 Screenshot captured successfully!';
            if (analysisError.message.includes('API key')) {
              errorMessage += '\n\n⚠️ **AI Analysis unavailable** - Please add your Gemini API key to the .env file to enable screenshot analysis.\n\nYou can still view the screenshot below:';
            } else {
              errorMessage += '\n\n⚠️ **AI Analysis failed** - The screenshot was captured but could not be analyzed. You can still view it below:';
            }
            
            setMessages(prev => [
              ...prev.slice(0, -1),
              { 
                text: errorMessage, 
                sender: 'assistant',
                image: result.imageData
              }
            ]);
          }
        } else {
          setMessages(prev => [
            ...prev.slice(0, -1),
            { text: `Screenshot failed: ${result.error}`, sender: 'assistant' }
          ]);
        }
      } catch (error) {
        console.log('Screenshot error:', error.message);
        setMessages(prev => [
          ...prev.slice(0, -1),
          { text: 'Screenshot failed: ' + error.message, sender: 'assistant' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return { handleScreenshot };
};

export default useScreenshotHandling;
