import React from 'react';

const Message = ({ message, index }) => {
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
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {message.text}
        </pre>
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
