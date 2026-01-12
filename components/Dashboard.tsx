
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../App';
import { getInventoryInsights } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const { stats, inventory, loading } = useData();
  const [insights, setInsights] = useState<string>('Analyzing your warehouse pulse...');

  useEffect(() => {
    const fetchAI = async () => {
      if (inventory.length > 0) {
        const aiInsights = await getInventoryInsights(inventory);
        setInsights(aiInsights);
      }
    };
    fetchAI();
  }, [inventory]);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Items', value: stats.totalItems, icon: '📦', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
      { label: 'Total Stock', value: stats.totalStock, icon: '📊', color: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/30' },
      { label: 'Critical Alert', value: stats.lowStockItems, icon: '🚨', color: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/30', alert: stats.lowStockItems > 0 },
      { label: "Incoming Today", value: stats.transactionsInToday, icon: '📥', color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30' },
      { label: "Outgoing Today", value: stats.transactionsOutToday, icon: '📤', color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30' },
    ];
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-[2.5rem] animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, i) => (
          <div 
            key={i} 
            className={`glass-card p-6 rounded-[2.5rem] border ${card.border} flex flex-col justify-between hover:scale-[1.02] hover:bg-white/[0.05] transition-all duration-500 relative overflow-hidden group`}
          >
            {card.alert && <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 -mr-12 -mt-12 rounded-full blur-2xl"></div>}
            <div className={`flex justify-between items-start`}>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              {card.alert && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div className="mt-6">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Critical Alerts */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
              Inventory Warnings
            </h3>
            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-rose-500/20">Action Required</span>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[350px] scrollbar-hide flex-1">
            {stats.lowStockList.length > 0 ? stats.lowStockList.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-slate-800 hover:border-rose-500/20 transition-all cursor-default group">
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Stock: <span className="text-rose-400">{item.stock}</span> / Min: {item.minStock}
                  </div>
                </div>
                <button className="text-[9px] font-black text-white bg-slate-800 px-3 py-2 rounded-xl border border-white/10 hover:bg-rose-600 transition-all uppercase tracking-widest">Restock</button>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-40">
                <svg className="w-16 h-16 mb-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="font-bold uppercase text-xs tracking-widest">Inventory Optimized</p>
                <p className="text-[10px] font-medium mt-1">No critical items detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/5">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
             Movement Leaders
          </h3>
          <div className="space-y-8">
            {stats.topItemsOut.map((item, idx) => (
              <div key={idx} className="space-y-3 group">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 w-6 h-6 rounded flex items-center justify-center border border-indigo-500/20">0{idx+1}</span>
                    <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-xs text-white font-black">{item.total} Units</span>
                </div>
                <div className="w-full bg-slate-900/80 rounded-full h-3 p-1 border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-violet-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                    style={{ width: `${Math.min(100, (item.total / (stats.topItemsOut[0]?.total || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-violet-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group cursor-default">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white uppercase italic">Pro Intelligence</h3>
          </div>
          <div className="bg-black/20 p-6 rounded-[2rem] text-indigo-50 text-xs leading-relaxed whitespace-pre-line border border-white/10 backdrop-blur-sm shadow-inner relative z-10 min-h-[160px]">
            <p className="italic opacity-60 mb-2 text-[9px] font-black tracking-[0.2em] uppercase">Snapshot Insights:</p>
            {insights}
          </div>
          <div className="mt-8 flex justify-between items-center text-[9px] text-white/50 font-black uppercase tracking-[0.3em] relative z-10">
            <span>Core Gemini 3.0</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              Live Link
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
