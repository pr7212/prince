import { Sale, Expense, BusinessInsight } from '../types';
import {
  computeFinancialSummary,
  calculatePercentageChange,
  formatKES,
  formatPercentage,
  isFoodExpenseCategory,
  roundToCents,
} from './calculations';

/**
 * Generates data-grounded business insights strictly from real records
 */
export function generateBusinessInsights(
  sales: Sale[],
  expenses: Expense[],
  currency: string = 'KES'
): {
  hasEnoughData: boolean;
  insights: BusinessInsight[];
  summaryNote?: string;
} {
  // If fewer than 2 transactions total, honest empty state
  if (sales.length === 0 && expenses.length === 0) {
    return {
      hasEnoughData: false,
      insights: [],
      summaryNote: 'Not enough data yet. Keep recording your sales and expenses and ProfitPilot will generate insights here.',
    };
  }

  const insights: BusinessInsight[] = [];

  // Group by date
  const salesByDate: Record<string, number> = {};
  const expensesByDate: Record<string, number> = {};
  const foodExpensesByDate: Record<string, number> = {};

  for (const s of sales) {
    salesByDate[s.date] = roundToCents((salesByDate[s.date] || 0) + s.amount);
  }

  for (const e of expenses) {
    expensesByDate[e.date] = roundToCents((expensesByDate[e.date] || 0) + e.amount);
    const isFood = e.isFoodExpense ?? isFoodExpenseCategory(e.category);
    if (isFood) {
      foodExpensesByDate[e.date] = roundToCents((foodExpensesByDate[e.date] || 0) + e.amount);
    }
  }

  const uniqueSalesDates = Object.keys(salesByDate).sort();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Average Daily Revenue
  if (uniqueSalesDates.length > 0) {
    const totalRev = Object.values(salesByDate).reduce((a, b) => a + b, 0);
    const avgDailyRev = roundToCents(totalRev / uniqueSalesDates.length);
    insights.push({
      id: 'insight_avg_rev',
      type: 'info',
      title: 'Average Daily Revenue',
      detail: `Your average daily sales across ${uniqueSalesDates.length} recorded day${uniqueSalesDates.length > 1 ? 's' : ''} is ${formatKES(avgDailyRev)}.`,
      metric: formatKES(avgDailyRev),
    });
  }

  // 2. Highest-revenue day
  if (uniqueSalesDates.length >= 2) {
    let bestDate = uniqueSalesDates[0];
    let maxRev = salesByDate[bestDate];

    for (const d of uniqueSalesDates) {
      if (salesByDate[d] > maxRev) {
        maxRev = salesByDate[d];
        bestDate = d;
      }
    }

    const dayName = new Date(bestDate + 'T12:00:00Z').toLocaleDateString('en-KE', { weekday: 'long' });
    insights.push({
      id: 'insight_peak_day',
      type: 'positive',
      title: 'Peak Sales Day',
      detail: `Your highest-revenue day was ${dayName} (${bestDate}) with ${formatKES(maxRev)} in sales.`,
      metric: dayName,
    });
  }

  // 3. Weekly Trend (Last 7 days vs Previous 7 days)
  const sortedDates = [...new Set([...Object.keys(salesByDate), ...Object.keys(expensesByDate)])].sort().reverse();
  if (sortedDates.length >= 2) {
    const d0 = new Date();
    const last7DaysSales = sales.filter((s) => {
      const diff = Math.floor((d0.getTime() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff < 7;
    });
    const prev7DaysSales = sales.filter((s) => {
      const diff = Math.floor((d0.getTime() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 7 && diff < 14;
    });

    const last7Rev = last7DaysSales.reduce((sum, s) => sum + s.amount, 0);
    const prev7Rev = prev7DaysSales.reduce((sum, s) => sum + s.amount, 0);

    if (prev7Rev > 0) {
      const pctChange = calculatePercentageChange(last7Rev, prev7Rev);
      if (pctChange !== null && Math.abs(pctChange) > 0) {
        const isUp = pctChange > 0;
        insights.push({
          id: 'insight_weekly_trend',
          type: isUp ? 'positive' : 'warning',
          title: '7-Day Revenue Trend',
          detail: `Your revenue ${isUp ? 'increased' : 'decreased'} ${Math.abs(pctChange).toFixed(1)}% compared with the previous 7 days (${formatKES(last7Rev)} vs ${formatKES(prev7Rev)}).`,
          metric: `${isUp ? '↑' : '↓'} ${Math.abs(pctChange).toFixed(1)}%`,
        });
      }
    }
  }

  // 4. Food Cost Percentage Health
  const totalRevOverall = sales.reduce((a, b) => a + b.amount, 0);
  const totalFoodOverall = expenses
    .filter((e) => e.isFoodExpense || isFoodExpenseCategory(e.category))
    .reduce((a, b) => a + b.amount, 0);

  if (totalRevOverall > 0 && totalFoodOverall > 0) {
    const foodRatio = (totalFoodOverall / totalRevOverall) * 100;
    const isHigh = foodRatio > 40;
    insights.push({
      id: 'insight_food_cost_ratio',
      type: isHigh ? 'warning' : 'positive',
      title: 'Food Cost Ratio',
      detail: `Food purchases account for ${foodRatio.toFixed(1)}% of your total sales. ${
        isHigh
          ? 'Food costs are above 40%. Check meat, vegetable, or cooking oil supplier prices to protect your margins.'
          : 'Your food cost percentage is well controlled relative to your revenue.'
      }`,
      metric: `${foodRatio.toFixed(1)}%`,
    });
  }

  // 5. Biggest Expense Category
  const catSums: Record<string, number> = {};
  for (const e of expenses) {
    catSums[e.category] = (catSums[e.category] || 0) + e.amount;
  }
  const topCat = Object.entries(catSums).sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > 0) {
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    const catPct = totalExp > 0 ? ((topCat[1] / totalExp) * 100).toFixed(1) : '0';
    insights.push({
      id: 'insight_top_expense',
      type: 'info',
      title: `Top Expense: ${topCat[0]}`,
      detail: `${topCat[0]} represents ${formatKES(topCat[1])} (${catPct}% of all your recorded expenses).`,
      metric: formatKES(topCat[1]),
    });
  }

  // 6. Dominant Payment Channel
  const methodTotals: Record<string, number> = {};
  for (const s of sales) {
    const pm = s.paymentMethod || 'Cash';
    methodTotals[pm] = (methodTotals[pm] || 0) + s.amount;
  }
  const topMethodEntry = Object.entries(methodTotals).sort((a, b) => b[1] - a[1])[0];
  if (totalRevOverall > 0 && topMethodEntry && topMethodEntry[1] > 0) {
    const share = ((topMethodEntry[1] / totalRevOverall) * 100).toFixed(1);
    insights.push({
      id: 'insight_payment_channel',
      type: 'info',
      title: `${topMethodEntry[0]} Dominance`,
      detail: `${topMethodEntry[0]} accounts for ${share}% of all collected customer receipts (${formatKES(topMethodEntry[1])}).`,
      metric: `${share}% ${topMethodEntry[0]}`,
    });
  }

  const hasEnoughData = insights.length > 0;
  return {
    hasEnoughData,
    insights,
    summaryNote: hasEnoughData
      ? undefined
      : 'Not enough data yet. Keep recording your sales and expenses and ProfitPilot will generate insights here.',
  };
}
