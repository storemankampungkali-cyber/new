import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

/**
 * ProStock Enterprise - GAS Service
 * Communicates with Google Apps Script Web App API.
 * The GAS_URL should be set in environment variables as VITE_GAS_URL.
 */

const GAS_URL = (import.meta as any).env?.VITE_GAS_URL || "";

class GASService {
  private async callApi(action: string, payload: any = {}) {
    if (!GAS_URL) {
      console.warn("GAS_URL not set. Falling back to local storage (Mock Mode).");
      return this.mockApi(action, payload);
    }

    try {
      // Use standard fetch with CORS. Google Apps Script Web Apps support POST with redirects and standard JSON responses.
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

  // --- Mock Implementation for Local Testing ---
  private async mockApi(action: string, payload: any) {
    await new Promise(r => setTimeout(r, 500));
    // For local dev, we could still use localStorage or return static data
    // To keep the user happy, we assume deployment will have the GAS_URL
    throw new Error("VITE_GAS_URL environment variable is required for production.");
  }

  // --- Real API Methods ---

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

  // Fix: Added missing addTransaction method required by TransactionHistory.tsx
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
    // This could be heavy, ideally backend should aggregate it
    return await this.callApi('GET_TRANSACTIONS');
  }

  async getHistoricalStockReport(itemId: string, startDate: string, endDate: string): Promise<HistoricalStockReport> {
    // This logic should ideally reside on the backend for performance
    return await this.callApi('GET_HISTORY_REPORT', { itemId, startDate, endDate });
  }
}

export const gasService = new GASService();
