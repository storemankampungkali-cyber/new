
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  activeTab: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, activeTab, isSidebarOpen, setIsSidebarOpen, onRefresh, isRefreshing }) => {
  const titleMap: Record<string, string> = {
    dashboard: 'System Overview',
    inventory: 'Master Inventory',
    transactions: 'Movement Logs',
    inbound: 'Stock Receipt',
    outbound: 'Goods Issuance',
    opname: 'Stock Opname',
    suppliers: 'Vendor Directory',
    admin: 'Administrator Console',
    history: 'Historical Audits',
    export: 'Data Extraction',
    gemini: 'AI Business Consultant'
  };

  return (
    <header className="px-4 py-4 md:px-8 flex items-center justify-between glass-card border-b border-white/5 sticky top-0 z-30 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-90"
          title="Toggle Sidebar"
        >
          <svg className={`w-5 h-5 text-indigo-400 transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2 mb-0.5">
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Nexus Core</span>
             <span className="text-slate-700">/</span>
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{activeTab}</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tighter">{titleMap[activeTab] || 'ProStock'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all flex items-center gap-3 group active:scale-95 ${isRefreshing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <svg className={`w-5 h-5 text-indigo-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest hidden lg:block">Sync Cloud</span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-white">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-500">{user.username}</p>
          </div>
          <div className="relative">
            <img src={`https://picsum.photos/seed/${user.id}/80/80`} className="w-10 h-10 rounded-2xl border border-white/10 shadow-xl" alt="P" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
