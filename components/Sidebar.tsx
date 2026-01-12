
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: 'dashboard' | 'inventory' | 'transactions' | 'inbound' | 'outbound' | 'opname' | 'suppliers' | 'admin' | 'history' | 'export' | 'gemini';
  setActiveTab: (tab: SidebarProps['activeTab']) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeTab, setActiveTab, user, onLogout }) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'inbound', name: 'Stock In', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
    { id: 'outbound', name: 'Stock Out', icon: 'M13 8l4 4m0 0l-4 4m4-4H3m13-8V7a3 3 0 013-3h1a3 3 0 013 3v10a3 3 0 01-3 3h-1a3 3 0 01-3-3v-1' },
    { id: 'opname', name: 'Stock Opname', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'history', name: 'History Logs', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'inventory', name: 'Master Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'suppliers', name: 'Suppliers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'export', name: 'Extraction', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'gemini', name: 'AI Business Agent', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <aside className={`fixed lg:relative z-40 flex flex-col transition-all duration-500 bg-slate-950 border-r border-white/5 h-screen shrink-0 ${isOpen ? 'w-72' : 'w-20'}`}>
      <div className={`p-6 flex flex-col h-full ${!isOpen ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3 mb-10 group cursor-pointer overflow-hidden" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">P</div>
          <div className={`transition-all duration-500 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 -translate-x-10'}`}>
            <h1 className="text-xl font-black text-white tracking-tighter">ProStock</h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest -mt-1">Inventory GAS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          <p className={`px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 opacity-50 whitespace-nowrap transition-opacity ${isOpen ? 'opacity-50' : 'opacity-0'}`}>
            Operations
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative group ${
                activeTab === tab.id
                  ? 'bg-indigo-500/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeTab === tab.id && <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"></div>}
              <svg className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className={`transition-all duration-500 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                {tab.name}
              </span>
            </button>
          ))}

          {user.role === UserRole.ADMIN && (
            <div className="pt-6">
              <p className={`px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 opacity-50 whitespace-nowrap transition-opacity ${isOpen ? 'opacity-50' : 'opacity-0'}`}>
                System
              </p>
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative group ${
                  activeTab === 'admin'
                    ? 'bg-indigo-500/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === 'admin' && <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"></div>}
                <svg className={`w-5 h-5 shrink-0 transition-transform group-hover:rotate-45 ${activeTab === 'admin' ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span className={`transition-all duration-500 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                  Admin
                </span>
              </button>
            </div>
          )}
        </nav>

        <div className={`mt-auto pt-6 border-t border-white/5 transition-all duration-500 ${!isOpen ? 'items-center' : ''}`}>
          <div className={`bg-slate-900 rounded-3xl p-3 border border-white/5 transition-all duration-500 ${isOpen ? 'w-full' : 'w-12'}`}>
            <div className={`flex items-center gap-3 overflow-hidden ${!isOpen ? 'justify-center' : ''}`}>
              <img src={`https://picsum.photos/seed/${user.id}/80/80`} className="w-8 h-8 rounded-xl shrink-0" alt="P" />
              <div className={`flex-1 min-w-0 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'}`}>
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            {isOpen && (
              <button 
                onClick={onLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
