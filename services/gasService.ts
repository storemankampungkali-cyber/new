
import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

/**
 * ProStock Enterprise - GAS Service
 * Memfasilitasi komunikasi dengan Backend Google Apps Script.
 */

// Helper untuk mengambil environment variable secara aman
const getEnvVar = (name: string): string => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.[name]) {
    return (window as any).process.env[name];
  }
  return (import.meta as any).env?.[name] || "";
};

// Mencoba mengambil dengan prefiks VITE_ atau tanpa prefiks
const GAS_URL = getEnvVar('VITE_GAS_URL') || getEnvVar('GAS_URL');

class GASService {
  private async callApi(action: string, payload: any = {}) {
    if (!GAS_URL) {
      const errorMsg = "VITE_GAS_URL tidak terkonfigurasi. Harap tambahkan ke Environment Variables di dashboard Vercel dan lakukan REDEPLOY.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      
      if (!res.ok) {
        throw new Error(`Server merespon dengan status: ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memproses permintaan di server.");
      return json.data;
    } catch (e: any) {
      console.error("GAS API Call Failed:", e);
      // Memberikan pesan yang lebih jelas untuk error jaringan umum
      if (e.message === 'Failed to fetch') {
        throw new Error("Gagal menghubungi Google Apps Script. Pastikan URL benar dan izin Web App diatur ke 'Anyone'.");
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
