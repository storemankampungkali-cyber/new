
import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

/**
 * ProStock Enterprise - GAS Service
 * Memfasilitasi komunikasi dengan Backend Google Apps Script.
 */

class GASService {
  // Menggunakan getter agar URL selalu dievaluasi saat dipanggil, bukan saat modul dimuat
  private getUrl(): string {
    const env = (window as any).process?.env || {};
    const metaEnv = (import.meta as any).env || {};
    
    const url = env.VITE_GAS_URL || 
                env.GAS_URL || 
                metaEnv.VITE_GAS_URL || 
                metaEnv.GAS_URL || 
                "";
    
    return url;
  }

  private async callApi(action: string, payload: any = {}) {
    const url = this.getUrl();

    if (!url) {
      const errorMsg = "Konfigurasi VITE_GAS_URL tidak ditemukan. Pastikan Environment Variables sudah diatur di Vercel.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validasi format URL sederhana
    if (!url.startsWith('https://script.google.com')) {
      throw new Error("URL GAS tidak valid. Pastikan URL dimulai dengan https://script.google.com/.../exec");
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8', // Menggunakan text/plain untuk menghindari preflight CORS yang ketat pada GAS
        },
        body: JSON.stringify({ action, payload })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memproses permintaan di server.");
      return json.data;
    } catch (e: any) {
      console.error("GAS API Call Failed:", e);
      if (e.message === 'Failed to fetch') {
        throw new Error("Gagal terhubung ke Google Apps Script. Periksa koneksi internet atau pastikan Web App GAS sudah di-deploy ke 'Anyone'.");
      }
      throw e;
    }
  }

  async login(username: string, password: string): Promise<User | null> {
    return await this.callApi('LOGIN', { username, password });
  }

  async getInventory(): Promise<InventoryItem[]> {
    return await this.callApi('GET_INVENTORY');
  }

  async searchItems(query: string): Promise<InventoryItem[]> {
    return await this.callApi('SEARCH_ITEMS', { query });
  }

  async updateInventoryItem(item: InventoryItem, actor: string): Promise<void> {
    await this.callApi('UPDATE_ITEM', { item, actor });
  }

  async deleteInventoryItem(id: string, actor: string): Promise<void> {
    await this.callApi('DELETE_ITEM', { id, actor });
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await this.callApi('GET_SUPPLIERS');
  }

  async updateSupplier(supplier: Supplier, actor: string = 'System'): Promise<void> {
    await this.callApi('UPDATE_SUPPLIER', { supplier, actor });
  }

  async deleteSupplier(id: string, actor: string = 'System'): Promise<void> {
    await this.callApi('DELETE_SUPPLIER', { id, actor });
  }

  async getUsers(): Promise<User[]> {
    return await this.callApi('GET_USERS');
  }

  async updateUser(user: User, actor: string): Promise<void> {
    await this.callApi('UPDATE_USER', { user, actor });
  }

  async deleteUser(id: string, actor: string): Promise<void> {
    await this.callApi('DELETE_USER', { id, actor });
  }

  async saveTransactionIn(tx: any): Promise<void> {
    await this.callApi('SAVE_STOCK_IN', tx);
  }

  async saveTransactionOut(tx: any): Promise<void> {
    await this.callApi('SAVE_STOCK_OUT', tx);
  }

  async addTransaction(tx: any): Promise<void> {
    await this.callApi('ADD_TRANSACTION', tx);
  }

  async saveStockOpname(op: any): Promise<void> {
    await this.callApi('SAVE_OPNAME', op);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return await this.callApi('GET_DASHBOARD_STATS');
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await this.callApi('GET_LOGS');
  }

  async getTransactions(): Promise<Transaction[]> {
    return await this.callApi('GET_TRANSACTIONS');
  }

  async getHistoricalStockReport(itemId: string, startDate: string, endDate: string): Promise<HistoricalStockReport> {
    return await this.callApi('GET_HISTORY_REPORT', { itemId, startDate, endDate });
  }
}

export const gasService = new GASService();
