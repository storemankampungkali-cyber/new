
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // Optional for login, required for admin management
}

export interface UnitOption {
  name: string;
  factor: number; // Factor to convert to base unit
  isDefault: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  defaultUnit: string;
  altUnits?: UnitOption[]; // Up to 2 alt units
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface ActivityLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  OPNAME = 'OPNAME'
}

export interface TransactionItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  convertedQuantity: number;
  remarks: string;
}

export interface OpnameItem extends TransactionItem {
  systemStock: number; // Stock in system at time of opname (in base units)
  physicalStock: number; // Stock counted physically (in base units)
  difference: number; // systemStock - physicalStock
}

export interface TransactionIn {
  id: string;
  date: string;
  supplier: string;
  poNumber: string;
  deliveryNote: string;
  items: TransactionItem[];
  photos: string[]; 
  timestamp: string;
  user: string;
}

export interface TransactionOut {
  id: string;
  date: string;
  customer?: string;
  items: TransactionItem[];
  timestamp: string;
  user: string;
}

export interface StockOpname {
  id: string;
  date: string;
  items: OpnameItem[];
  timestamp: string;
  user: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  timestamp: string;
  user: string;
}

export interface HistoricalStockReport {
  itemId: string;
  itemName: string;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  totalAdjustment: number; // From Opname
  closingStock: number;
  movements: Transaction[];
}

export interface DashboardStats {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  transactionsInToday: number;
  transactionsOutToday: number;
  topItemsOut: { name: string; total: number }[];
  lowStockList: InventoryItem[];
}
