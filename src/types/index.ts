export type PaymentMethod = 'Cash' | 'Pochi la Biashara' | 'M-Pesa' | 'Card' | 'Bank' | 'Other';

export type ExpenseCategory =
  | 'Food ingredients'
  | 'Meat'
  | 'Vegetables'
  | 'Cooking oil'
  | 'Drinks'
  | 'Gas'
  | 'Electricity'
  | 'Water'
  | 'Rent'
  | 'Salaries'
  | 'Transport'
  | 'Delivery'
  | 'Packaging'
  | 'Maintenance'
  | 'Marketing'
  | 'Other';

export type RestaurantType =
  | 'Eatery / Small Hotel'
  | 'Nyama Choma'
  | 'Café'
  | 'Takeaway & Fast Food'
  | 'Bakery'
  | 'Family Restaurant'
  | 'Other';

export type SubscriptionPlan = 'free' | 'pro' | 'business';

export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'admin';
  createdAt: string;
}

export interface Restaurant {
  restaurantId: string;
  ownerId: string;
  restaurantName: string;
  location: string;
  phone: string;
  currency: string; // Default: 'KES'
  restaurantType: RestaurantType;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
}

export interface Sale {
  saleId: string;
  restaurantId: string;
  amount: number; // in KES (positive integer/float)
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Expense {
  expenseId: string;
  restaurantId: string;
  category: ExpenseCategory | string;
  amount: number; // in KES (positive integer/float)
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  isFoodExpense: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface MenuItem {
  menuItemId: string;
  restaurantId: string;
  name: string;
  sellingPrice: number;
  estimatedCost: number;
  category: string;
  active: boolean;
  notes?: string;
}

export interface DebtPaymentRecord {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  recordedAt: string;
}

export interface CustomerDebt {
  debtId: string;
  restaurantId: string;
  customerName: string;
  phone?: string;
  itemsDescription: string; // What they ate or bought
  totalAmount: number; // in KES
  amountPaid: number;
  remainingBalance: number;
  status: 'unpaid' | 'partial' | 'settled';
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  settledAt?: string;
  payments?: DebtPaymentRecord[];
}

export type StockCategory =
  | 'Meat & Poultry'
  | 'Vegetables & Produce'
  | 'Oils & Fats'
  | 'Grains & Flours'
  | 'Dairy & Eggs'
  | 'Beverages & Drinks'
  | 'Gas & Fuel'
  | 'Packaging & Disposables'
  | 'Other';

export type StockUnit = 'kg' | 'g' | 'litres' | 'bags' | 'crates' | 'packets' | 'cylinders' | 'pieces';

export interface StockMovement {
  movementId: string;
  itemId: string;
  restaurantId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string; // e.g., 'Purchase / Delivery', 'Kitchen Prep & Cooking', 'Spoilage / Waste', 'Physical Count Audit'
  paymentMethod?: PaymentMethod;
  date: string; // YYYY-MM-DD
  recordedAt: string;
  recordedBy?: string;
}

export interface StockItem {
  itemId: string;
  restaurantId: string;
  name: string;
  category: StockCategory | string;
  currentStock: number;
  unit: StockUnit | string;
  unitCost: number; // in KES per unit
  minThreshold: number; // trigger low stock warning when currentStock <= minThreshold
  storageLocation?: string;
  supplier?: string;
  lastRestockedDate?: string;
  updatedAt: string;
}

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  estimatedProfit: number;
  profitMargin: number; // in %
  foodExpenses: number;
  foodCostPercentage: number; // in %
  otherExpenses: number;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  expenseCategoryBreakdown: Record<string, number>;
  transactionCount: {
    sales: number;
    expenses: number;
    total: number;
  };
}

export interface PeriodComparison {
  current: FinancialSummary;
  previous: FinancialSummary;
  revenueChangePct: number | null;
  expenseChangePct: number | null;
  profitChangePct: number | null;
  foodCostPctDiff: number | null;
}

export interface BusinessInsight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  detail: string;
  metric?: string;
}
