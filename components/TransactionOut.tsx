
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, TransactionOut, TransactionItem, UnitOption, User } from '../types';
import { gasService } from '../services/gasService';
import Autocomplete, { AutocompleteHandle } from './Autocomplete';
import { useNotification } from '../App';

interface TransactionOutProps {
  user: User;
}

const TransactionOutModule: React.FC<TransactionOutProps> = ({ user }) => {
  const { notify } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState('');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Current Input State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inputQty, setInputQty] = useState<number | ''>('');
  const [activeUnit, setActiveUnit] = useState<UnitOption | null>(null);
  const [remarks, setRemarks] = useState('');
  const [validationError, setValidationError] = useState('');

  const autocompleteRef = useRef<AutocompleteHandle>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedItem) {
      const defUnit: UnitOption = { name: selectedItem.defaultUnit, factor: 1, isDefault: true };
      setActiveUnit(defUnit);
      setInputQty('');
      setValidationError('');
      // Automatically focus quantity input when an item is selected from autocomplete
      setTimeout(() => qtyRef.current?.focus(), 10);
    } else {
      setActiveUnit(null);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem || !activeUnit || !inputQty || inputQty <= 0) {
      setValidationError('');
      return;
    }

    const converted = Number(inputQty) * activeUnit.factor;
    
    if (converted > selectedItem.stock) {
      setValidationError(`STOK KURANG: Hanya ada ${selectedItem.stock} ${selectedItem.defaultUnit}.`);
      return;
    }

    setValidationError('');
  }, [inputQty, activeUnit, selectedItem]);

  const addToCart = () => {
    if (!selectedItem || !activeUnit || !inputQty || inputQty <= 0 || validationError) return;

    const converted = Number(inputQty) * activeUnit.factor;
    const newItem: TransactionItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: Number(inputQty),
      unit: activeUnit.name,
      convertedQuantity: converted,
      remarks
    };

    setCart([...cart, newItem]);
    
    // Reset selection state
    setSelectedItem(null);
    setInputQty('');
    setRemarks('');
    
    // Focus back to search input for the next item
    setTimeout(() => autocompleteRef.current?.focus(), 10);
    
    notify(`Dialokasikan: ${newItem.itemName}`, 'success');
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addToCart();
    }
  };

  const removeFromCart = (idx: number) => {
    const item = cart[idx];
    setCart(cart.filter((_, i) => i !== idx));
    notify(`Dibatalkan: ${item.itemName}`, 'info');
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || !customer) {
      notify("Data belum lengkap: Nama Pelanggan dan Daftar Barang wajib diisi.", "warning");
      return;
    }
    setLoading(true);
    try {
      await gasService.saveTransactionOut({
        date,
        customer,
        items: cart,
        user: user.username
      });
      setCart([]);
      setCustomer('');
      notify("Pengeluaran barang berhasil diproses.", "success");
      // Final focus back to start
      setTimeout(() => autocompleteRef.current?.focus(), 100);
    } catch (err: any) {
      notify(`Gagal: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Info Form */}
      <div className="glass-card p-6 rounded-[2rem] flex flex-wrap gap-5 items-end border border-white/5 shadow-lg">
        <div className="w-full md:w-64 space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Keluar</label>
          <input type="date" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[280px] space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Customer / Project</label>
          <input type="text" placeholder="Project Alpha - Hub Utama" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={customer} onChange={e => setCustomer(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Item Selection Card - Left Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 h-fit space-y-8 shadow-2xl relative overflow-visible">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
              Alokasi Barang
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cari Barang</label>
                <Autocomplete 
                  ref={autocompleteRef}
                  onSelect={setSelectedItem} 
                  placeholder="Ketik Nama/SKU barang..." 
                />
              </div>

              {selectedItem && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 flex justify-between items-center shadow-inner">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Tersedia</p>
                      <p className="text-2xl font-black text-white">{selectedItem.stock} <span className="text-xs font-bold text-slate-600 uppercase">{selectedItem.defaultUnit}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Kategori</p>
                      <p className="text-xs font-bold text-indigo-400">{selectedItem.category}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">Unit Pengeluaran</label>
                    <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => setActiveUnit({ name: selectedItem.defaultUnit, factor: 1, isDefault: true })}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.isDefault ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {selectedItem.defaultUnit}
                      </button>
                      {selectedItem.altUnits?.map((u, i) => (
                        <button 
                          key={i}
                          onClick={() => setActiveUnit(u)}
                          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.name === u.name ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jumlah Keluar</label>
                    <div className="relative">
                      <input 
                        ref={qtyRef}
                        type="number" 
                        className={`w-full p-4 bg-slate-900 border rounded-2xl text-2xl font-black outline-none transition-all placeholder-slate-800 ${validationError ? 'border-rose-500/50 bg-rose-500/5 text-rose-500' : 'border-white/10 focus:ring-2 focus:ring-indigo-500 text-white'}`}
                        value={inputQty} 
                        onChange={e => setInputQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onKeyDown={handleQtyKeyDown}
                        placeholder="0"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeUnit?.name}</div>
                    </div>
                    {validationError && (
                      <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {validationError}
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={addToCart}
                    disabled={!!validationError || !inputQty || inputQty <= 0}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${!!validationError || !inputQty || inputQty <= 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'}`}
                  >
                    Alokasikan Ke Daftar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 p-5 bg-rose-500/5 rounded-3xl border border-rose-500/10">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
              Rapid Dispatch Workflow
            </h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
              1. Identifikasi barang dengan <span className="text-rose-400">ENTER</span><br/>
              2. Tentukan volume, tekan <span className="text-rose-400">ENTER</span> untuk alokasi<br/>
              3. Lanjut ke item berikutnya
            </p>
          </div>
        </div>

        {/* List Card - Right Side */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col min-h-[500px] border border-white/5 shadow-2xl">
            <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Manifest Pengeluaran
              </h3>
              <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase border border-rose-500/20">{cart.length} Baris</span>
            </div>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              {cart.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase bg-white/5">
                      <th className="px-8 py-5">Barang</th>
                      <th className="px-8 py-5 text-center">Volume</th>
                      <th className="px-8 py-5 text-center">Dampak Stok</th>
                      <th className="px-8 py-5 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {cart.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold text-white">{it.itemName}</div>
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">ID: {it.itemId}</div>
                        </td>
                        <td className="px-8 py-6 text-center text-sm font-black text-slate-400">{it.quantity} {it.unit}</td>
                        <td className="px-8 py-6 text-center text-xs font-black text-rose-500">-{it.convertedQuantity} PCS</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => removeFromCart(idx)} className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-slate-600 text-center space-y-4 opacity-40 py-32">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="font-black text-xs uppercase tracking-[0.3em]">Manifest Kosong</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Gunakan form di kiri untuk menentukan alokasi</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-white/5 border-t border-white/5">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg tracking-tighter shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      PROSES PENGELUARAN BARANG
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

export default TransactionOutModule;
