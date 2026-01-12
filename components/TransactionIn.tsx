
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, TransactionIn, TransactionItem, UnitOption, User } from '../types';
import { gasService } from '../services/gasService';
import Autocomplete, { AutocompleteHandle } from './Autocomplete';
import { useNotification } from '../App';

interface TransactionInProps {
  user: User;
}

const TransactionInModule: React.FC<TransactionInProps> = ({ user }) => {
  const { notify } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // New Item State
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [currentQty, setCurrentQty] = useState<number | ''>(1);
  const [currentUnitName, setCurrentUnitName] = useState('');
  const [currentRemarks, setCurrentRemarks] = useState('');

  const autocompleteRef = useRef<AutocompleteHandle>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const remarksRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentItem) {
      const units: UnitOption[] = [
        { name: currentItem.defaultUnit, factor: 1, isDefault: true },
        ...(currentItem.altUnits || [])
      ];
      setAvailableUnits(units);
      setCurrentUnitName(currentItem.defaultUnit);
      // Automatically focus quantity input when an item is selected from autocomplete
      setTimeout(() => qtyRef.current?.focus(), 10);
    } else {
      setAvailableUnits([]);
      setCurrentUnitName('');
    }
  }, [currentItem]);

  const addToCart = () => {
    if (!currentItem || !currentQty || currentQty <= 0) {
      notify("Pilih barang dan masukkan jumlah valid.", "warning");
      return;
    }
    
    const unitObj = availableUnits.find(u => u.name === currentUnitName) || availableUnits[0];
    const convertedQty = Number(currentQty) * unitObj.factor;

    const newItem: TransactionItem = {
      itemId: currentItem.id,
      itemName: currentItem.name,
      quantity: Number(currentQty),
      unit: unitObj.name,
      convertedQuantity: convertedQty,
      remarks: currentRemarks
    };

    setCart([...cart, newItem]);
    
    // Reset entry state
    setCurrentItem(null);
    setCurrentQty(1);
    setCurrentRemarks('');
    
    // Focus back to search input for the next item
    setTimeout(() => autocompleteRef.current?.focus(), 10);
    
    notify(`Ditambahkan: ${newItem.itemName}`, 'success');
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addToCart();
    }
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    notify(`Dihapus: ${item.itemName}`, 'info');
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || !supplier || !poNumber) {
      notify("Data belum lengkap: Supplier, No PO, dan Daftar Barang wajib ada.", "warning");
      return;
    }

    setLoading(true);
    try {
      await gasService.saveTransactionIn({
        date,
        supplier,
        poNumber,
        deliveryNote,
        items: cart,
        photos,
        user: user.username
      });
      
      setCart([]);
      setSupplier('');
      setPoNumber('');
      setDeliveryNote('');
      setPhotos([]);
      notify("Transaksi berhasil disimpan ke cloud.", "success");
      // Final focus back to start
      setTimeout(() => autocompleteRef.current?.focus(), 100);
    } catch (error: any) {
      notify(`Gagal menyimpan: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Info Form */}
      <div className="glass-card p-6 rounded-[2rem] border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-5 shadow-lg">
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Kedatangan</label>
          <input type="date" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor / Supplier</label>
          <input type="text" placeholder="Global Logistics" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={supplier} onChange={e => setSupplier(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Referensi No. PO</label>
          <input type="text" placeholder="PO-2024-XXXX" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Surat Jalan</label>
          <input type="text" placeholder="SJ-XXXX" className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Item Entry Form - Left Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/5 h-fit shadow-2xl relative overflow-visible">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
               <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
               Input Barang
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cari Barang (Ketik Nama/SKU)</label>
                <Autocomplete 
                  ref={autocompleteRef}
                  onSelect={(item) => setCurrentItem(item)} 
                  placeholder="Mulai mengetik..." 
                />
                {currentItem && (
                  <div className="mt-2 text-[10px] font-black text-indigo-400 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 flex justify-between items-center animate-fadeIn">
                    <span>AKTIF: {currentItem.name}</span>
                    <span className="opacity-50">STOK SAAT INI: {currentItem.stock}</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jumlah</label>
                  <input 
                    ref={qtyRef}
                    type="number" 
                    min="1" 
                    className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-xl font-black outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-800" 
                    value={currentQty} 
                    onChange={e => setCurrentQty(e.target.value === '' ? '' : parseInt(e.target.value))} 
                    onKeyDown={handleQtyKeyDown}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Satuan</label>
                  <select className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 h-[60px]" value={currentUnitName} onChange={e => setCurrentUnitName(e.target.value)}>
                    {availableUnits.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Catatan Logistik</label>
                <textarea 
                  ref={remarksRef}
                  className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" 
                  rows={2} 
                  value={currentRemarks} 
                  onChange={e => setCurrentRemarks(e.target.value)} 
                  placeholder="Keterangan kondisi, lokasi rak, dll..."
                ></textarea>
              </div>

              <button 
                onClick={addToCart}
                disabled={!currentItem}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${currentItem ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Tambahkan Ke Antrian
              </button>
            </div>
          </div>
          
          <div className="px-4 p-5 bg-white/5 rounded-3xl border border-white/5">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
              Fast Track Workflow
            </h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
              1. Pilih barang dengan <span className="text-indigo-400">ENTER</span><br/>
              2. Masukkan qty, tekan <span className="text-indigo-400">ENTER</span> untuk simpan ke list<br/>
              3. Ulangi untuk barang berikutnya
            </p>
          </div>
        </div>

        {/* Queue Display - Right Side */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[3rem] overflow-hidden flex flex-col min-h-[500px] border border-white/5 shadow-2xl">
            <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Antrian Barang Masuk
              </h3>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase border border-indigo-500/20">{cart.length} Baris</span>
            </div>
            
            <div className="flex-1">
              {cart.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-500 uppercase bg-white/5">
                    <tr>
                      <th className="px-8 py-4">Informasi Barang</th>
                      <th className="px-8 py-4 text-center">Qty Input</th>
                      <th className="px-8 py-4 text-center">Konversi (Pcs)</th>
                      <th className="px-8 py-4 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-white">{item.itemName}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{item.remarks || 'Tanpa catatan'}</div>
                        </td>
                        <td className="px-8 py-5 text-sm text-center font-bold text-slate-400">{item.quantity} {item.unit}</td>
                        <td className="px-8 py-5 text-sm text-center text-indigo-400 font-black">{item.convertedQuantity} Pcs</td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => removeFromCart(idx)} className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4 opacity-40 py-32">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="font-black text-xs uppercase tracking-[0.3em]">Antrian Kosong</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Gunakan form di kiri untuk menambah barang</p>
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-8 bg-white/5 border-t border-white/5">
                <button 
                  disabled={loading}
                  onClick={handleSubmit}
                  className={`w-full py-5 rounded-[2rem] font-black text-lg tracking-tighter transition-all shadow-2xl flex items-center justify-center gap-4 ${loading ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20 active:scale-95'}`}
                >
                  {loading ? <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      SIMPAN PENERIMAAN BARANG
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

export default TransactionInModule;
