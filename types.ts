
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
}

export interface UnitOption {
  name: string;
  factor: number;
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
  // New Structure
  altUnit1?: string;
  conv1?: number;
  altUnit2?: string;
  conv2?: number;
  altUnit3?: string;
  conv3?: number;
  initialStock: number;
  status: 'ACTIVE' | 'INACTIVE';
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
  systemStock: number;
  physicalStock: number;
  difference: number;
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
  totalAdjustment: number;
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
