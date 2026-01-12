
import React, { useEffect, useState } from 'react';
import { Transaction, InventoryItem, User, TransactionType } from '../types';
import { gasService } from '../services/gasService';
import { useNotification } from '../App';

interface TransactionHistoryProps {
  user: User;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ user }) => {
  const { notify } = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: TransactionType.IN,
    quantity: 1,
    itemId: '',
    user: user.username
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [txs, inv] = await Promise.all([
      gasService.getTransactions(),
      gasService.getInventory()
    ]);
    setTransactions(txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setItems(inv);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.itemId || !newTx.quantity) return;

    try {
      const item = items.find(i => i.id === newTx.itemId);
      await gasService.addTransaction({
        itemId: newTx.itemId,
        itemName: item?.name || 'Unknown',
        type: newTx.type || TransactionType.IN,
        quantity: newTx.quantity,
        user: user.username
      });
      setShowAdd(false);
      fetchData();
      notify("Manual movement recorded successfully", "success");
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Trail</p>
          <h2 className="text-xl font-bold text-white">Resource Movement Log & Historical Records</h2>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`w-full md:w-auto px-10 py-4 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-sm ${showAdd ? 'bg-slate-800 text-slate-400 border border-white/5' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}
        >
          {showAdd ? 'Terminate Input' : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Direct Ledger Entry
            </>
          )}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-fadeIn">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Event Logic</label>
              <select 
                className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTx.type}
                onChange={(e) => setNewTx({ ...newTx, type: e.target.value as TransactionType })}
              >
                <option value={TransactionType.IN}>RECEIPT (+)</option>
                <option value={TransactionType.OUT}>ISSUANCE (-)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Resource</label>
              <select 
                required
                className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTx.itemId}
                onChange={(e) => setNewTx({ ...newTx, itemId: e.target.value })}
              >
                <option value="">IDENTIFY ENTITY...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.stock} in reservoir)</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume</label>
              <input 
                required
                type="number"
                min="1"
                className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTx.quantity}
                onChange={(e) => setNewTx({ ...newTx, quantity: parseInt(e.target.value) })}
              />
            </div>
            <button className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all">
              COMMIT TO LEDGER
            </button>
          </form>
        </div>
      )}

      <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Chronometry</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource Node</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Delta Impact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing movement logs...</td>
                </tr>
              ) : transactions.length > 0 ? transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 text-xs font-mono text-slate-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{tx.itemName}</div>
                    <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase">ID: {tx.id}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      tx.type === TransactionType.IN 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-8 py-6 font-mono font-black text-sm tracking-tighter ${tx.type === TransactionType.IN ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === TransactionType.IN ? '+' : '-'}{tx.quantity}
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600 uppercase tracking-widest">
                    {tx.user}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-600 font-bold uppercase tracking-[0.2em] italic">Omni-Channel Log Manifest Vacant</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
