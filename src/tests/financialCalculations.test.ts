import {
  calculateEstimatedProfit,
  calculateProfitMargin,
  calculateFoodCostPercentage,
  computeFinancialSummary,
  computeMenuItemProfitability,
  roundToCents,
  isFoodExpenseCategory,
} from '../utils/calculations';
import { Sale, Expense } from '../types';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
}

export function runFinancialCalculationsTests(): {
  allPassed: boolean;
  total: number;
  passedCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, expected: unknown, actual: unknown) {
    results.push({
      name,
      passed: condition,
      expected,
      actual,
      error: condition ? undefined : `Assertion failed for ${name}`,
    });
  }

  // 1. Test Profit Calculation: Revenue = 10000, Expenses = 6000 -> Profit = 4000
  const profit1 = calculateEstimatedProfit(10000, 6000);
  assert('Profit test (10000 - 6000 = 4000)', profit1 === 4000, 4000, profit1);

  // 2. Test Margin: Revenue = 10000, Profit = 4000 -> Margin = 40%
  const margin1 = calculateProfitMargin(10000, 4000);
  assert('Profit margin test (4000 / 10000 = 40%)', margin1 === 40, 40, margin1);

  // 3. Test Zero Revenue: Revenue = 0 -> Margin should not produce NaN or Infinity
  const zeroMargin = calculateProfitMargin(0, 0);
  assert(
    'Zero revenue margin test (safe 0%, not NaN or Infinity)',
    zeroMargin === 0 && !Number.isNaN(zeroMargin) && Number.isFinite(zeroMargin),
    0,
    zeroMargin
  );

  const zeroMarginNegativeProfit = calculateProfitMargin(0, -500);
  assert(
    'Zero revenue with expenses margin test (safe 0%)',
    zeroMarginNegativeProfit === 0 && !Number.isNaN(zeroMarginNegativeProfit),
    0,
    zeroMarginNegativeProfit
  );

  // 4. Test Food Cost: Revenue = 10000, Food expenses = 3000 -> Food cost = 30%
  const foodCost1 = calculateFoodCostPercentage(10000, 3000);
  assert('Food cost percentage test (3000 / 10000 = 30%)', foodCost1 === 30, 30, foodCost1);

  // 5. Test Zero Revenue Food Cost: safe 0%
  const zeroFoodCost = calculateFoodCostPercentage(0, 3000);
  assert('Zero revenue food cost test (safe 0%)', zeroFoodCost === 0, 0, zeroFoodCost);

  // 6. Test Floating Point Rounding to Cents
  const floatSum = roundToCents(0.1 + 0.2);
  assert('Floating point cents rounding (0.1 + 0.2 = 0.3)', floatSum === 0.3, 0.3, floatSum);

  // 7. Test Food Expense Categories
  assert('Category "Meat" is recognized as food', isFoodExpenseCategory('Meat'), true, true);
  assert('Category "Cooking oil" is recognized as food', isFoodExpenseCategory('Cooking oil'), true, true);
  assert('Category "Rent" is NOT recognized as food', isFoodExpenseCategory('Rent') === false, false, false);

  // 8. Test Tenant Isolation & Financial Summary aggregation
  const dummySales: Sale[] = [
    {
      saleId: 's1',
      restaurantId: 'rest_mama_njeri',
      amount: 18400,
      paymentMethod: 'Cash',
      date: '2026-10-02',
      createdAt: new Date().toISOString(),
    },
    {
      saleId: 's2',
      restaurantId: 'rest_mama_njeri',
      amount: 31600,
      paymentMethod: 'Pochi la Biashara',
      date: '2026-10-02',
      createdAt: new Date().toISOString(),
    },
    {
      saleId: 's3',
      restaurantId: 'rest_mama_njeri',
      amount: 4000,
      paymentMethod: 'Card',
      date: '2026-10-02',
      createdAt: new Date().toISOString(),
    },
  ];

  const dummyExpenses: Expense[] = [
    {
      expenseId: 'e1',
      restaurantId: 'rest_mama_njeri',
      category: 'Meat',
      amount: 12000,
      description: 'Beef ribs & goat meat from City Market',
      paymentMethod: 'Pochi la Biashara',
      isFoodExpense: true,
      date: '2026-10-02',
      createdAt: new Date().toISOString(),
    },
    {
      expenseId: 'e2',
      restaurantId: 'rest_mama_njeri',
      category: 'Gas',
      amount: 4500,
      description: '13kg Gas refill',
      paymentMethod: 'M-Pesa',
      isFoodExpense: false,
      date: '2026-10-02',
      createdAt: new Date().toISOString(),
    },
  ];

  const summary = computeFinancialSummary(dummySales, dummyExpenses);
  assert('Total Sales aggregation (18400 + 31600 + 4000 = 54000)', summary.revenue === 54000, 54000, summary.revenue);
  assert('Total Expenses aggregation (12000 + 4500 = 16500)', summary.expenses === 16500, 16500, summary.expenses);
  assert('Estimated Profit (54000 - 16500 = 37500)', summary.estimatedProfit === 37500, 37500, summary.estimatedProfit);
  assert('Food Expenses extracted correctly (12000)', summary.foodExpenses === 12000, 12000, summary.foodExpenses);

  // 9. Test Menu Item Profitability: Chicken & Chips (Price: 450, Cost: 210 -> Gross Profit: 240, Gross Margin: 53.33%)
  const menuItem = computeMenuItemProfitability(450, 210);
  assert('Menu item gross profit (450 - 210 = 240)', menuItem.grossProfit === 240, 240, menuItem.grossProfit);
  assert('Menu item gross margin % (~53.33%)', menuItem.grossMargin === 53.33, 53.33, menuItem.grossMargin);

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;

  return {
    allPassed,
    total: results.length,
    passedCount,
    results,
  };
}
