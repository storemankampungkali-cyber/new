
import { User, UserRole, InventoryItem, Transaction, TransactionType, DashboardStats, UnitOption, TransactionIn, TransactionOut, StockOpname, Supplier, ActivityLog, HistoricalStockReport } from '../types';

class GASService {
  private getUrl(): string {
    const env = (window as any).process?.env || {};
    const metaEnv = (import.meta as any).env || {};
    return env.VITE_GAS_URL || metaEnv.VITE_GAS_URL || env.GAS_URL || metaEnv.GAS_URL || "";
  }

  private async callApi(action: string, payload: any = {}) {
    const url = this.getUrl();
    if (!url) throw new Error("VITE_GAS_URL missing.");

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Server Error");
      return json.data;
    } catch (e: any) {
      console.error(`API Error (${action}):`, e.message);
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

  async updateSupplier(supplier: Supplier): Promise<void> {
    await this.callApi('UPDATE_SUPPLIER', { supplier });
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.callApi('DELETE_SUPPLIER', { id });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return await this.callApi('GET_DASHBOARD_STATS');
  }

  async getTransactions(): Promise<Transaction[]> {
    return await this.callApi('GET_TRANSACTIONS');
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

  // Fix: Added missing addTransaction method for direct ledger entry
  async addTransaction(payload: any): Promise<void> {
    return await this.callApi('ADD_TRANSACTION', payload);
  }

  // Fix: Added missing getHistoricalStockReport method for historical audits
  async getHistoricalStockReport(itemId: string, startDate: string, endDate: string): Promise<HistoricalStockReport> {
    return await this.callApi('GET_HISTORICAL_REPORT', { itemId, startDate, endDate });
  }
}

export const gasService = new GASService();
