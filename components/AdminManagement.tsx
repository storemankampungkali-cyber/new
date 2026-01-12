
import React, { useState, useEffect } from 'react';
import { User, UserRole, ActivityLog } from '../types';
import { gasService } from '../services/gasService';
import { useNotification } from '../App';

const AdminManagement: React.FC = () => {
  const { notify } = useNotification();
  const [subTab, setSubTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    if (subTab === 'users') fetchUsers();
    else fetchLogs();
  }, [subTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await gasService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    const data = await gasService.getActivityLogs();
    setLogs(data);
    setLoading(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser?.username && editingUser?.password) {
      try {
        await gasService.updateUser(editingUser as User, 'Root Admin');
        setIsUserModalOpen(false);
        fetchUsers();
        notify(`Identity node ${editingUser.id ? 'updated' : 'created'} successfully`, 'success');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === '1') return notify("Critical failure: Cannot delete primary root admin.", "error");
    if (confirm('Verify: Permanently purge this user identity?')) {
      try {
        await gasService.deleteUser(id, 'Root Admin');
        fetchUsers();
        notify('User identity purged from system registry', 'warning');
      } catch (err: any) {
        notify(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
        <button 
          onClick={() => setSubTab('users')} 
          className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${subTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          User Registry
        </button>
        <button 
          onClick={() => setSubTab('logs')} 
          className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${subTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Activity Trace
        </button>
      </div>

      {subTab === 'users' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => { setEditingUser({ role: UserRole.STAFF }); setIsUserModalOpen(true); }} 
              className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Initialize Identity Node
            </button>
          </div>
          <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity Profile</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Terminal Access</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clearance Level</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {loading ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Registry...</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 flex items-center gap-4">
                        <img src={`https://picsum.photos/seed/${u.id}/80/80`} className="w-10 h-10 rounded-xl border border-white/10" />
                        <div>
                          <div className="text-sm font-bold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase">ID: {u.id}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-indigo-400 font-mono tracking-tighter">{u.username}</div>
                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Passcode Protected</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === UserRole.ADMIN ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-3 bg-slate-800/50 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-slate-800/50 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-xl transition-all border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Chronometry</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actor Node</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Telemetry Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Analyzing Trace Streams...</td></tr>
                ) : logs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-8 py-5 text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{log.user}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 bg-slate-800 border border-white/5 rounded text-[8px] font-black uppercase tracking-widest ${log.action.includes('ERROR') ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-indigo-300'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-400 font-medium leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fadeIn">
          <div className="glass-card rounded-[3rem] w-full max-w-md p-10 border border-white/5 shadow-3xl animate-scaleUp">
            <h3 className="text-3xl font-black text-white tracking-tighter mb-10">{editingUser?.id ? 'Adjust Identity' : 'New Identity Node'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Designator (Name)</label>
                <input required className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-700" value={editingUser?.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Alias</label>
                  <input required className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" value={editingUser?.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passcode Key</label>
                  <input required type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-800" value={editingUser?.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clearance Tier</label>
                <select className="w-full px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" value={editingUser?.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                  <option value={UserRole.STAFF}>OPERATIONAL STAFF</option>
                  <option value={UserRole.ADMIN}>ROOT ADMINISTRATOR</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-white/10 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Terminate</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all">Commit Node</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
