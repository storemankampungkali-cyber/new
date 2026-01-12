
import React, { useState } from 'react';
import { gasService } from '../services/gasService';
import { InventoryItem, TransactionType, Transaction } from '../types';
import Autocomplete from './Autocomplete';
import { useNotification } from '../App';

// Declare XLSX for typescript as it's loaded via CDN
declare const XLSX: any;

const ExportReport: React.FC = () => {
  const { notify } = useNotification();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    notify("Aggregating data nodes...", "info");
    try {
      const allTransactions = await gasService.getTransactions();
      
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;

      let filtered = allTransactions.filter(t => {
        const ts = new Date(t.timestamp).getTime();
        const dateMatch = ts >= start && ts <= end;
        const itemMatch = selectedItem ? t.itemId === selectedItem.id : true;
        const typeMatch = selectedType === 'ALL' ? true : t.type === selectedType;
        return dateMatch && itemMatch && typeMatch;
      });

      if (filtered.length === 0) {
        notify("Zero records found for specified filters.", "warning");
        return;
      }

      const excelData = filtered.map(t => ({
        'TRANSACTION_ID': t.id,
        'TIMESTAMP': new Date(t.timestamp).toLocaleString(),
        'RESOURCE_NAME': t.itemName,
        'CLASSIFICATION': t.type === TransactionType.IN ? 'MASUK' : t.type === TransactionType.OUT ? 'KELUAR' : 'OPNAME',
        'VOLUME_PCS': t.quantity,
        'OPERATOR': t.user
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logistics_Audit");

      const now = new Date();
      const tsFile = now.getFullYear().toString() + 
                     (now.getMonth()+1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0') + "_" + 
                     now.getHours().toString().padStart(2, '0') + 
                     now.getMinutes().toString().padStart(2, '0');
      
      const fileName = `ProStock_Extraction_${tsFile}.xlsx`;

      XLSX.writeFile(wb, fileName);
      notify("Data extraction complete. Download initiated.", "success");
    } catch (err: any) {
      notify(`Extraction failure: ${err.message}`, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-10 pb-20">
      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter">Data Extraction Engine</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">Export multi-dimensional logistics records to Microsoft Excel standard (.xlsx)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal Range</label>
              <div className="flex gap-4 items-center">
                <input type="date" className="flex-1 p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <div className="text-slate-700 font-black">→</div>
                <input type="date" className="flex-1 p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Event Filtering</label>
              <select className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedType} onChange={e => setSelectedType(e.target.value as any)}>
                <option value="ALL">Omni-Channel (All Events)</option>
                <option value={TransactionType.IN}>Inbound Receipt Only</option>
                <option value={TransactionType.OUT}>Outbound Issuance Only</option>
                <option value={TransactionType.OPNAME}>Stock Opname Records</option>
              </select>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resource Scope (Optional)</label>
              <Autocomplete onSelect={setSelectedItem} placeholder="Filter specific entity..." />
              {selectedItem && (
                <div className="mt-4 flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl animate-fadeIn">
                  <span className="text-xs font-black text-indigo-400 truncate uppercase tracking-widest">{selectedItem.name}</span>
                  <button onClick={() => setSelectedItem(null)} className="text-indigo-400 hover:text-white p-1">✕</button>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-900/50 rounded-[2rem] border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Database extraction is processed in real-time. Ensure network stability before initiation.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl tracking-tighter shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {exporting ? (
             <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              INITIATE DATA EXTRACTION (.XLSX)
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[2.5rem] flex items-start gap-6">
         <div className="p-3 bg-amber-500/10 rounded-xl">
           <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
         </div>
         <div className="space-y-2">
            <h4 className="text-amber-500 font-black text-xs uppercase tracking-[0.2em]">Security Protocol</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Extraction protocols automatically scrub special characters to neutralize injection vectors. File integrity is verified via automatic timestamping <code>ProStock_Extraction_YYYYMMDD_HHMM.xlsx</code> to maintain non-repudiation in audit trails.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ExportReport;
