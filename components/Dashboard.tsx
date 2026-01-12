
import React, { useState, useMemo } from 'react';
import { useData } from '../App';
import { getInventoryInsights } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const { stats, inventory, loading } = useData();
  const [insights, setInsights] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fungsi baru untuk menjalankan AI hanya saat dibutuhkan
  const generateAIInsights = async () => {
    if (inventory.length === 0 || isAiLoading) return;
    setIsAiLoading(true);
    setInsights('Menganalisis data pergudangan Anda...');
    try {
      const aiInsights = await getInventoryInsights(inventory);
      setInsights(aiInsights);
    } catch (err) {
      setInsights('Maaf, AI sedang tidak stabil. Coba lagi nanti.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Barang', value: stats.totalItems, icon: '📦', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
      { label: 'Total Stok', value: stats.totalStock, icon: '📊', color: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-500/30' },
      { label: 'Stok Menipis', value: stats.lowStockItems, icon: '🚨', color: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-500/30', alert: stats.lowStockItems > 0 },
      { label: "Barang Masuk Hari Ini", value: stats.transactionsInToday, icon: '📥', color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30' },
      { label: "Barang Keluar Hari Ini", value: stats.transactionsOutToday, icon: '📤', color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30' },
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
            <div className={`flex justify-between items-start`}>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/5 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
            Stok Kritis
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[350px] scrollbar-hide flex-1">
            {stats.lowStockList.length > 0 ? stats.lowStockList.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex justify-between items-center group">
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Stok: <span className="text-rose-400">{item.stock}</span> / Min: {item.minStock}
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full opacity-40">
                <p className="font-bold uppercase text-xs tracking-widest">Gudang Aman</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="glass-card p-8 rounded-[3rem] border border-white/5">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
             Paling Banyak Keluar
          </h3>
          <div className="space-y-8">
            {stats.topItemsOut.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-200">{item.name}</span>
                  <span className="text-xs text-white font-black">{item.total} Units</span>
                </div>
                <div className="w-full bg-slate-900/80 rounded-full h-2 p-0.5">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (item.total / (stats.topItemsOut[0]?.total || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Card - Optimized */}
        <div className="bg-indigo-700 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic mb-4">Pro AI Insights</h3>
            {insights ? (
              <div className="bg-black/20 p-5 rounded-2xl text-indigo-50 text-xs leading-relaxed max-h-[180px] overflow-y-auto">
                {insights}
              </div>
            ) : (
              <p className="text-indigo-200 text-xs italic opacity-60">Klik tombol di bawah untuk menganalisis gudang.</p>
            )}
          </div>
          <button 
            onClick={generateAIInsights}
            disabled={isAiLoading}
            className={`mt-6 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isAiLoading ? 'bg-indigo-800 text-indigo-500' : 'bg-white text-indigo-700 hover:scale-95'}`}
          >
            {isAiLoading ? 'MENGHUBUNGKAN KE GEMINI...' : 'GENERATE INSIGHTS SEKARANG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
