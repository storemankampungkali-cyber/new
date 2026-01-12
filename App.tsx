
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
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

// Global Data Context
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
    if (!user || dataLoading) return;
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
    } catch (err: any) {
      notify('Koneksi Gagal: ' + err.message, 'error');
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
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('prostock_session', JSON.stringify(userData));
    notify(`Selamat Datang, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('prostock_session');
  };

  // Optimasi Konteks dengan useMemo agar tidak lag saat re-render
  const dataContextValue = useMemo(() => ({
    inventory,
    suppliers,
    stats,
    refreshData,
    loading: dataLoading
  }), [inventory, suppliers, stats, refreshData, dataLoading]);

  if (authLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-indigo-500">Initializing...</div>;

  return (
    <NotificationContext.Provider value={{ notify }}>
      <DataContext.Provider value={dataContextValue}>
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
            
            <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
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

            {/* Toasts */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
              {toasts.map(toast => (
                <div key={toast.id} className="p-4 rounded-2xl shadow-2xl border animate-slideInRight glass-card text-xs font-bold border-indigo-500/30 text-indigo-400">
                  {toast.message}
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
