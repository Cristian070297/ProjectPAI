import React from 'react';

const MessageInput = ({ 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  isLoading 
}) => {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        placeholder="Type your message or use voice input..."
        disabled={isLoading}
        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      />
      <button
        onClick={() => handleSendMessage()}
        disabled={isLoading || !inputValue.trim()}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
