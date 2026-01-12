
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim process.env untuk lingkungan browser dengan cara yang lebih robust
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  const env = (window as any).process.env;
  // Use any to avoid property access errors on import.meta.env
  const metaEnv = (import.meta as any).env || {};
  
  // Memetakan semua variabel lingkungan yang mungkin
  env.API_KEY = env.API_KEY || metaEnv.VITE_API_KEY || metaEnv.API_KEY || "";
  env.VITE_GAS_URL = env.VITE_GAS_URL || metaEnv.VITE_GAS_URL || metaEnv.GAS_URL || "";
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
