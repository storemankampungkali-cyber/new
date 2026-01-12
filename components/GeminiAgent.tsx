
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GeminiAgent: React.FC<{ inventory: InventoryItem[] }> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya adalah ProStock Intelligence Agent. Bagaimana saya bisa membantu Anda mengoptimalkan inventaris hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Fix: Create GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a world-class Supply Chain Consultant. 
        Context: You have access to the current inventory status of ProStock System.
        Current Inventory Data: ${JSON.stringify(inventory)}
        
        User Query: ${userMessage}
        
        Rules:
        1. Be professional, concise, and data-driven.
        2. If asked about stock, refer specifically to the provided data.
        3. Offer actionable advice (e.g., "Anda harus segera restock X karena sisa Y").
        4. Use Indonesian language by default unless the user uses English.
        5. Format your response with markdown if needed for clarity.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Fix: Access .text property directly, do not call it as a method.
      const result = response.text || "Maaf, saya mengalami kendala teknis saat memproses data.";
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sistem AI sedang tidak tersedia. Mohon coba lagi beberapa saat." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)] animate-fadeIn">
      <div className="glass-card flex-1 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
        {/* Background glow for the AI room */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
        
        {/* Chat Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-black text-white tracking-tight">Consultant Gemini 3.0</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Neural Engine Online</span>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory Context</p>
            <p className="text-xs font-bold text-slate-300">{inventory.length} Global Nodes Linked</p>
          </div>
        </div>

        {/* Message Window */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-white/10' 
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-800/80 px-6 py-4 rounded-[2rem] rounded-tl-none border border-white/5 flex items-center gap-2">
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
              className="w-full pl-6 pr-16 py-5 bg-slate-900 border border-white/10 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-600 transition-all font-medium"
              placeholder="Tanyakan status stok, rekomendasi restock, atau analisis data..."
              value={input}
              onChange={e => setInput(e.target.value)}
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
        AI analysis is based on real-time database snapshots. Verify critical transactions manually.
      </p>
    </div>
  );
};

export default GeminiAgent;
