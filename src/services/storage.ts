import { User, Restaurant, Sale, Expense, MenuItem, CustomerDebt, DebtPaymentRecord, PaymentMethod, StockItem, StockMovement } from '../types';
import { DEMO_USER, DEMO_RESTAURANT, DEMO_SALES, DEMO_EXPENSES, DEMO_MENU_ITEMS, DEMO_DEBTS, DEMO_STOCK_ITEMS, DEMO_STOCK_MOVEMENTS } from '../data/demoData';

const STORAGE_KEYS = {
  USER: 'profitpilot_user',
  RESTAURANTS: 'profitpilot_restaurants',
  ACTIVE_RESTAURANT_ID: 'profitpilot_active_restaurant_id',
  SALES: 'profitpilot_sales',
  EXPENSES: 'profitpilot_expenses',
  MENU_ITEMS: 'profitpilot_menu_items',
  DEBTS: 'profitpilot_customer_debts',
  STOCK_ITEMS: 'profitpilot_stock_items',
  STOCK_MOVEMENTS: 'profitpilot_stock_movements',
  DEMO_MODE: 'profitpilot_is_demo_mode',
};

// Initialize with demo data if first time
export function initializeStorage(): void {
  try {
    const existingUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!existingUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify([DEMO_RESTAURANT]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_RESTAURANT_ID, DEMO_RESTAURANT.restaurantId);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(DEMO_SALES));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEMO_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEMO_MENU_ITEMS));
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(DEMO_DEBTS));
      localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(DEMO_STOCK_ITEMS));
      localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(DEMO_STOCK_MOVEMENTS));
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
    }
  } catch (err) {
    console.error('Storage initialization warning:', err);
  }
}

// User Profile
export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : DEMO_USER;
  } catch {
    return DEMO_USER;
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

// Demo Mode flag
export function isDemoModeActive(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  } catch {
    return false;
  }
}

export function setDemoModeActive(active: boolean): void {
  localStorage.setItem(STORAGE_KEYS.DEMO_MODE, active ? 'true' : 'false');
}

// Restaurants
export function getRestaurants(): Restaurant[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    return data ? JSON.parse(data) : [DEMO_RESTAURANT];
  } catch {
    return [DEMO_RESTAURANT];
  }
}

export function getActiveRestaurantId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_RESTAURANT_ID) || DEMO_RESTAURANT.restaurantId;
  } catch {
    return DEMO_RESTAURANT.restaurantId;
  }
}

export function setActiveRestaurantId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_RESTAURANT_ID, id);
}

export function getActiveRestaurant(): Restaurant {
  const list = getRestaurants();
  const activeId = getActiveRestaurantId();
  const found = list.find((r) => r.restaurantId === activeId);
  return found || list[0] || DEMO_RESTAURANT;
}

export function addRestaurant(restaurant: Restaurant): void {
  const list = getRestaurants();
  list.push(restaurant);
  localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
  setActiveRestaurantId(restaurant.restaurantId);
}

export function updateRestaurant(updated: Restaurant): void {
  const list = getRestaurants();
  const idx = list.findIndex((r) => r.restaurantId === updated.restaurantId);
  if (idx !== -1) {
    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
  }
}

// Sales - strictly isolated by restaurantId
export function getSales(restaurantId: string): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    const all: Sale[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function addSale(sale: Sale): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    const all: Sale[] = raw ? JSON.parse(raw) : [];
    // duplicate submission guard
    if (all.some((s) => s.saleId === sale.saleId)) return;
    all.unshift(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to add sale:', err);
    throw new Error('We could not save that sale. Please check your device storage and try again.');
  }
}

export function updateSale(sale: Sale): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    const all: Sale[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((s) => s.saleId === sale.saleId && s.restaurantId === sale.restaurantId);
    if (idx !== -1) {
      all[idx] = sale;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update sale:', err);
    throw new Error('Could not update sale record.');
  }
}

export function deleteSale(saleId: string, restaurantId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    const all: Sale[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => !(s.saleId === saleId && s.restaurantId === restaurantId));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete sale:', err);
  }
}

// Expenses - strictly isolated by restaurantId
export function getExpenses(restaurantId: string): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const all: Expense[] = raw ? JSON.parse(raw) : [];
    return all.filter((e) => e.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function addExpense(expense: Expense): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const all: Expense[] = raw ? JSON.parse(raw) : [];
    // duplicate guard
    if (all.some((e) => e.expenseId === expense.expenseId)) return;
    all.unshift(expense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to add expense:', err);
    throw new Error('We could not save that expense. Please check your storage and try again.');
  }
}

export function updateExpense(expense: Expense): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const all: Expense[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((e) => e.expenseId === expense.expenseId && e.restaurantId === expense.restaurantId);
    if (idx !== -1) {
      all[idx] = expense;
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update expense:', err);
    throw new Error('Could not update expense record.');
  }
}

export function deleteExpense(expenseId: string, restaurantId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const all: Expense[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((e) => !(e.expenseId === expenseId && e.restaurantId === restaurantId));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete expense:', err);
  }
}

// Menu Items - strictly isolated by restaurantId
export function getMenuItems(restaurantId: string): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    const all: MenuItem[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function addMenuItem(item: MenuItem): void {
  const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
  const all: MenuItem[] = raw ? JSON.parse(raw) : [];
  all.push(item);
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(all));
}

export function updateMenuItem(item: MenuItem): void {
  const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
  const all: MenuItem[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((m) => m.menuItemId === item.menuItemId && m.restaurantId === item.restaurantId);
  if (idx !== -1) {
    all[idx] = item;
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(all));
  }
}

export function deleteMenuItem(menuItemId: string, restaurantId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
  const all: MenuItem[] = raw ? JSON.parse(raw) : [];
  const filtered = all.filter((m) => !(m.menuItemId === menuItemId && m.restaurantId === restaurantId));
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(filtered));
}

// Customer Debts ("Kitabu cha Deni") - strictly isolated by restaurantId
export function getDebts(restaurantId: string): CustomerDebt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const all: CustomerDebt[] = raw ? JSON.parse(raw) : [];
    return all.filter((d) => d.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function addDebt(debt: CustomerDebt): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const all: CustomerDebt[] = raw ? JSON.parse(raw) : [];
    if (all.some((d) => d.debtId === debt.debtId)) return;
    all.unshift(debt);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to add debt:', err);
    throw new Error('Could not record customer debt. Please check storage.');
  }
}

export function updateDebt(debt: CustomerDebt): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const all: CustomerDebt[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((d) => d.debtId === debt.debtId && d.restaurantId === debt.restaurantId);
    if (idx !== -1) {
      all[idx] = debt;
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update debt:', err);
  }
}

export function deleteDebt(debtId: string, restaurantId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const all: CustomerDebt[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((d) => !(d.debtId === debtId && d.restaurantId === restaurantId));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete debt:', err);
  }
}

export function recordDebtPayment(
  debtId: string,
  paymentAmount: number,
  paymentMethod: PaymentMethod,
  date: string,
  restaurantId: string,
  notes?: string,
  autoRecordSale: boolean = true
): { updatedDebt: CustomerDebt; saleCreated?: Sale } {
  const debts = getDebts(restaurantId);
  const debt = debts.find((d) => d.debtId === debtId);
  if (!debt) throw new Error('Debt record not found');

  const safePayment = Math.max(0, paymentAmount);
  const newAmountPaid = (debt.amountPaid || 0) + safePayment;
  const newRemaining = Math.max(0, debt.totalAmount - newAmountPaid);
  const isSettled = newRemaining <= 0;

  const paymentRecord: DebtPaymentRecord = {
    paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: safePayment,
    paymentMethod,
    date,
    notes,
    recordedAt: new Date().toISOString(),
  };

  const updatedDebt: CustomerDebt = {
    ...debt,
    amountPaid: newAmountPaid,
    remainingBalance: newRemaining,
    status: isSettled ? 'settled' : newAmountPaid > 0 ? 'partial' : 'unpaid',
    settledAt: isSettled ? new Date().toISOString() : undefined,
    payments: [...(debt.payments || []), paymentRecord],
  };

  updateDebt(updatedDebt);

  let saleCreated: Sale | undefined;
  if (autoRecordSale && safePayment > 0) {
    saleCreated = {
      saleId: `sale_from_debt_${Date.now()}`,
      restaurantId,
      amount: safePayment,
      paymentMethod,
      date,
      notes: `Debt settlement: ${debt.customerName} (${debt.itemsDescription})`,
      createdAt: new Date().toISOString(),
    };
    addSale(saleCreated);
  }

  return { updatedDebt, saleCreated };
}

// Stock / Inventory Items
export function getStockItems(restaurantId: string): StockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    const all: StockItem[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function addStockItem(item: StockItem): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    const all: StockItem[] = raw ? JSON.parse(raw) : [];
    if (all.some((s) => s.itemId === item.itemId)) return;
    all.push(item);
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to add stock item:', err);
  }
}

export function updateStockItem(item: StockItem): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    const all: StockItem[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((s) => s.itemId === item.itemId && s.restaurantId === item.restaurantId);
    if (idx !== -1) {
      all[idx] = item;
      localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to update stock item:', err);
  }
}

export function deleteStockItem(itemId: string, restaurantId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
    const all: StockItem[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => !(s.itemId === itemId && s.restaurantId === restaurantId));
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete stock item:', err);
  }
}

// Stock Movements Log
export function getStockMovements(restaurantId: string): StockMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    const all: StockMovement[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export function recordStockMovement(
  movement: StockMovement,
  autoRecordExpense: boolean = false
): { updatedItem?: StockItem; expenseCreated?: Expense } {
  const stockItems = getStockItems(movement.restaurantId);
  const targetItem = stockItems.find((s) => s.itemId === movement.itemId);
  if (!targetItem) throw new Error('Stock item not found');

  let newStock = targetItem.currentStock;
  if (movement.type === 'in') {
    newStock += movement.quantity;
  } else if (movement.type === 'out') {
    newStock = Math.max(0, newStock - movement.quantity);
  } else if (movement.type === 'adjustment') {
    newStock = Math.max(0, movement.quantity);
  }

  const updatedItem: StockItem = {
    ...targetItem,
    currentStock: Math.round(newStock * 100) / 100,
    unitCost: movement.unitCost && movement.unitCost > 0 ? movement.unitCost : targetItem.unitCost,
    lastRestockedDate: movement.type === 'in' ? movement.date : targetItem.lastRestockedDate,
    updatedAt: new Date().toISOString(),
  };

  updateStockItem(updatedItem);

  // Save movement log
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    const allMovements: StockMovement[] = raw ? JSON.parse(raw) : [];
    allMovements.unshift(movement);
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(allMovements));
  } catch (err) {
    console.error('Failed to log stock movement:', err);
  }

  // Optionally auto-record as Expense for stock purchases
  let expenseCreated: Expense | undefined;
  if (autoRecordExpense && movement.type === 'in' && movement.totalCost && movement.totalCost > 0) {
    const isFood = [
      'Meat & Poultry',
      'Vegetables & Produce',
      'Oils & Fats',
      'Grains & Flours',
      'Dairy & Eggs',
      'Beverages & Drinks',
    ].includes(targetItem.category);

    expenseCreated = {
      expenseId: `exp_from_stock_${Date.now()}`,
      restaurantId: movement.restaurantId,
      category: targetItem.category,
      amount: movement.totalCost,
      description: `Stock Purchase: ${movement.quantity} ${targetItem.unit} of ${targetItem.name} (${movement.reason})`,
      date: movement.date,
      paymentMethod: movement.paymentMethod || 'Pochi la Biashara',
      isFoodExpense: isFood,
      createdAt: new Date().toISOString(),
    };
    addExpense(expenseCreated);
  }

  return { updatedItem, expenseCreated };
}

// Reset or Load Demo Data
export function loadSampleDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
  localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify([DEMO_RESTAURANT]));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_RESTAURANT_ID, DEMO_RESTAURANT.restaurantId);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(DEMO_SALES));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEMO_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEMO_MENU_ITEMS));
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(DEMO_DEBTS));
  localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(DEMO_STOCK_ITEMS));
  localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(DEMO_STOCK_MOVEMENTS));
  localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
}

// Clear to fresh user state
export function clearAllData(): void {
  localStorage.clear();
}
