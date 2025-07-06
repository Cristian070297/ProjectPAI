import React from 'react';
import Message from './Message';
import LoadingIndicator from './LoadingIndicator';

const MessageList = ({ messages, isLoading }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message, index) => (
        <Message key={index} message={message} index={index} />
      ))}
      
      {isLoading && <LoadingIndicator />}
    </div>
  );
};

export default MessageList;
