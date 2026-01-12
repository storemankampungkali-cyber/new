
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
    setSelectedItem(null);
    setInputQty('');
    setRemarks('');
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
      setTimeout(() => autocompleteRef.current?.focus(), 100);
    } catch (err: any) {
      notify(`Gagal: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="glass-card p-6 rounded-[2rem] flex flex-wrap gap-5 items-end border border-white/5 shadow-lg">
        <div className="w-full md:w-64 space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Keluar</label>
          <input type="date" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[280px] space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Customer / Project</label>
          <input type="text" placeholder="Project Alpha" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={customer} onChange={e => setCustomer(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 h-fit space-y-8 shadow-2xl relative overflow-visible">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">Alokasi Barang</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cari Barang</label>
                <Autocomplete ref={autocompleteRef} onSelect={setSelectedItem} placeholder="Ketik Nama/SKU..." />
              </div>
              {selectedItem && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 flex justify-between items-center shadow-inner">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Tersedia</p>
                      <p className="text-2xl font-black text-white">{selectedItem.stock} <span className="text-xs font-bold text-slate-600 uppercase">{selectedItem.defaultUnit}</span></p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">Unit Pengeluaran</label>
                    <div className="flex flex-wrap bg-slate-900/80 p-1 rounded-2xl border border-white/5 gap-1">
                      <button onClick={() => setActiveUnit({ name: selectedItem.defaultUnit, factor: 1, isDefault: true })} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.isDefault ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{selectedItem.defaultUnit}</button>
                      {selectedItem.altUnit1 && (
                        <button onClick={() => setActiveUnit({ name: selectedItem.altUnit1!, factor: selectedItem.conv1!, isDefault: false })} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.name === selectedItem.altUnit1 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{selectedItem.altUnit1}</button>
                      )}
                      {selectedItem.altUnit2 && (
                        <button onClick={() => setActiveUnit({ name: selectedItem.altUnit2!, factor: selectedItem.conv2!, isDefault: false })} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.name === selectedItem.altUnit2 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{selectedItem.altUnit2}</button>
                      )}
                      {selectedItem.altUnit3 && (
                        <button onClick={() => setActiveUnit({ name: selectedItem.altUnit3!, factor: selectedItem.conv3!, isDefault: false })} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${activeUnit?.name === selectedItem.altUnit3 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{selectedItem.altUnit3}</button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jumlah Keluar</label>
                    <div className="relative">
                      <input ref={qtyRef} type="number" className={`w-full p-4 bg-slate-900 border rounded-2xl text-2xl font-black outline-none transition-all ${validationError ? 'border-rose-500/50 text-rose-500' : 'border-white/10 text-white'}`} value={inputQty} onChange={e => setInputQty(e.target.value === '' ? '' : parseFloat(e.target.value))} onKeyDown={handleQtyKeyDown} placeholder="0" />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">{activeUnit?.name}</div>
                    </div>
                    {validationError && <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mt-2">{validationError}</p>}
                  </div>
                  <button onClick={addToCart} disabled={!!validationError || !inputQty || inputQty <= 0} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all ${!!validationError || !inputQty || inputQty <= 0 ? 'bg-slate-800 text-slate-600' : 'bg-rose-500 text-white'}`}>Alokasikan Ke Daftar</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col min-h-[500px] border border-white/5 shadow-2xl">
            <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white tracking-tight">Manifest Pengeluaran</h3>
              <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">{cart.length} Baris</span>
            </div>
            <div className="flex-1 overflow-x-auto">
              {cart.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase bg-white/5">
                      <th className="px-8 py-5">Barang</th>
                      <th className="px-8 py-4 text-center">Volume</th>
                      <th className="px-8 py-4 text-center">Dampak Stok</th>
                      <th className="px-8 py-4 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-white">{it.itemName}</div>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-black text-slate-400">{it.quantity} {it.unit}</td>
                        <td className="px-8 py-5 text-center text-xs font-black text-rose-500">-{it.convertedQuantity} PCS</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => removeFromCart(idx)} className="text-rose-500">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center p-20 text-slate-600 opacity-40">Manifest Kosong</div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t border-white/5">
                <button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black">PROSES PENGELUARAN</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionOutModule;
