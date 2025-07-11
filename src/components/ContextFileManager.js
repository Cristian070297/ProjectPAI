import React, { useState, useEffect } from 'react';

const ContextFileManager = ({ onContextChange }) => {
  const [contextFile, setContextFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);

  // Load existing context on mount
  useEffect(() => {
    loadExistingContext();
  }, []);

  const loadExistingContext = async () => {
    if (window.electron?.files) {
      try {
        const result = await window.electron.files.getUserContext();
        if (result.success && result.context) {
          setContextFile(result.context);
          onContextChange?.(result.context);
        }
      } catch (error) {
        console.error('Failed to load existing context:', error);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!window.electron?.files) {
      alert('File upload not available in this environment');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electron.files.openFileDialog();
      
      if (result.success && !result.canceled) {
        const file = result.file;
        
        // Create context object
        const contextData = {
          name: file.name,
          type: file.type,
          content: file.content,
          extension: file.extension,
          uploadedAt: new Date().toISOString()
        };

        // Store context
        await window.electron.files.setUserContext(contextData);
        setContextFile(contextData);
        onContextChange?.(contextData);
        setShowUploadArea(false);
        
        console.log('Context file uploaded successfully:', file.name);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContext = async () => {
    if (window.electron?.files) {
      try {
        await window.electron.files.clearUserContext();
        setContextFile(null);
        onContextChange?.(null);
      } catch (error) {
        console.error('Failed to clear context:', error);
      }
    }
  };

  const getFileIcon = (type, extension) => {
    if (type === 'image') return '🖼️';
    if (extension === '.pdf') return '📄';
    if (['.doc', '.docx'].includes(extension)) return '📝';
    if (['.txt', '.md'].includes(extension)) return '📃';
    return '📁';
  };

  const getFileTypeLabel = (type, extension) => {
    if (type === 'image') return 'Image';
    if (extension === '.pdf') return 'PDF Document';
    if (['.doc', '.docx'].includes(extension)) return 'Word Document';
    if (['.txt', '.md'].includes(extension)) return 'Text File';
    return 'Document';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-gray-800 flex items-center">
          📎 Personal Context
          {contextFile && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </h3>
        
        {!contextFile && (
          <button
            onClick={() => setShowUploadArea(!showUploadArea)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            + Add Context
          </button>
        )}
      </div>

      {/* Current context file display */}
      {contextFile && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getFileIcon(contextFile.type, contextFile.extension)}</span>
              <div>
                <div className="font-medium text-gray-800">{contextFile.name}</div>
                <div className="text-xs text-gray-600">
                  {getFileTypeLabel(contextFile.type, contextFile.extension)} • 
                  Uploaded {new Date(contextFile.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveContext}
              className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
              title="Remove context file"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            ✅ <strong>Active:</strong> All responses will be personalized based on your uploaded context
          </div>
        </div>
      )}

      {/* Upload area */}
      {showUploadArea && !contextFile && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <div className="text-gray-600 mb-3">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm">
              Upload your <strong>CV/Resume</strong>, portfolio, or any document to get personalized interview advice
            </div>
          </div>
          
          <button
            onClick={handleFileUpload}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Uploading...' : 'Choose File'}
          </button>
          
          <div className="text-xs text-gray-500 mt-2">
            Supported: PDF, DOC, DOCX, TXT, Images
          </div>
          
          <button
            onClick={() => setShowUploadArea(false)}
            className="text-sm text-gray-500 hover:text-gray-700 mt-2 block mx-auto"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Help text */}
      {!contextFile && !showUploadArea && (
        <div className="text-xs text-gray-600">
          💡 Upload your CV or resume to get personalized interview advice based on your experience and skills
        </div>
      )}
    </div>
  );
};

export default ContextFileManager;
