
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, UserRole, InventoryItem, Supplier, DashboardStats } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import TransactionHistory from './components/TransactionHistory';
import TransactionInModule from './components/TransactionIn';
import TransactionOutModule from './components/TransactionOut';
import StockOpnameModule from './components/StockOpname';
import SupplierManagement from './components/SupplierManagement';
import AdminManagement from './components/AdminManagement';
import StockHistory from './components/StockHistory';
import ExportReport from './components/ExportReport';
import GeminiAgent from './components/GeminiAgent';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { gasService } from './services/gasService';

// Global Data Context for Caching
interface DataContextType {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  stats: DashboardStats | null;
  refreshData: () => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

// Global Notification Context
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface NotificationContextType {
  notify: (message: string, type?: Toast['type']) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'inbound' | 'outbound' | 'opname' | 'suppliers' | 'admin' | 'history' | 'export' | 'gemini'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cache States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const notify = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [inv, sup, st] = await Promise.all([
        gasService.getInventory(),
        gasService.getSuppliers(),
        gasService.getDashboardStats()
      ]);
      setInventory(inv);
      setSuppliers(sup);
      setStats(st);
      notify('Cache synchronized with Google Sheets', 'success');
    } catch (err: any) {
      notify('Sync Error: ' + err.message, 'error');
    } finally {
      setDataLoading(false);
    }
  }, [user, notify]);

  useEffect(() => {
    const savedUser = localStorage.getItem('prostock_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('prostock_session', JSON.stringify(userData));
    notify(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('prostock_session');
    notify('Logged out successfully', 'info');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-indigo-500 rounded-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      <DataContext.Provider value={{ inventory, suppliers, stats, refreshData, loading: dataLoading }}>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div className="flex min-h-screen bg-transparent text-slate-200 overflow-hidden">
            <Sidebar 
              isOpen={isSidebarOpen} 
              setIsOpen={setIsSidebarOpen}
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              user={user} 
              onLogout={handleLogout} 
            />
            
            <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 transition-all duration-500">
              <Header 
                user={user} 
                activeTab={activeTab} 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen}
                onRefresh={refreshData}
                isRefreshing={dataLoading}
              />
              
              <main className="p-4 md:p-8 flex-1 overflow-auto scrollbar-hide">
                <div className="max-w-[1400px] mx-auto">
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'inventory' && <InventoryList userRole={user.role} />}
                  {activeTab === 'transactions' && <TransactionHistory user={user} />}
                  {activeTab === 'inbound' && <TransactionInModule user={user} />}
                  {activeTab === 'outbound' && <TransactionOutModule user={user} />}
                  {activeTab === 'opname' && <StockOpnameModule user={user} />}
                  {activeTab === 'suppliers' && <SupplierManagement />}
                  {activeTab === 'admin' && user.role === UserRole.ADMIN && <AdminManagement />}
                  {activeTab === 'history' && <StockHistory />}
                  {activeTab === 'export' && <ExportReport />}
                  {activeTab === 'gemini' && <GeminiAgent inventory={inventory} />}
                </div>
              </main>
            </div>

            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
              {toasts.map(toast => (
                <div 
                  key={toast.id} 
                  className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border animate-slideInRight flex items-center gap-3 glass-card ${
                    toast.type === 'success' ? 'border-emerald-500/30 text-emerald-400' :
                    toast.type === 'error' ? 'border-rose-500/30 text-rose-400' :
                    toast.type === 'warning' ? 'border-amber-500/30 text-amber-400' : 'border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    toast.type === 'success' ? 'bg-emerald-500/10' :
                    toast.type === 'error' ? 'bg-rose-500/10' :
                    toast.type === 'warning' ? 'bg-amber-500/10' : 'bg-indigo-500/10'
                  }`}>
                    {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                    {toast.type === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {toast.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{toast.message}</p>
                  </div>
                  <button 
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="p-1 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DataContext.Provider>
    </NotificationContext.Provider>
  );
};

export default App;
