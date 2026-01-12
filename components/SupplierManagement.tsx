
import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { gasService } from '../services/gasService';
import { useNotification } from '../App';

const SupplierManagement: React.FC = () => {
  const { notify } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await gasService.getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier?.name) {
      try {
        await gasService.updateSupplier(editingSupplier as Supplier);
        setIsModalOpen(false);
        fetchSuppliers();
        notify(`Supplier ${editingSupplier.id ? 'updated' : 'registered'} successfully`, 'success');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Verify: Permanently delete this vendor record?')) {
      try {
        await gasService.deleteSupplier(id);
        fetchSuppliers();
        notify('Vendor record purged from database', 'warning');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">External Resources</p>
          <h2 className="text-xl font-bold text-white">Vendor Directory & Procurement Links</h2>
        </div>
        <button 
          onClick={() => { setEditingSupplier({}); setIsModalOpen(true); }}
          className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Register New Vendor
        </button>
      </div>

      <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Liaison</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Communication Channels</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Vendor Nodes...</td></tr>
              ) : suppliers.length > 0 ? suppliers.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">UUID: {s.id}</div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-400">{s.contactPerson}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-indigo-400">{s.phone}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{s.email}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} 
                        className="p-3 bg-slate-800/50 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-white/5"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)} 
                        className="p-3 bg-slate-800/50 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-xl transition-all border border-white/5"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-600 font-bold uppercase tracking-[0.2em] italic">No Logistics Vendors Registered</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fadeIn">
          <div className="glass-card rounded-[3rem] w-full max-w-lg p-10 border border-white/5 shadow-3xl animate-scaleUp">
            <h3 className="text-3xl font-black text-white tracking-tighter mb-10">
              {editingSupplier?.id ? 'Adjust Registry' : 'Register Vendor'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Identity</label>
                <input required className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-700" placeholder="Legal Name" value={editingSupplier?.name || ''} onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Liaison Officer</label>
                  <input className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" value={editingSupplier?.contactPerson || ''} onChange={e => setEditingSupplier({...editingSupplier, contactPerson: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Dial</label>
                  <input className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" value={editingSupplier?.phone || ''} onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Digital Protocol (Email)</label>
                <input type="email" className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" value={editingSupplier?.email || ''} onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Geospatial Marker (Address)</label>
                <textarea className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" rows={2} value={editingSupplier?.address || ''} onChange={e => setEditingSupplier({...editingSupplier, address: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-white/10 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Terminate</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all">Commit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
