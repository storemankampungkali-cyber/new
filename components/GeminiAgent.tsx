
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { InventoryItem } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GeminiAgent: React.FC<{ inventory: InventoryItem[] }> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya ProStock Intelligence (PSI-1). Saya siap membantu Anda melakukan analisis stok, strategi logistik, atau menjawab pertanyaan umum lainnya. Ada yang bisa saya bantu?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const inventorySummary = useMemo(() => {
    return inventory.map(item => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      unit: item.defaultUnit,
      min: item.minStock,
      status: item.status
    }));
  }, [inventory]);

  const initChat = () => {
    // Always use process.env.API_KEY directly as per guidelines
    const apiKey = process.env.API_KEY || "";
    
    if (!apiKey) {
      console.error("Gemini API Key missing.");
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ ERROR: API Key Gemini tidak ditemukan. Harap tambahkan API_KEY di environment variables Vercel agar fitur AI dapat berfungsi.' 
      }]);
      return;
    }

    try {
      // Corrected initialization using process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Anda adalah ProStock Intelligence (PSI-1), asisten AI hibrida tingkat lanjut.
          
          DATA INVENTARIS REAL-TIME: ${JSON.stringify(inventorySummary)}.
          
          PROTOKOL OPERASIONAL:
          1. IDENTITAS: Anda adalah PSI-1, asisten cerdas yang terintegrasi dengan gudang ProStock.
          2. MULTI-EXPERT: Berikan jawaban profesional tentang apapun, tidak terbatas pada inventaris.
          3. PAKAR LOGISTIK: Gunakan data inventaris yang diberikan untuk memberikan analisis stok yang akurat.
          4. FORMATTING: Gunakan Markdown (bold, list) agar mudah dibaca.
          5. PROAKTIF: Berikan peringatan jika ada barang di bawah stok minimum.`,
        },
      });
    } catch (err) {
      console.error("Failed to initialize Gemini Chat:", err);
    }
  };

  useEffect(() => {
    initChat();
  }, [inventorySummary]);

  const handleReset = () => {
    if (confirm("Reset percakapan? Histori saat ini akan dibersihkan.")) {
      setMessages([{ role: 'assistant', content: 'Sesi diatur ulang. Saya PSI-1, siap menerima instruksi baru Anda.' }]);
      initChat();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    if (!chatRef.current) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sistem AI tidak terinisialisasi karena masalah konfigurasi.' }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Use chat.sendMessage with message parameter as per guidelines
      const response = await chatRef.current.sendMessage({ message: userMessage });
      // Access text property directly
      const result = response.text || "Maaf, sistem pemrosesan saya mengalami kendala teknis singkat.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Terjadi kesalahan saat menghubungi otak AI. Periksa koneksi atau API Key Anda." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)] animate-fadeIn">
      <div className="glass-card flex-1 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight">PSI-1 Intelligence</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Neural Link Online</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleReset}
            className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-white/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide relative z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[2.2rem] text-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900/80 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 px-6 py-4 rounded-[2rem] rounded-tl-none border border-white/5 text-xs text-indigo-400 animate-pulse">
                PSI-1 sedang berpikir...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-8 bg-white/5 border-t border-white/5 relative z-10">
          <div className="relative">
            <input 
              type="text" 
              className="w-full pl-6 pr-16 py-5 bg-slate-950 border border-white/10 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/20 text-white"
              placeholder="Tanyakan analisis stok..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-7-9-7V9l-9 3 9 3v4z" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeminiAgent;
