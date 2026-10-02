import { Expense, PaymentMethod, Sale, FinancialSummary, ExpenseCategory } from '../types';

/**
 * Standard food-related categories
 */
export const FOOD_CATEGORIES: ReadonlySet<string> = new Set([
  'Food ingredients',
  'Meat',
  'Vegetables',
  'Cooking oil',
  'Drinks',
]);

/**
 * Checks whether an expense category qualifies as food cost
 */
export function isFoodExpenseCategory(category: string): boolean {
  if (!category) return false;
  const normalized = category.trim().toLowerCase();
  for (const foodCat of FOOD_CATEGORIES) {
    if (foodCat.toLowerCase() === normalized) return true;
  }
  return false;
}

/**
 * Rounds a number to 2 decimal places to avoid floating point issues
 */
export function roundToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a monetary number in Kenyan Shillings (KES)
 * Example: 54000 -> "KSh 54,000"
 */
export function formatKES(amount: number, includeDecimals = false): string {
  if (!Number.isFinite(amount)) return 'KSh 0';
  const rounded = roundToCents(amount);
  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: includeDecimals && rounded % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `KSh ${formatted}`;
}

/**
 * Formats a percentage
 * Example: 44.444 -> "44.4%"
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Calculates Estimated Profit:
 * Estimated Profit = Revenue - Total Expenses
 */
export function calculateEstimatedProfit(revenue: number, totalExpenses: number): number {
  const safeRev = Math.max(0, roundToCents(revenue));
  const safeExp = Math.max(0, roundToCents(totalExpenses));
  return roundToCents(safeRev - safeExp);
}

/**
 * Calculates Profit Margin %:
 * Profit Margin = (Estimated Profit / Revenue) * 100
 * Handles zero revenue safely without producing NaN or Infinity
 */
export function calculateProfitMargin(revenue: number, estimatedProfit: number): number {
  const safeRev = roundToCents(revenue);
  if (safeRev <= 0) {
    return 0;
  }
  const margin = (estimatedProfit / safeRev) * 100;
  return roundToCents(margin);
}

/**
 * Calculates Food Cost %:
 * Food Cost Percentage = (Food Expenses / Revenue) * 100
 * Handles zero revenue safely
 */
export function calculateFoodCostPercentage(revenue: number, foodExpenses: number): number {
  const safeRev = roundToCents(revenue);
  if (safeRev <= 0) {
    return 0;
  }
  const safeFood = roundToCents(foodExpenses);
  const percentage = (safeFood / safeRev) * 100;
  return roundToCents(percentage);
}

/**
 * Calculates percentage change between previous and current period
 * Returns null if previous is 0 to avoid misleading infinity
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  const diff = current - previous;
  return roundToCents((diff / previous) * 100);
}

/**
 * Aggregates a list of sales and expenses into a full FinancialSummary
 */
export function computeFinancialSummary(sales: Sale[], expenses: Expense[]): FinancialSummary {
  let revenue = 0;
  let totalExpenses = 0;
  let foodExpenses = 0;

  const paymentMethodBreakdown: Record<PaymentMethod, number> = {
    'Cash': 0,
    'Pochi la Biashara': 0,
    'M-Pesa': 0,
    'Card': 0,
    'Bank': 0,
    'Other': 0,
  };

  const expenseCategoryBreakdown: Record<string, number> = {};

  for (const sale of sales) {
    const amt = Math.max(0, roundToCents(sale.amount || 0));
    revenue = roundToCents(revenue + amt);

    const pm = (sale.paymentMethod || 'Cash') as PaymentMethod;
    paymentMethodBreakdown[pm] = roundToCents((paymentMethodBreakdown[pm] || 0) + amt);
  }

  for (const exp of expenses) {
    const amt = Math.max(0, roundToCents(exp.amount || 0));
    totalExpenses = roundToCents(totalExpenses + amt);

    const isFood = exp.isFoodExpense ?? isFoodExpenseCategory(exp.category);
    if (isFood) {
      foodExpenses = roundToCents(foodExpenses + amt);
    }

    const cat = exp.category || 'Other';
    expenseCategoryBreakdown[cat] = roundToCents((expenseCategoryBreakdown[cat] || 0) + amt);
  }

  const estimatedProfit = calculateEstimatedProfit(revenue, totalExpenses);
  const profitMargin = calculateProfitMargin(revenue, estimatedProfit);
  const foodCostPercentage = calculateFoodCostPercentage(revenue, foodExpenses);
  const otherExpenses = roundToCents(Math.max(0, totalExpenses - foodExpenses));

  return {
    revenue,
    expenses: totalExpenses,
    estimatedProfit,
    profitMargin,
    foodExpenses,
    foodCostPercentage,
    otherExpenses,
    paymentMethodBreakdown,
    expenseCategoryBreakdown,
    transactionCount: {
      sales: sales.length,
      expenses: expenses.length,
      total: sales.length + expenses.length,
    },
  };
}

/**
 * Calculates Menu Item gross profit and margin
 */
export function computeMenuItemProfitability(sellingPrice: number, estimatedCost: number) {
  const price = Math.max(0, roundToCents(sellingPrice));
  const cost = Math.max(0, roundToCents(estimatedCost));
  const grossProfit = roundToCents(price - cost);
  const grossMargin = price > 0 ? roundToCents((grossProfit / price) * 100) : 0;

  return {
    sellingPrice: price,
    estimatedCost: cost,
    grossProfit,
    grossMargin,
  };
}
