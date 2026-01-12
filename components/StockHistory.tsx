
import React, { useState, useEffect } from 'react';
import { InventoryItem, HistoricalStockReport, TransactionType } from '../types';
import { gasService } from '../services/gasService';
import Autocomplete from './Autocomplete';
import { useNotification } from '../App';

const StockHistory: React.FC = () => {
  const { notify } = useNotification();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<HistoricalStockReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!selectedItem) {
      notify("Identify a resource first.", "warning");
      return;
    }
    setLoading(true);
    try {
      const data = await gasService.getHistoricalStockReport(selectedItem.id, startDate, endDate);
      setReport(data);
      notify("Audit logs synchronized.", "success");
    } catch (error: any) {
      notify(`Sync failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="glass-card p-8 rounded-[3rem] border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-8 items-end shadow-2xl">
        <div className="md:col-span-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Target Resource</label>
          <Autocomplete onSelect={setSelectedItem} placeholder="Identify entity..." />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Epoch Start</label>
          <input type="date" className="w-full p-3.5 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Epoch End</label>
          <input type="date" className="w-full p-3.5 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button 
          onClick={fetchReport}
          disabled={!selectedItem || loading}
          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${!selectedItem || loading ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-500'}`}
        >
          {loading ? 'SYNCING...' : 'PULL AUDIT LOGS'}
        </button>
      </div>

      {report ? (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="glass-card p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Base Balance</p>
              <p className="text-2xl font-black text-white tracking-tighter">{report.openingStock}</p>
            </div>
            <div className="glass-card p-6 rounded-[2rem] border border-emerald-500/10 bg-emerald-500/5">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Inflow (+)</p>
              <p className="text-2xl font-black text-emerald-400 tracking-tighter">+{report.totalIn}</p>
            </div>
            <div className="glass-card p-6 rounded-[2rem] border-rose-500/10 bg-rose-500/5">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Outflow (-)</p>
              <p className="text-2xl font-black text-rose-400 tracking-tighter">-{report.totalOut}</p>
            </div>
            <div className="glass-card p-6 rounded-[2rem] border border-amber-500/10 bg-amber-500/5">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Adjustments</p>
              <p className="text-2xl font-black text-amber-400 tracking-tighter">{report.totalAdjustment > 0 ? `-${report.totalAdjustment}` : `+${Math.abs(report.totalAdjustment)}`}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] border border-white/10 shadow-xl shadow-indigo-500/20">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Current Delta</p>
              <p className="text-2xl font-black text-white tracking-tighter">{report.closingStock}</p>
            </div>
          </div>

          <div className="glass-card rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Timeline Analytics</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{report.itemName} • Audit Trace</span>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase bg-white/5">
                    <th className="px-10 py-5">Event Timestamp</th>
                    <th className="px-10 py-5">Classification</th>
                    <th className="px-10 py-5 text-center">Volume</th>
                    <th className="px-10 py-5">Operator</th>
                    <th className="px-10 py-5 text-right">Net Reservoir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {(() => {
                    let running = report.openingStock;
                    return report.movements.slice().reverse().map((m, i) => {
                      if (m.type === TransactionType.IN) running += m.quantity;
                      else if (m.type === TransactionType.OUT) running -= m.quantity;
                      else if (m.type === TransactionType.OPNAME) running -= m.quantity;

                      return (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-10 py-6 text-xs font-bold text-slate-400">{new Date(m.timestamp).toLocaleString()}</td>
                          <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              m.type === TransactionType.IN ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              m.type === TransactionType.OUT ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {m.type === TransactionType.IN ? 'Receipt' : 
                               m.type === TransactionType.OUT ? 'Issuance' : 'Opname Reset'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-sm text-center font-black">
                             {m.type === TransactionType.IN ? <span className="text-emerald-400">+{m.quantity}</span> : 
                              m.type === TransactionType.OUT ? <span className="text-rose-400">-{m.quantity}</span> : 
                              <span className="text-amber-400">{m.quantity > 0 ? `-${m.quantity}` : `+${Math.abs(m.quantity)}`}</span>}
                          </td>
                          <td className="px-10 py-6 text-xs font-bold text-slate-600 uppercase tracking-widest">{m.user}</td>
                          <td className="px-10 py-6 text-right font-black text-indigo-400 tracking-tighter">{running}</td>
                        </tr>
                      );
                    }).reverse();
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[4rem] p-24 text-center border border-white/5 opacity-50 space-y-4">
           <svg className="w-20 h-20 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           <h3 className="text-xl font-black text-slate-500 tracking-tighter uppercase">Audit Manifest Vacant</h3>
           <p className="text-sm font-medium text-slate-600 max-w-sm mx-auto">Select a logistics node and define an epoch range to synchronize historical delta tracking.</p>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
