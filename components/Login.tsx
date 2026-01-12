
import React, { useState } from 'react';
import { gasService } from '../services/gasService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await gasService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Verifikasi gagal. Kredensial tidak ditemukan.');
      }
    } catch (err: any) {
      // Menampilkan pesan error asli untuk mempermudah identifikasi masalah
      setError(err.message || 'Error komunikasi dengan server.');
      console.error("Login component error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-[440px] glass-card rounded-[3rem] p-10 border border-white/5 shadow-2xl animate-fadeIn">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl shadow-indigo-500/40 rotate-12">
            P
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">ProStock Enterprise</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Digital Logistics Core v3.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-2xl text-center uppercase tracking-widest leading-relaxed">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal Identity</label>
            <div className="relative group">
              <input
                type="text"
                required
                className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all placeholder-slate-600"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <svg className="w-5 h-5 absolute right-5 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Passcode</label>
            <div className="relative group">
              <input
                type="password"
                required
                className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all placeholder-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <svg className="w-5 h-5 absolute right-5 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Initializing...
              </>
            ) : (
              'INITIATE ACCESS'
            )}
          </button>
        </form>

        <div className="mt-12 text-center opacity-30">
          <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
            SECURE PORTAL 
            <br />
            AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
