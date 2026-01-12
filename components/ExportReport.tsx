
import React, { useState } from 'react';
import { gasService } from '../services/gasService';
import { InventoryItem, TransactionType } from '../types';
import Autocomplete from './Autocomplete';
import { useNotification } from '../App';

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
    notify("Menghimpun data dari cloud...", "info");
    try {
      // Mengambil data dari endpoint backend yang baru
      const allTransactions: any[] = await gasService.getTransactions();
      
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;

      const filtered = allTransactions.filter(t => {
        const ts = new Date(t.Timestamp).getTime();
        const dateMatch = ts >= start && ts <= end;
        // Penyesuaian key: backend menggunakan 'Kode' untuk ID Barang di tabel flat
        const itemMatch = selectedItem ? (t.Kode === selectedItem.id) : true;
        const typeMatch = selectedType === 'ALL' ? true : t.type === selectedType;
        return dateMatch && itemMatch && typeMatch;
      });

      if (filtered.length === 0) {
        notify("Tidak ditemukan catatan untuk filter tersebut.", "warning");
        return;
      }

      // Mapping Kolom Lengkap sesuai permintaan
      const excelData = filtered.map(t => ({
        'WAKTU_INPUT': new Date(t.Timestamp).toLocaleString(),
        'TGL_TRANSAKSI': t.Tgl ? new Date(t.Tgl).toLocaleDateString() : '-',
        'TIPE': t.type === 'IN' ? 'MASUK' : 'KELUAR',
        'KODE_BARANG': t.Kode || '-',
        'NAMA_BARANG': t.Nama || '-',
        'QTY_INPUT': t.QtyInput || 0,
        'SATUAN_INPUT': t.SatuanInput || '-',
        'QTY_PCS': t.QtyDefault || 0,
        'STOK_SEBELUM': t.StokSebelum !== undefined ? t.StokSebelum : '-',
        'STOK_SESUDAH': t.StokSesudah !== undefined ? t.StokSesudah : '-',
        'SUPPLIER/LOKASI': t.Supplier || t.KeteranganGlobal || '-',
        'NO_SJ/FORM': t.NoSJ || t.NoForm || '-',
        'OPERATOR': t.User || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit_ProStock");

      // Mengatur lebar kolom agar tidak berantakan
      ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];

      const fileName = `Export_Inventory_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify("Data berhasil diekstrak ke Excel.", "success");
    } catch (err: any) {
      notify(`Ekstraksi gagal: ${err.message}`, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-10 pb-20">
      <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter">Extraction Engine</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">Ekspor laporan audit lengkap ke format Microsoft Excel (.xlsx)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rentang Tanggal</label>
              <div className="flex gap-4 items-center">
                <input type="date" className="flex-1 p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <div className="text-slate-700 font-black">→</div>
                <input type="date" className="flex-1 p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori Transaksi</label>
              <select className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedType} onChange={e => setSelectedType(e.target.value as any)}>
                <option value="ALL">Semua Transaksi</option>
                <option value="IN">Masuk Saja</option>
                <option value="OUT">Keluar Saja</option>
              </select>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filter Barang (Opsional)</label>
              <Autocomplete onSelect={setSelectedItem} placeholder="Cari barang spesifik..." />
              {selectedItem && (
                <div className="mt-4 flex items-center justify-between p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl animate-fadeIn">
                  <span className="text-xs font-black text-indigo-400 truncate uppercase tracking-widest">{selectedItem.name}</span>
                  <button onClick={() => setSelectedItem(null)} className="text-indigo-400 hover:text-white p-1">✕</button>
                </div>
              )}
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
              UNDUH LAPORAN EXCEL (.XLSX)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportReport;
