
import React, { useState, useEffect } from 'react';
import { InventoryItem, StockOpname, OpnameItem, UnitOption, User } from '../types';
import { gasService } from '../services/gasService';
import Autocomplete from './Autocomplete';
import { useNotification } from '../App';

interface StockOpnameProps {
  user: User;
}

const StockOpnameModule: React.FC<StockOpnameProps> = ({ user }) => {
  const { notify } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<OpnameItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Current Input State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [physicalInput, setPhysicalInput] = useState<number>(0);
  const [activeUnit, setActiveUnit] = useState<UnitOption | null>(null);
  const [remarks, setRemarks] = useState('');

  // Auto-set unit when item selected
  useEffect(() => {
    if (selectedItem) {
      const defUnit: UnitOption = { name: selectedItem.defaultUnit, factor: 1, isDefault: true };
      setActiveUnit(defUnit);
      setPhysicalInput(selectedItem.stock); // Suggest current system stock
    } else {
      setActiveUnit(null);
    }
  }, [selectedItem]);

  const addToCart = () => {
    if (!selectedItem || !activeUnit) return;

    const physicalInBase = physicalInput * activeUnit.factor;
    const systemInBase = selectedItem.stock;
    const difference = systemInBase - physicalInBase;

    const newItem: OpnameItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: physicalInput,
      unit: activeUnit.name,
      systemStock: systemInBase,
      physicalStock: physicalInBase,
      convertedQuantity: physicalInBase,
      difference: difference,
      remarks: remarks || `Adjustment via ${activeUnit.name}`
    };

    setCart([...cart, newItem]);
    setSelectedItem(null);
    setPhysicalInput(0);
    setRemarks('');
    notify(`Audited ${newItem.itemName}`, 'success');
  };

  const removeFromCart = (idx: number) => {
    const item = cart[idx];
    setCart(cart.filter((_, i) => i !== idx));
    notify(`Removed ${item.itemName} from manifest`, 'info');
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      notify("Opname manifest is empty.", "warning");
      return;
    }
    setLoading(true);
    try {
      await gasService.saveStockOpname({
        date,
        items: cart,
        user: user.username
      });
      setCart([]);
      notify("Stock levels recalibrated successfully.", "success");
    } catch (err: any) {
      notify(`Recalibration failure: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="glass-card p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row md:items-end gap-8">
        <div className="w-full md:w-64">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audit Date</label>
          <input type="date" className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Operational Protocol</p>
          <p className="text-sm font-medium text-slate-400">Syncing physical warehouse telemetry with digital inventory ledger records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Entry Panel */}
        <div className="lg:col-span-5 glass-card p-10 rounded-[3.5rem] border border-white/5 h-fit space-y-8">
          <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-4">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            Physical Count
          </h3>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identify Resource</label>
            <Autocomplete onSelect={setSelectedItem} placeholder="Search database..." />
          </div>

          {selectedItem && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Ledger</p>
                  <p className="text-2xl font-black text-white">{selectedItem.stock} <span className="text-xs font-bold text-slate-600 uppercase">{selectedItem.defaultUnit}</span></p>
                </div>
                <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 shadow-inner">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Physical Reality</p>
                  <div className="flex items-baseline gap-2">
                    <input 
                      type="number" 
                      className="w-full bg-transparent text-2xl font-black text-indigo-400 outline-none"
                      value={physicalInput}
                      onChange={e => setPhysicalInput(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-[10px] font-black text-indigo-500 uppercase">{activeUnit?.name}</span>
                  </div>
                </div>
              </div>

              {/* Unit Toggle */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">Measurement Unit</label>
                <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setActiveUnit({ name: selectedItem.defaultUnit, factor: 1, isDefault: true })}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.isDefault ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {selectedItem.defaultUnit}
                  </button>
                  {selectedItem.altUnits?.map((u, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveUnit(u)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.name === u.name ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Discrepancy Preview */}
              <div className="p-5 border border-dashed border-white/10 rounded-2xl flex justify-between items-center bg-white/[0.02]">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Delta:</span>
                <span className={`text-xl font-black tracking-tighter ${
                  (selectedItem.stock - (physicalInput * (activeUnit?.factor || 1))) === 0 
                  ? 'text-emerald-500' 
                  : 'text-rose-500'
                }`}>
                  {(selectedItem.stock - (physicalInput * (activeUnit?.factor || 1)))} {selectedItem.defaultUnit}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Audit Findings / Remarks</label>
                <textarea 
                  className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  rows={2}
                  placeholder="Damage, miscount details, etc..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              <button 
                onClick={addToCart}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all"
              >
                RECORD AUDIT ENTRY
              </button>
            </div>
          )}
        </div>

        {/* List Panel */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-card rounded-[3.5rem] border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-8 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Audit Manifest</h3>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full uppercase border border-indigo-500/20">{cart.length} AUDIT NODES</span>
            </div>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              {cart.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase bg-white/5">
                      <th className="px-8 py-5">Descriptor</th>
                      <th className="px-8 py-5 text-center">System</th>
                      <th className="px-8 py-5 text-center">Physical</th>
                      <th className="px-8 py-5 text-center">Delta</th>
                      <th className="px-8 py-5 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {cart.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold text-white">{it.itemName}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic truncate max-w-[180px]">{it.remarks}</div>
                        </td>
                        <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">{it.systemStock}</td>
                        <td className="px-8 py-6 text-center text-sm font-black text-indigo-400">{it.physicalStock}</td>
                        <td className={`px-8 py-6 text-center text-sm font-black ${it.difference === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {it.difference > 0 ? `-${it.difference}` : Math.abs(it.difference)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => removeFromCart(idx)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-slate-600 text-center space-y-4 opacity-40">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  <p className="font-bold text-xs uppercase tracking-widest">Awaiting Physical Audit Entry</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-10 bg-white/5 border-t border-white/5">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl tracking-tighter shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      FINALIZE STOCK CALIBRATION
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOpnameModule;
