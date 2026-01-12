
import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

class GASService {
  private getUrl(): string {
    // Mencari URL di berbagai kemungkinan lokasi env
    const env = (window as any).process?.env || {};
    // Use any to avoid property access errors on import.meta.env
    const metaEnv = (import.meta as any).env || {};
    
    return env.VITE_GAS_URL || 
           metaEnv.VITE_GAS_URL || 
           env.GAS_URL || 
           metaEnv.GAS_URL || 
           "";
  }

  private async callApi(action: string, payload: any = {}) {
    const url = this.getUrl();

    if (!url) {
      console.error("GAS URL Missing. Action requested:", action);
      throw new Error("Konfigurasi VITE_GAS_URL tidak ditemukan. Pastikan Environment Variables sudah diatur di Vercel Settings.");
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, payload })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memproses permintaan di server.");
      
      // Log data untuk membantu debug jika inventory kosong
      if (action === 'GET_INVENTORY') {
        console.log("Inventory Data Received:", json.data?.length || 0, "items");
      }
      
      return json.data;
    } catch (e: any) {
      console.error(`GAS API Error (${action}):`, e.message);
      if (e.message === 'Failed to fetch') {
        throw new Error("Koneksi gagal. Pastikan Web App GAS sudah di-deploy sebagai 'Anyone' dan URL-nya benar.");
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

  // FIX: Missing updateSupplier method
  async updateSupplier(supplier: Supplier): Promise<void> {
    await this.callApi('UPDATE_SUPPLIER', { supplier });
  }

  // FIX: Missing deleteSupplier method
  async deleteSupplier(id: string): Promise<void> {
    await this.callApi('DELETE_SUPPLIER', { id });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return await this.callApi('GET_DASHBOARD_STATS');
  }

  async getTransactions(): Promise<Transaction[]> {
    return await this.callApi('GET_TRANSACTIONS');
  }

  // FIX: Missing addTransaction method used in TransactionHistory
  async addTransaction(tx: any): Promise<void> {
    await this.callApi('ADD_TRANSACTION', tx);
  }

  async getHistoricalStockReport(itemId: string, startDate: string, endDate: string): Promise<HistoricalStockReport> {
    return await this.callApi('GET_HISTORY_REPORT', { itemId, startDate, endDate });
  }
  
  async getUsers(): Promise<User[]> {
    return await this.callApi('GET_USERS');
  }

  // FIX: Missing updateUser method
  async updateUser(user: User, actor: string): Promise<void> {
    await this.callApi('UPDATE_USER', { user, actor });
  }

  // FIX: Missing deleteUser method
  async deleteUser(id: string, actor: string): Promise<void> {
    await this.callApi('DELETE_USER', { id, actor });
  }
  
  async getActivityLogs(): Promise<ActivityLog[]> {
    return await this.callApi('GET_LOGS');
  }

  async saveTransactionIn(tx: any): Promise<void> {
    await this.callApi('SAVE_STOCK_IN', tx);
  }

  async saveTransactionOut(tx: any): Promise<void> {
    await this.callApi('SAVE_STOCK_OUT', tx);
  }
  
  async saveStockOpname(op: any): Promise<void> {
    await this.callApi('SAVE_OPNAME', op);
  }
}

export const gasService = new GASService();
