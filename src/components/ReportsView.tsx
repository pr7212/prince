import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Utensils,
  Wallet,
  PieChart,
} from 'lucide-react';
import { Sale, Expense, Restaurant } from '../types';
import {
  computeFinancialSummary,
  formatKES,
  formatPercentage,
  isFoodExpenseCategory,
  roundToCents,
} from '../utils/calculations';

interface ReportsViewProps {
  restaurant: Restaurant;
  sales: Sale[];
  expenses: Expense[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  restaurant,
  sales,
  expenses,
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');

  // Custom date range inputs
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.substring(0, 7)}-01`;

  const [customStart, setCustomStart] = useState<string>(firstDayOfMonthStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Compute active date boundaries based on period
  const { startDate, endDate, periodTitle } = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    if (period === 'daily') {
      return {
        startDate: todayIso,
        endDate: todayIso,
        periodTitle: `Daily Report (${today.toLocaleDateString('en-KE', { dateStyle: 'medium' })})`,
      };
    } else if (period === 'weekly') {
      const d7 = new Date();
      d7.setDate(today.getDate() - 7);
      const startIso = d7.toISOString().split('T')[0];
      return {
        startDate: startIso,
        endDate: todayIso,
        periodTitle: `Weekly Report (${startIso} to ${todayIso})`,
      };
    } else if (period === 'monthly') {
      const startIso = `${todayIso.substring(0, 7)}-01`;
      return {
        startDate: startIso,
        endDate: todayIso,
        periodTitle: `Monthly Report (${today.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })})`,
      };
    } else {
      return {
        startDate: customStart,
        endDate: customEnd,
        periodTitle: `Custom Report (${customStart} to ${customEnd})`,
      };
    }
  }, [period, customStart, customEnd]);

  // Filter records within date range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => s.date >= startDate && s.date <= endDate);
  }, [sales, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  // Summary figures
  const summary = useMemo(() => {
    return computeFinancialSummary(filteredSales, filteredExpenses);
  }, [filteredSales, filteredExpenses]);

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['ProfitPilot Financial Report', restaurant.restaurantName],
      ['Period', periodTitle],
      ['Generated On', new Date().toLocaleString('en-KE')],
      ['Currency', restaurant.currency],
      [],
      ['FINANCIAL SUMMARY'],
      ['Metric', 'Amount (KES)', 'Percentage of Revenue'],
      ['Total Revenue', summary.revenue, '100%'],
      ['Food Expenses', summary.foodExpenses, formatPercentage(summary.foodCostPercentage)],
      ['Other Operating Expenses', summary.otherExpenses, formatPercentage(summary.revenue > 0 ? (summary.otherExpenses / summary.revenue) * 100 : 0)],
      ['Total Expenses', summary.expenses, formatPercentage(summary.revenue > 0 ? (summary.expenses / summary.revenue) * 100 : 0)],
      ['Estimated Profit', summary.estimatedProfit, formatPercentage(summary.profitMargin)],
      [],
      ['PAYMENT METHOD BREAKDOWN'],
      ['Method', 'Amount (KES)'],
      ...Object.entries(summary.paymentMethodBreakdown).map(([k, v]) => [k, v]),
      [],
      ['EXPENSE CATEGORY BREAKDOWN'],
      ['Category', 'Amount (KES)'],
      ...Object.entries(summary.expenseCategoryBreakdown).map(([k, v]) => [k, v]),
      [],
      ['DETAILED SALES LEDGER'],
      ['Date', 'Sale ID', 'Payment Method', 'Notes', 'Amount'],
      ...filteredSales.map((s) => [s.date, s.saleId, s.paymentMethod, s.notes || '', s.amount]),
      [],
      ['DETAILED EXPENSES LEDGER'],
      ['Date', 'Expense ID', 'Category', 'Description', 'Payment Method', 'Food Expense?', 'Amount'],
      ...filteredExpenses.map((e) => [
        e.date,
        e.expenseId,
        e.category,
        e.description,
        e.paymentMethod,
        e.isFoodExpense ? 'Yes' : 'No',
        e.amount,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ProfitPilot_Report_${restaurant.restaurantName.replace(/\s+/g, '_')}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit your profit & loss statement, food costs, and spending allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-neutral-300 text-neutral-800 rounded-xl hover:bg-neutral-50 shadow-xs transition-colors min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5 text-neutral-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs transition-colors min-h-[44px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Selection Control */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  period === p ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'
                }`}
              >
                {p === 'daily' ? 'Daily (Today)' : p === 'weekly' ? 'Weekly (7 Days)' : p === 'monthly' ? 'This Month' : 'Custom Dates'}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-500 font-medium">{periodTitle}</span>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Report Card: Profit & Loss Statement */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Profit & Loss Summary</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{periodTitle}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
              Margin: {formatPercentage(summary.profitMargin)}
            </span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
          {/* Revenue */}
          <div className="p-4 flex items-center justify-between bg-emerald-50/30">
            <div className="font-semibold text-emerald-900">
              Total Revenue (Sales)
              <span className="text-xs font-normal text-emerald-700 block sm:inline sm:ml-2">
                ({summary.transactionCount.sales} sales transactions)
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-800">
              {formatKES(summary.revenue)}
            </div>
          </div>

          {/* Food Costs */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-800">Food Purchases & Cost of Goods</span>
              <span className="text-xs text-neutral-500 block">
                Meat, produce, cooking oil, grains ({formatPercentage(summary.foodCostPercentage)} of revenue)
              </span>
            </div>
            <div className="font-bold font-mono tabular-nums text-neutral-900">
              - {formatKES(summary.foodExpenses)}
            </div>
          </div>

          {/* Other Expenses */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-800">Operating Overheads & Utilities</span>
              <span className="text-xs text-neutral-500 block">
                Gas, salaries, electricity, rent, packaging & transport
              </span>
            </div>
            <div className="font-bold font-mono tabular-nums text-neutral-900">
              - {formatKES(summary.otherExpenses)}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-4 flex items-center justify-between bg-neutral-50 font-semibold">
            <div className="text-neutral-700">
              Total Recorded Expenses
              <span className="text-xs font-normal text-neutral-500 block sm:inline sm:ml-2">
                ({summary.transactionCount.expenses} expense records)
              </span>
            </div>
            <div className="font-bold font-mono tabular-nums text-rose-800">
              - {formatKES(summary.expenses)}
            </div>
          </div>

          {/* Estimated Profit */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-neutral-900 text-white">
            <div>
              <div className="text-sm sm:text-base font-bold">Estimated Profit</div>
              <div className="text-[11px] text-neutral-400">
                Revenue minus total recorded expenses
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400">
                {formatKES(summary.estimatedProfit)}
              </div>
              <div className="text-[11px] font-mono text-neutral-300">
                {formatPercentage(summary.profitMargin)} profit margin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Channel Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-neutral-900">Payment Channel Breakdown</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(summary.paymentMethodBreakdown).map(([method, amount]) => {
              const pct = summary.revenue > 0 ? (amount / summary.revenue) * 100 : 0;
              return (
                <div key={method} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0">
                  <span className="font-medium text-neutral-700">{method}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-mono text-[11px]">{pct.toFixed(1)}%</span>
                    <span className="font-semibold font-mono text-neutral-900">{formatKES(amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">Expense Allocations</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {Object.entries(summary.expenseCategoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const pct = summary.expenses > 0 ? (amount / summary.expenses) * 100 : 0;
                const isFood = isFoodExpenseCategory(cat);
                return (
                  <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-1.5 truncate">
                      {isFood && <Utensils className="w-3 h-3 text-amber-600 shrink-0" />}
                      <span className="font-medium text-neutral-700 truncate">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-neutral-400 font-mono text-[11px]">{pct.toFixed(0)}%</span>
                      <span className="font-semibold font-mono text-neutral-900">{formatKES(amount)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
