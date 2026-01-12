
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { InventoryItem } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GeminiAgent: React.FC<{ inventory: InventoryItem[] }> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya ProStock Intelligence (PSI-1). Saya siap membantu Anda melakukan analisis stok, strategi logistik, atau menjawab pertanyaan umum lainnya (coding, bisnis, dll). Ada yang bisa saya bantu?' }
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Anda adalah ProStock Intelligence (PSI-1), asisten AI hibrida tingkat lanjut.
        
        DATA INVENTARIS REAL-TIME: ${JSON.stringify(inventorySummary)}.
        
        PROTOKOL OPERASIONAL:
        1. IDENTITAS: Anda adalah PSI-1, asisten cerdas yang terintegrasi dengan gudang ProStock.
        2. MULTI-EXPERT: Anda memiliki pengetahuan luas tentang dunia (coding, sains, bisnis, bahasa). Jangan batasi jawaban Anda hanya pada inventaris. Jika ditanya hal umum, berikan jawaban terbaik dari basis pengetahuan Anda.
        3. PAKAR LOGISTIK: Jika user bertanya tentang stok atau saran pengadaan, gunakan data inventaris yang diberikan secara presisi.
        4. GAYA BAHASA: Profesional, analitis, namun ramah. Gunakan Bahasa Indonesia yang luwes.
        5. FORMATTING: Gunakan Markdown (bold, list, code block) untuk membuat jawaban terstruktur dan mudah dibaca.
        6. PROAKTIF: Jika Anda melihat ada barang dengan stok <= minStock, berikan pengingat singkat di akhir jawaban Anda, terlepas dari apa pun pertanyaannya, sebagai bentuk "Business Monitoring".`,
      },
    });
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
    if (!input.trim() || isTyping || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const result = response.text || "Maaf, sistem pemrosesan saya mengalami kendala teknis singkat.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      let errorMsg = "Koneksi terputus. Silakan periksa kunci API atau coba lagi.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)] animate-fadeIn">
      <div className="glass-card flex-1 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
        
        {/* Header dengan Tombol Reset */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group">
              <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight">PSI-1 Intelligence</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Neural Link Stable</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleReset}
            className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-white/5 transition-all active:scale-90"
            title="Reset Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {/* Message Window */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide relative z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[2.2rem] text-sm leading-relaxed shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-white/10' 
                  : 'bg-slate-900/80 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-sm'
              }`}>
                {/* Formatting sederhana untuk markdown line breaks */}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-900/80 px-6 py-4 rounded-[2rem] rounded-tl-none border border-white/5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-8 bg-white/5 border-t border-white/5 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              className="w-full pl-6 pr-16 py-5 bg-slate-950/80 border border-white/10 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-600 transition-all font-medium shadow-inner"
              placeholder="Tanyakan analisis stok, strategi bisnis, atau apa pun..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
                !input.trim() || isTyping 
                  ? 'bg-slate-800 text-slate-600' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-7-9-7V9l-9 3 9 3v4z" /></svg>
            </button>
          </div>
        </form>
      </div>
      
      <p className="text-center mt-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
        Omni-Purpose Intelligence Layer • PSI-1 Core
      </p>
    </div>
  );
};

export default GeminiAgent;
