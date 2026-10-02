import React, { useState } from 'react';
import { X, Check, ArrowDownLeft, ArrowUpRight, Banknote, Smartphone } from 'lucide-react';
import { PaymentMethod, ExpenseCategory, Sale, Expense } from '../types';
import { isFoodExpenseCategory } from '../utils/calculations';

interface QuickAddModalProps {
  restaurantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSale: (sale: Sale) => void;
  onSaveExpense: (expense: Expense) => void;
  onNavigateToDebts?: () => void;
  initialType?: 'sale' | 'expense';
}

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Meat',
  'Vegetables',
  'Cooking oil',
  'Food ingredients',
  'Drinks',
  'Gas',
  'Electricity',
  'Water',
  'Rent',
  'Salaries',
  'Transport',
  'Delivery',
  'Packaging',
  'Maintenance',
  'Marketing',
  'Other',
];

const PRIMARY_PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Pochi la Biashara'];
const SECONDARY_PAYMENT_METHODS: PaymentMethod[] = ['M-Pesa', 'Card', 'Bank', 'Other'];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  restaurantId,
  isOpen,
  onClose,
  onSaveSale,
  onSaveExpense,
  onNavigateToDebts,
  initialType = 'sale',
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'sale' | 'expense'>(initialType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pochi la Biashara');
  const [category, setCategory] = useState<ExpenseCategory | string>('Meat');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick increment chips for speed
  const quickChips = [500, 1000, 2000, 5000];

  const handleAddChip = (addVal: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + addVal));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = parseFloat(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter an amount greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const uniqueId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (type === 'sale') {
        const newSale: Sale = {
          saleId: uniqueId,
          restaurantId,
          amount,
          paymentMethod,
          date,
          notes: description.trim() || undefined,
          createdAt: nowIso,
        };
        onSaveSale(newSale);
      } else {
        const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
        const newExpense: Expense = {
          expenseId: uniqueId,
          restaurantId,
          category: finalCategory,
          amount,
          description: description.trim() || `${finalCategory} expense`,
          date,
          paymentMethod,
          isFoodExpense: isFoodExpenseCategory(finalCategory),
          createdAt: nowIso,
        };
        onSaveExpense(newExpense);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'We could not save that transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
          <h2 className="text-base font-semibold text-neutral-900">Record Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Segmented Selector: Sale vs Expense */}
          <div>
            <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setType('sale')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  type === 'sale'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Record Sale (Income)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>Record Expense (Cost)</span>
              </button>
            </div>

            {onNavigateToDebts && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDebts();
                  }}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>Did someone eat food and not pay? Record in Kitabu cha Deni →</span>
                </button>
              </div>
            )}
          </div>

          {/* Amount Input with Currency prefix */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Amount (KES) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-semibold text-neutral-400">
                KSh
              </div>
              <input
                type="number"
                step="any"
                min="1"
                required
                autoFocus
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-13 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl font-bold font-mono tabular-nums text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Fast Quick-add Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-neutral-500 mr-1">Quick:</span>
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddChip(chip)}
                  className="px-2 py-1 text-[11px] font-mono font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors"
                >
                  +{chip.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Category (if Expense) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <optgroup label="Food & Ingredients (Cost of Goods)">
                  <option value="Meat">Meat & Poultry (Butcher)</option>
                  <option value="Vegetables">Vegetables & Fresh Greens (Marikiti)</option>
                  <option value="Cooking oil">Cooking Oil & Fats</option>
                  <option value="Food ingredients">Grains, Flour, Spices & Dry Goods</option>
                  <option value="Drinks">Drinks, Soda & Bottled Water</option>
                </optgroup>
                <optgroup label="Operating & Utilities">
                  <option value="Gas">Cooking Gas (LPG Cylinders)</option>
                  <option value="Electricity">Electricity (KPLC Tokens)</option>
                  <option value="Water">Water (Council / Bowser)</option>
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Staff Wages & Casual Pay</option>
                  <option value="Transport">Transport / Fare / Boda / Tuk-tuk</option>
                  <option value="Delivery">Delivery & Courier</option>
                  <option value="Packaging">Takeaway Foil & Packaging</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Marketing">Signage & Marketing</option>
                  <option value="Other">Other Category...</option>
                </optgroup>
              </select>

              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          )}

          {/* Payment Method - Cash and Pochi la Biashara prominently */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-neutral-400">Cash or Pochi la Biashara</span>
            </div>

            {/* Primary Payment Methods: Large thumb touch targets */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all min-h-[46px] ${
                  paymentMethod === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-700" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Pochi la Biashara')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all min-h-[46px] ${
                  paymentMethod === 'Pochi la Biashara'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Pochi la Biashara</span>
              </button>
            </div>

            {/* Other secondary payment options */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-medium text-neutral-400">Other:</span>
              {SECONDARY_PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1 px-2.5 text-[11px] font-medium rounded-lg border transition-colors ${
                    paymentMethod === pm
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {type === 'sale' ? 'Notes (Optional)' : 'Description (Optional)'}
            </label>
            <input
              type="text"
              placeholder={
                type === 'sale'
                  ? 'e.g. Lunch rush, Catering, Walk-ins'
                  : 'e.g. 15kg Goat meat, 20L cooking oil, 13kg gas cylinder'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`w-2/3 py-2.5 px-4 text-xs font-semibold text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                type === 'sale'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/20'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? 'Saving...' : type === 'sale' ? 'Save Sale' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
