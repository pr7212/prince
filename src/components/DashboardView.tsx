import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Utensils,
  Lightbulb,
  Sparkles,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Wallet,
  PieChart as PieIcon,
  BookOpen,
  Banknote,
  Smartphone,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { Sale, Expense, Restaurant, CustomerDebt, StockItem } from '../types';
import {
  computeFinancialSummary,
  formatKES,
  formatPercentage,
  calculatePercentageChange,
  roundToCents,
  isFoodExpenseCategory,
} from '../utils/calculations';
import { generateBusinessInsights } from '../utils/insights';

interface DashboardViewProps {
  restaurant: Restaurant;
  sales: Sale[];
  expenses: Expense[];
  debts?: CustomerDebt[];
  stockItems?: StockItem[];
  onOpenQuickAdd: (type: 'sale' | 'expense') => void;
  onNavigateToTransactions: () => void;
  onNavigateToReports: () => void;
  onNavigateToDebts?: () => void;
  onNavigateToStock?: () => void;
  onOpenAI: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  restaurant,
  sales,
  expenses,
  debts = [],
  stockItems = [],
  onOpenQuickAdd,
  onNavigateToTransactions,
  onNavigateToReports,
  onNavigateToDebts,
  onNavigateToStock,
  onOpenAI,
}) => {
  const [comparisonMode, setComparisonMode] = useState<'yesterday' | 'prev_week' | 'prev_month'>('yesterday');

  // Customer Debt calculation
  const unpaidDebts = debts.filter((d) => d.status !== 'settled');
  const unpaidTotal = unpaidDebts.reduce((sum, d) => sum + d.remainingBalance, 0);
  const unpaidCount = unpaidDebts.length;

  // Stock Inventory calculations
  const lowStockItems = stockItems.filter((s) => s.currentStock <= s.minThreshold);
  const totalStockValue = stockItems.reduce((sum, s) => sum + s.currentStock * s.unitCost, 0);

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date calculators
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const yesterdayStr = getPastDateStr(1);
  const sevenDaysAgoStr = getPastDateStr(7);
  const thirtyDaysAgoStr = getPastDateStr(30);

  // Today's records
  const todaySales = sales.filter((s) => s.date === todayStr);
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todaySummary = computeFinancialSummary(todaySales, todayExpenses);

  // Comparison period records
  let compSales: Sale[] = [];
  let compExpenses: Expense[] = [];
  let compLabel = 'Yesterday';

  if (comparisonMode === 'yesterday') {
    compSales = sales.filter((s) => s.date === yesterdayStr);
    compExpenses = expenses.filter((e) => e.date === yesterdayStr);
    compLabel = 'vs Yesterday';
  } else if (comparisonMode === 'prev_week') {
    // Exactly 7 days ago
    compSales = sales.filter((s) => s.date === sevenDaysAgoStr);
    compExpenses = expenses.filter((e) => e.date === sevenDaysAgoStr);
    compLabel = 'vs Same Day Last Week';
  } else {
    // 30 days ago
    compSales = sales.filter((s) => s.date === thirtyDaysAgoStr);
    compExpenses = expenses.filter((e) => e.date === thirtyDaysAgoStr);
    compLabel = 'vs 30 Days Ago';
  }

  const compSummary = computeFinancialSummary(compSales, compExpenses);

  // Compute percentage changes
  const revChangePct = calculatePercentageChange(todaySummary.revenue, compSummary.revenue);
  const expChangePct = calculatePercentageChange(todaySummary.expenses, compSummary.expenses);
  const profitChangePct = calculatePercentageChange(todaySummary.estimatedProfit, compSummary.estimatedProfit);

  // Food cost diff
  const foodCostDiff =
    todaySummary.revenue > 0 && compSummary.revenue > 0
      ? roundToCents(todaySummary.foodCostPercentage - compSummary.foodCostPercentage)
      : null;

  // Match Cash vs Poshi la Biashara (support both 'Poshi' and 'Pochi' spellings)
  const isPoshi = (m: string) => {
    const lower = (m || '').toLowerCase();
    return lower.includes('poshi') || lower.includes('pochi');
  };
  const isCash = (m: string) => (m || '').toLowerCase() === 'cash';

  // Daily Sales Inflows
  const todayCashSales = todaySales.filter((s) => isCash(s.paymentMethod));
  const todayCashSalesTotal = todayCashSales.reduce((sum, s) => sum + s.amount, 0);

  const todayPoshiSales = todaySales.filter((s) => isPoshi(s.paymentMethod));
  const todayPoshiSalesTotal = todayPoshiSales.reduce((sum, s) => sum + s.amount, 0);

  // Daily Expense Outflows
  const todayCashExpenses = todayExpenses.filter((e) => isCash(e.paymentMethod));
  const todayCashExpensesTotal = todayCashExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayPoshiExpenses = todayExpenses.filter((e) => isPoshi(e.paymentMethod));
  const todayPoshiExpensesTotal = todayPoshiExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Cash Flows by Channel
  const netPhysicalCash = todayCashSalesTotal - todayCashExpensesTotal;
  const netPoshiBalance = todayPoshiSalesTotal - todayPoshiExpensesTotal;
  const netOverallCashFlow = todaySummary.revenue - todaySummary.expenses;

  // Real data-grounded insights
  const { insights, hasEnoughData, summaryNote } = generateBusinessInsights(sales, expenses, restaurant.currency);

  return (
    <div className="space-y-6 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Welcome & Primary Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Today's Financial Overview
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
            <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span aria-hidden="true">·</span>
            <span>{restaurant.restaurantName}</span>
            <span aria-hidden="true">·</span>
            <span>{todaySummary.transactionCount.total} transactions today</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenQuickAdd('sale')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 active:scale-95 transition-all min-h-[44px]"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Record Sale</span>
          </button>
          <button
            onClick={() => onOpenQuickAdd('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm active:scale-95 transition-all min-h-[44px]"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Kitabu cha Deni Alert Banner (Unpaid meals / customer credit) */}
      {unpaidTotal > 0 && (
        <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Kitabu cha Deni</span>
                <span className="text-[10px] font-semibold bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded">
                  {unpaidCount} Pending
                </span>
              </div>
              <div className="text-xs sm:text-sm text-rose-900 mt-0.5">
                <span className="font-semibold">{unpaidCount} customer{unpaidCount > 1 ? 's owe' : ' owes'}</span> a total of{' '}
                <span className="font-bold font-mono text-rose-950 text-sm sm:text-base">{formatKES(unpaidTotal)}</span> for meals eaten on credit.
              </div>
            </div>
          </div>
          {onNavigateToDebts && (
            <button
              onClick={onNavigateToDebts}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-rose-300 text-rose-900 rounded-xl hover:bg-rose-100/60 shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <span>Open Deni Book & Collect</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 'Today at a Glance' Summary Card (Aggregates Daily Sales & Cash Flows: Cash vs. Poshi la Biashara) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Today at a Glance</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Cash Flow Summary
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Aggregated daily sales inflows and expense outflows separated by payment channel.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Today's Net Cash Flow
              </span>
              <span
                className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                  netOverallCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {netOverallCashFlow >= 0 ? '+' : ''}{formatKES(netOverallCashFlow)}
              </span>
            </div>
          </div>
        </div>

        {/* Dual Stream Panels: Standard Cash vs Poshi la Biashara */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Panel 1: Standard Cash */}
          <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">Standard Cash (Till / Register)</h3>
                    <span className="text-[10px] text-neutral-500">Physical paper cash & coins</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  {todaySummary.revenue > 0 ? ((todayCashSalesTotal / todaySummary.revenue) * 100).toFixed(0) : 0}% of sales
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-amber-100">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash Sales Inflow</span>
                    <span className="text-[10px] text-neutral-400">({todayCashSales.length} tx)</span>
                  </span>
                  <span className="font-bold font-mono text-emerald-800">
                    +{formatKES(todayCashSalesTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-amber-100">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cash Expenses Outflow</span>
                    <span className="text-[10px] text-neutral-400">({todayCashExpenses.length} tx)</span>
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    -{formatKES(todayCashExpensesTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-amber-200/90 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-800 block">Cash Left in Drawer</span>
                <span className="text-[10px] text-neutral-500">Physical drawer balance</span>
              </div>
              <span
                className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                  netPhysicalCash >= 0 ? 'text-amber-950' : 'text-rose-700'
                }`}
              >
                {netPhysicalCash >= 0 ? '+' : ''}{formatKES(netPhysicalCash)}
              </span>
            </div>
          </div>

          {/* Panel 2: Poshi la Biashara */}
          <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">Poshi la Biashara (M-Pesa)</h3>
                    <span className="text-[10px] text-neutral-500">Merchant mobile wallet ledger</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  {todaySummary.revenue > 0 ? ((todayPoshiSalesTotal / todaySummary.revenue) * 100).toFixed(0) : 0}% of sales
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Poshi Sales Inflow</span>
                    <span className="text-[10px] text-neutral-400">({todayPoshiSales.length} tx)</span>
                  </span>
                  <span className="font-bold font-mono text-emerald-800">
                    +{formatKES(todayPoshiSalesTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-emerald-100">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>Poshi Expenses Outflow</span>
                    <span className="text-[10px] text-neutral-400">({todayPoshiExpenses.length} tx)</span>
                  </span>
                  <span className="font-bold font-mono text-neutral-900">
                    -{formatKES(todayPoshiExpensesTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-emerald-200/90 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-800 block">Poshi Wallet Net</span>
                <span className="text-[10px] text-neutral-500">Retained in M-Pesa business wallet</span>
              </div>
              <span
                className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                  netPoshiBalance >= 0 ? 'text-emerald-950' : 'text-rose-700'
                }`}
              >
                {netPoshiBalance >= 0 ? '+' : ''}{formatKES(netPoshiBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Share Bar: Cash vs Poshi la Biashara */}
        {todaySummary.revenue > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  Cash Sales: <strong className="font-mono font-bold text-neutral-900">{formatKES(todayCashSalesTotal)}</strong> ({((todayCashSalesTotal / todaySummary.revenue) * 100).toFixed(1)}%)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>
                  Poshi Sales: <strong className="font-mono font-bold text-neutral-900">{formatKES(todayPoshiSalesTotal)}</strong> ({((todayPoshiSalesTotal / todaySummary.revenue) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(todayCashSalesTotal / todaySummary.revenue) * 100}%` }}
                title="Cash"
              />
              <div
                className="bg-emerald-600 h-full transition-all"
                style={{ width: `${(todayPoshiSalesTotal / todaySummary.revenue) * 100}%` }}
                title="Poshi la Biashara"
              />
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alert Strip if items need reorder */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Kitchen Stock Alert</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                  {lowStockItems.length} Low Par Level
                </span>
              </div>
              <div className="text-xs text-amber-900 mt-0.5">
                <span className="font-semibold">{lowStockItems.map((s) => s.name).slice(0, 2).join(', ')}{lowStockItems.length > 2 ? ` + ${lowStockItems.length - 2} more` : ''}</span> are below minimum kitchen par level.
              </div>
            </div>
          </div>
          {onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded-xl hover:bg-amber-100/60 shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1 min-h-[36px]"
            >
              <span>Restock Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Comparison Selector Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <span className="text-xs font-medium text-neutral-500">Benchmark Comparison:</span>
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setComparisonMode('yesterday')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              comparisonMode === 'yesterday' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setComparisonMode('prev_week')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              comparisonMode === 'prev_week' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Previous Week
          </button>
          <button
            onClick={() => setComparisonMode('prev_month')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              comparisonMode === 'prev_month' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Previous Month
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards (60-30-10 palette discipline, tabular figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
              <span className="text-[11px] text-neutral-400">{todaySales.length} sales</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {formatKES(todaySummary.revenue)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">{compLabel}</span>
            {revChangePct !== null ? (
              <span
                className={`font-semibold font-mono tabular-nums flex items-center gap-0.5 ${
                  revChangePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {revChangePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {revChangePct >= 0 ? '↑' : '↓'} {Math.abs(revChangePct)}%
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">No previous record</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
              <span className="text-[11px] text-neutral-400">{todayExpenses.length} items</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {formatKES(todaySummary.expenses)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">{compLabel}</span>
            {expChangePct !== null ? (
              <span
                className={`font-semibold font-mono tabular-nums flex items-center gap-0.5 ${
                  expChangePct <= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {expChangePct <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {expChangePct >= 0 ? '↑' : '↓'} {Math.abs(expChangePct)}%
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">No previous record</span>
            )}
          </div>
        </div>

        {/* Card 3: Estimated Profit & Margin */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Estimated Profit
                </span>
                <span
                  title="Calculated as Revenue minus recorded expenses. Figures labeled estimated as not all overheads may be logged."
                  className="cursor-help text-neutral-400"
                >
                  <HelpCircle className="w-3 h-3" />
                </span>
              </div>
              <span className="text-xs font-bold font-mono tabular-nums text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {formatPercentage(todaySummary.profitMargin)}
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                todaySummary.estimatedProfit >= 0 ? 'text-neutral-900' : 'text-rose-700'
              }`}
            >
              {formatKES(todaySummary.estimatedProfit)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">{compLabel}</span>
            {profitChangePct !== null ? (
              <span
                className={`font-semibold font-mono tabular-nums flex items-center gap-0.5 ${
                  profitChangePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {profitChangePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {profitChangePct >= 0 ? '↑' : '↓'} {Math.abs(profitChangePct)}%
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">No previous record</span>
            )}
          </div>
        </div>

        {/* Card 4: Food Costs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Food Costs</span>
              <span className="text-xs font-bold font-mono tabular-nums text-neutral-800">
                {formatPercentage(todaySummary.foodCostPercentage)}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900">
              {formatKES(todaySummary.foodExpenses)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Of Today's Revenue</span>
            <span
              className={`font-semibold font-mono tabular-nums ${
                todaySummary.foodCostPercentage > 40
                  ? 'text-amber-700'
                  : todaySummary.foodCostPercentage > 0
                  ? 'text-emerald-700'
                  : 'text-neutral-400'
              }`}
            >
              {todaySummary.revenue > 0 ? `${todaySummary.foodCostPercentage.toFixed(1)}% ratio` : 'Awaiting sales'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: Revenue Payment Channels & Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Payment Channels (M-Pesa vs Cash vs Card) */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-semibold text-neutral-900">Today's Sales Channels</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-600">
              {formatKES(todaySummary.revenue)}
            </span>
          </div>

          {todaySummary.revenue === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No sales recorded for today yet.
              <div className="mt-2">
                <button
                  onClick={() => onOpenQuickAdd('sale')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  + Record first sale
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(todaySummary.paymentMethodBreakdown).map(([method, amount]) => {
                const pct = todaySummary.revenue > 0 ? (amount / todaySummary.revenue) * 100 : 0;
                if (amount === 0) return null;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800">{method}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 font-mono text-[11px]">{pct.toFixed(1)}%</span>
                        <span className="font-semibold font-mono text-neutral-900">{formatKES(amount)}</span>
                      </div>
                    </div>
                    {/* Visual Bar Indicator */}
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          method === 'Pochi la Biashara' || method === 'M-Pesa'
                            ? 'bg-emerald-600'
                            : method === 'Cash'
                            ? 'bg-amber-600'
                            : 'bg-neutral-800'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900">Where Did Money Go Today?</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-600">
              {formatKES(todaySummary.expenses)}
            </span>
          </div>

          {todaySummary.expenses === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No expenses recorded for today yet.
              <div className="mt-2">
                <button
                  onClick={() => onOpenQuickAdd('expense')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  + Record first expense
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {Object.entries(todaySummary.expenseCategoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const pct = todaySummary.expenses > 0 ? (amount / todaySummary.expenses) * 100 : 0;
                  const isFood = isFoodExpenseCategory(category);
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isFood && <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        <span className="font-medium text-neutral-800 truncate">{category}</span>
                        {isFood && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded shrink-0">
                            Food
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-neutral-400 font-mono text-[11px]">{pct.toFixed(0)}%</span>
                        <span className="font-semibold font-mono text-neutral-900">{formatKES(amount)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Business Insights Section (Derived strictly from real data) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-neutral-900">Financial Insights & Trends</h2>
          </div>
          <button
            onClick={onOpenAI}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Financial AI</span>
          </button>
        </div>

        {!hasEnoughData ? (
          <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl p-4">
            <p className="font-medium text-neutral-700 mb-1">Not enough data yet.</p>
            <p>{summaryNote}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/70 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-900">{insight.title}</span>
                  {insight.metric && (
                    <span className="text-[11px] font-mono font-bold text-neutral-800 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{insight.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ledger Strip & View All link */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-neutral-500">
          Showing real-time calculations. Figures update immediately when transactions are added.
        </div>
        <button
          onClick={onNavigateToTransactions}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          <span>View Full Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
