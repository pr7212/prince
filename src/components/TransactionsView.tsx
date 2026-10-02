import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit2,
  Calendar,
  Utensils,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { Sale, Expense, PaymentMethod, ExpenseCategory } from '../types';
import { formatKES, isFoodExpenseCategory } from '../utils/calculations';

interface TransactionItem {
  id: string;
  type: 'sale' | 'expense';
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  category?: string;
  description?: string;
  isFoodExpense?: boolean;
  rawSale?: Sale;
  rawExpense?: Expense;
  createdAt: string;
}

interface TransactionsViewProps {
  restaurantId: string;
  sales: Sale[];
  expenses: Expense[];
  onOpenQuickAdd: (type: 'sale' | 'expense') => void;
  onUpdateSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  restaurantId,
  sales,
  expenses,
  onOpenQuickAdd,
  onUpdateSale,
  onDeleteSale,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Edit State
  const [editingItem, setEditingItem] = useState<TransactionItem | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [editCategory, setEditCategory] = useState<string>('Meat');

  // Delete Confirm State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TransactionItem | null>(null);

  // Combine sales and expenses into a unified ledger
  const allTransactions: TransactionItem[] = useMemo(() => {
    const list: TransactionItem[] = [];

    for (const s of sales) {
      list.push({
        id: s.saleId,
        type: 'sale',
        amount: s.amount,
        paymentMethod: s.paymentMethod,
        date: s.date,
        description: s.notes || 'Customer sales',
        rawSale: s,
        createdAt: s.createdAt,
      });
    }

    for (const e of expenses) {
      list.push({
        id: e.expenseId,
        type: 'expense',
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        date: e.date,
        category: e.category,
        description: e.description,
        isFoodExpense: e.isFoodExpense ?? isFoodExpenseCategory(e.category),
        rawExpense: e,
        createdAt: e.createdAt,
      });
    }

    // Sort descending by date and creation
    return list.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [sales, expenses]);

  // Filtered transactions
  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const d0 = new Date();

    return allTransactions.filter((item) => {
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Payment filter
      if (filterPayment !== 'all' && item.paymentMethod !== filterPayment) return false;

      // Date range filter
      if (dateRangeFilter === 'today' && item.date !== today) return false;

      if (dateRangeFilter === 'week') {
        const itemDate = new Date(item.date);
        const diffDays = Math.floor((d0.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 7) return false;
      }

      if (dateRangeFilter === 'month') {
        const itemMonth = item.date.substring(0, 7);
        const thisMonth = today.substring(0, 7);
        if (itemMonth !== thisMonth) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const payMatch = item.paymentMethod.toLowerCase().includes(q);
        const amtMatch = String(item.amount).includes(q);
        if (!descMatch && !catMatch && !payMatch && !amtMatch) return false;
      }

      return true;
    });
  }, [allTransactions, filterType, filterPayment, dateRangeFilter, searchTerm]);

  // Aggregate for current filtered view
  const summaryTotals = useMemo(() => {
    let salesTotal = 0;
    let expTotal = 0;
    for (const item of filtered) {
      if (item.type === 'sale') salesTotal += item.amount;
      else expTotal += item.amount;
    }
    return {
      salesTotal,
      expTotal,
      net: salesTotal - expTotal,
      count: filtered.length,
    };
  }, [filtered]);

  // Open Edit Modal
  const startEditing = (item: TransactionItem) => {
    setEditingItem(item);
    setEditAmount(String(item.amount));
    setEditDescription(item.description || '');
    setEditPaymentMethod(item.paymentMethod);
    setEditCategory(item.category || 'Meat');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const amt = parseFloat(editAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;

    if (editingItem.type === 'sale' && editingItem.rawSale) {
      const updated: Sale = {
        ...editingItem.rawSale,
        amount: amt,
        paymentMethod: editPaymentMethod,
        notes: editDescription.trim() || undefined,
      };
      onUpdateSale(updated);
    } else if (editingItem.type === 'expense' && editingItem.rawExpense) {
      const updated: Expense = {
        ...editingItem.rawExpense,
        amount: amt,
        paymentMethod: editPaymentMethod,
        category: editCategory,
        description: editDescription.trim() || `${editCategory} expense`,
        isFoodExpense: isFoodExpenseCategory(editCategory),
      };
      onUpdateExpense(updated);
    }

    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'sale') {
      onDeleteSale(deleteConfirmItem.id);
    } else {
      onDeleteExpense(deleteConfirmItem.id);
    }
    setDeleteConfirmItem(null);
  };

  return (
    <div className="space-y-4 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full record of money received and money spent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenQuickAdd('sale')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </button>
          <button
            onClick={() => onOpenQuickAdd('expense')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary strip of currently filtered ledger */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 bg-white rounded-xl border border-neutral-200">
        <div>
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Filtered Sales
          </span>
          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-800">
            {formatKES(summaryTotals.salesTotal)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Filtered Expenses
          </span>
          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-rose-800">
            {formatKES(summaryTotals.expTotal)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Estimated Net
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
              summaryTotals.net >= 0 ? 'text-neutral-900' : 'text-rose-700'
            }`}
          >
            {formatKES(summaryTotals.net)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search description, category, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterType === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              All ({allTransactions.length})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterType === 'sale' ? 'bg-white text-emerald-800 shadow-xs' : 'text-neutral-600'
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterType === 'expense' ? 'bg-white text-rose-800 shadow-xs' : 'text-neutral-600'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* Date and Payment Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs">
          {/* Date Range Chips */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 mr-1" />
            {(['today', 'week', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRangeFilter(r)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  dateRangeFilter === r
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'Last 7 Days' : r === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[11px]">Payment:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="py-1 px-2 text-xs bg-neutral-50 border border-neutral-200 rounded-md outline-none"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Pochi la Biashara">Pochi la Biashara</option>
              <option value="M-Pesa">M-Pesa (Till/Other)</option>
              <option value="Card">Card</option>
              <option value="Bank">Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table / List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <p className="font-semibold text-neutral-700 mb-1">No transactions match your filter.</p>
            <p className="text-neutral-400 mb-3">Try adjusting your search or date range.</p>
            <button
              onClick={() => onOpenQuickAdd('sale')}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              + Record New Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((item) => {
              const isSale = item.type === 'sale';
              return (
                <div
                  key={`${item.type}_${item.id}`}
                  className="p-3.5 sm:p-4 hover:bg-neutral-50/80 transition-colors flex items-center justify-between gap-3 group"
                >
                  {/* Left Column: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isSale ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isSale ? (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                          {item.description}
                        </span>
                        {item.category && (
                          <span className="text-[11px] font-medium text-neutral-600 truncate hidden sm:inline">
                            · {item.category}
                          </span>
                        )}
                        {item.isFoodExpense && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                            <Utensils className="w-2.5 h-2.5" /> Food Cost
                          </span>
                        )}
                      </div>

                      {/* Unboxed metadata line with typographic dots */}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                        <span>{item.date}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-neutral-700">{item.paymentMethod}</span>
                        {item.category && <span className="sm:hidden">· {item.category}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount & Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-right">
                    <div>
                      <div
                        className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                          isSale ? 'text-emerald-700' : 'text-neutral-900'
                        }`}
                      >
                        {isSale ? '+' : '-'} {formatKES(item.amount)}
                      </div>
                      <span className="text-[10px] text-neutral-400 capitalize block">{item.type}</span>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditing(item)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-semibold text-neutral-900">
                Edit {editingItem.type === 'sale' ? 'Sale' : 'Expense'}
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-lg font-bold font-mono tabular-nums outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Pochi la Biashara">Pochi la Biashara</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Card">Card</option>
                  <option value="Bank">Bank</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {editingItem.type === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {editingItem.type === 'sale' ? 'Notes' : 'Description'}
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-1/2 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmItem(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-3">
            <h2 className="text-base font-semibold text-neutral-900">Delete Transaction?</h2>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete this {deleteConfirmItem.type} of{' '}
              <span className="font-bold font-mono">{formatKES(deleteConfirmItem.amount)}</span> (
              {deleteConfirmItem.description})? This calculation cannot be undone.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="w-1/2 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
              >
                Keep Record
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
