import React from 'react';

const Message = ({ message, index }) => {
  // Simple markdown-to-HTML converter for basic formatting
  const formatMessage = (text) => {
    let formatted = text;
    
    // Headers
    formatted = formatted.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h2>');
    formatted = formatted.replace(/^### (.*$)/gm, '<h3 class="text-md font-semibold text-gray-700 mt-3 mb-1">$1</h3>');
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Bullet points
    formatted = formatted.replace(/^• (.*$)/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Wrap lists
    formatted = formatted.replace(/((<li.*?<\/li>\s*)+)/gs, '<ul class="list-disc list-inside mb-3">$1</ul>');
    
    // Line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  return (
    <div
      key={index}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
          message.sender === 'user'
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none border'
        }`}
      >
        {message.sender === 'assistant' ? (
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {message.text}
          </pre>
        )}
        {message.image && (
          <img 
            src={message.image} 
            alt="Screenshot" 
            className="mt-2 max-w-full h-auto rounded border"
          />
        )}
      </div>
    </div>
  );
};

export default Message;
