
import React, { useState, useMemo } from 'react';
import { InventoryItem, UserRole } from '../types';
import { gasService } from '../services/gasService';
import { useNotification, useData } from '../App';

interface InventoryListProps {
  userRole: UserRole;
}

const InventoryList: React.FC<InventoryListProps> = ({ userRole }) => {
  const { inventory, loading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const { notify } = useNotification();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && editingItem.name && editingItem.sku) {
      try {
        await gasService.updateInventoryItem(editingItem as InventoryItem, 'Admin');
        setIsModalOpen(false);
        refreshData();
        notify(`Item ${editingItem.id ? 'updated' : 'created'} successfully`, 'success');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Verify: Permanently delete this logistics node?')) {
      try {
        await gasService.deleteInventoryItem(id, 'Admin');
        refreshData();
        notify('Item removed from inventory', 'warning');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-[400px] group">
          <input
            type="text"
            placeholder="Search SKU, Name, Category..."
            className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border border-white/5 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-xl text-white transition-all placeholder-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-4 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        {userRole === UserRole.ADMIN && (
          <button 
            onClick={() => { setEditingItem({ stock: 0, initialStock: 0, minStock: 0, price: 0, defaultUnit: 'Pcs', status: 'ACTIVE' }); setIsModalOpen(true); }}
            className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add New Record
          </button>
        )}
      </div>

      <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resource Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Classification</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quantities</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Master Nodes...</td>
                </tr>
              ) : filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${item.status === 'INACTIVE' ? 'opacity-50' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">SKU: {item.sku}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-900 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-white/5 group-hover:border-indigo-500/20 transition-all">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-lg font-black tracking-tighter ${item.stock <= item.minStock ? 'text-rose-500' : 'text-slate-200'}`}>
                      {item.stock} <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.defaultUnit}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                        className="p-3 bg-slate-900 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-white/5 shadow-inner"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      {userRole === UserRole.ADMIN && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-3 bg-slate-900 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-xl transition-all border border-white/5 shadow-inner"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-700 font-bold uppercase tracking-[0.2em] italic">No master records detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fadeIn">
          <div className="glass-card rounded-[3rem] w-full max-w-2xl p-10 border border-white/10 shadow-3xl animate-scaleUp overflow-y-auto max-h-[90vh] scrollbar-hide">
            <h3 className="text-3xl font-black text-white tracking-tighter mb-8">
              {editingItem?.id ? 'Adjust Profile' : 'Register Node'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Barang</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white font-medium"
                    placeholder="Contoh: Kabel Power"
                    value={editingItem?.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SKU / Kode</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white uppercase font-black tracking-widest"
                    value={editingItem?.sku || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white"
                    value={editingItem?.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Satuan Default</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white"
                    placeholder="Pcs"
                    value={editingItem?.defaultUnit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, defaultUnit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white"
                    value={editingItem?.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Konversi Satuan Alternatif</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Satuan Alt 1</label>
                    <input className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="Pack" value={editingItem?.altUnit1 || ''} onChange={e => setEditingItem({...editingItem, altUnit1: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Konversi 1 (Isi)</label>
                    <input type="number" className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="10" value={editingItem?.conv1 || ''} onChange={e => setEditingItem({...editingItem, conv1: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Satuan Alt 2</label>
                    <input className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="Box" value={editingItem?.altUnit2 || ''} onChange={e => setEditingItem({...editingItem, altUnit2: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Konversi 2 (Isi)</label>
                    <input type="number" className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="50" value={editingItem?.conv2 || ''} onChange={e => setEditingItem({...editingItem, conv2: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Satuan Alt 3</label>
                    <input className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="Pallet" value={editingItem?.altUnit3 || ''} onChange={e => setEditingItem({...editingItem, altUnit3: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 uppercase font-black">Konversi 3 (Isi)</label>
                    <input type="number" className="w-full p-3 bg-slate-950 rounded-xl border border-white/5 text-white text-xs" placeholder="500" value={editingItem?.conv3 || ''} onChange={e => setEditingItem({...editingItem, conv3: parseFloat(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stok Awal</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white font-black"
                    value={editingItem?.initialStock || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, initialStock: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Stok</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white font-black"
                    value={editingItem?.minStock || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Harga (USD)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-white font-black"
                    value={editingItem?.price || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-white/10 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Commit Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
