
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim process.env untuk lingkungan browser
if (typeof window !== 'undefined') {
  // Inisialisasi objek jika belum ada
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  const env = (window as any).process.env;
  const metaEnv = (import.meta as any).env || {};
  
  // Mengambil variabel dari process.env (jika ada) atau import.meta.env (Vite)
  // Mendukung prefiks VITE_ maupun tanpa prefiks untuk fleksibilitas
  env.API_KEY = env.API_KEY || metaEnv.VITE_API_KEY || metaEnv.API_KEY || "";
  env.VITE_GAS_URL = env.VITE_GAS_URL || metaEnv.VITE_GAS_URL || metaEnv.GAS_URL || "";
  
  // Log peringatan di console jika konfigurasi hilang
  if (!env.VITE_GAS_URL) {
    console.warn("ProStock Warning: VITE_GAS_URL tidak ditemukan di environment. Pastikan sudah ditambahkan di Vercel Settings.");
  }
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
