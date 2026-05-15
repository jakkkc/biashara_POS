export type UserRole = 'owner' | 'manager' | 'sales_person' | 'inventory' | 'accountant';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId: string;
  branchId?: string;
  pin?: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  businessId: string;
  branchId?: string;
  branchName?: string;
  timestamp: any; // Using serverTimestamp()
  details: any;
  deviceInfo?: string;
  businessName?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  county: string;
  town: string;
  phone: string;
  logoUrl?: string;
  ownerEmail: string;
  status: 'active' | 'suspended';
  settings: {
    currency: string;
    vatEnabled: boolean;
    vatRate: number;
    receiptFooter?: string;
    themeColor?: string;
    language: 'en' | 'sw';
  };
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  location: string;
  phone?: string;
  managerId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  vatApplicable: boolean;
  minStock: number;
  currentStock: { [branchId: string]: number };
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  amountPaid: number;
  paymentMethods: PaymentMethod[];
  status: 'paid' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface PaymentMethod {
  method: 'cash' | 'mpesa' | 'bank' | 'card' | 'credit' | 'loyalty';
  amount: number;
  reference?: string;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
}
