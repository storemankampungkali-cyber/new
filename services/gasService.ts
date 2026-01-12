
import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

/**
 * ProStock Enterprise - GAS Service
 */

// Menggunakan akses yang lebih aman untuk environment variables di Vite/Vercel
const GAS_URL = (import.meta as any).env?.VITE_GAS_URL || (window as any).process?.env?.VITE_GAS_URL || "";

class GASService {
  private async callApi(action: string, payload: any = {}) {
    if (!GAS_URL) {
      console.error("VITE_GAS_URL is missing! Please check Vercel Environment Variables.");
      throw new Error("Server URL not configured.");
    }

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    } catch (e: any) {
      console.error("API Error:", e);
      throw new Error(`Cloud Sync Failed: ${e.message}`);
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
