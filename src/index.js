import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('Index.js loaded');

const container = document.getElementById('root');
console.log('Container found:', container);

if (container) {
  const root = createRoot(container);
  console.log('Root created');
  
  root.render(<App />);
  console.log('App rendered');
} else {
  console.error('Root container not found!');
}
