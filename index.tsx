
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim process.env untuk mencegah crash di browser
if (typeof window !== 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY || "",
      VITE_GAS_URL: (import.meta as any).env?.VITE_GAS_URL || ""
    }
  };
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
