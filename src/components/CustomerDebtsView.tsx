import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Banknote,
  Smartphone,
  Share2,
  Trash2,
  Edit2,
  X,
  Check,
  Utensils,
  Receipt,
  Copy,
} from 'lucide-react';
import { CustomerDebt, Restaurant, PaymentMethod } from '../types';
import { formatKES } from '../utils/calculations';

interface CustomerDebtsViewProps {
  restaurant: Restaurant;
  debts: CustomerDebt[];
  onAddDebt: (debt: CustomerDebt) => void;
  onUpdateDebt: (debt: CustomerDebt) => void;
  onDeleteDebt: (debtId: string) => void;
  onRecordPayment: (
    debtId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string,
    autoRecordSale?: boolean
  ) => void;
}

export const CustomerDebtsView: React.FC<CustomerDebtsViewProps> = ({
  restaurant,
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onRecordPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'settled'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalDebt, setPaymentModalDebt] = useState<CustomerDebt | null>(null);
  const [editingDebt, setEditingDebt] = useState<CustomerDebt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Debt Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [debtDate, setDebtDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtNotes, setDebtNotes] = useState('');

  // Payment Form State
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Pochi la Biashara');
  const [autoRecordSale, setAutoRecordSale] = useState(true);
  const [payNotes, setPayNotes] = useState('');

  // Summary Metrics
  const summary = useMemo(() => {
    let totalPending = 0;
    let totalSettled = 0;
    let owingCount = 0;

    for (const d of debts) {
      if (d.status !== 'settled') {
        totalPending += d.remainingBalance;
        owingCount += 1;
      } else {
        totalSettled += d.totalAmount;
      }
    }

    return { totalPending, totalSettled, owingCount };
  }, [debts]);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = d.customerName.toLowerCase().includes(q);
        const itemMatch = d.itemsDescription.toLowerCase().includes(q);
        const phoneMatch = (d.phone || '').includes(q);
        const notesMatch = (d.notes || '').toLowerCase().includes(q);
        if (!nameMatch && !itemMatch && !phoneMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [debts, statusFilter, searchTerm]);

  // Handle Create Debt
  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmountStr);
    if (!customerName.trim() || !itemsDescription.trim() || isNaN(amount) || amount <= 0) {
      return;
    }

    const newDebt: CustomerDebt = {
      debtId: `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: restaurant.restaurantId,
      customerName: customerName.trim(),
      phone: customerPhone.trim() || undefined,
      itemsDescription: itemsDescription.trim(),
      totalAmount: amount,
      amountPaid: 0,
      remainingBalance: amount,
      status: 'unpaid',
      date: debtDate,
      notes: debtNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      payments: [],
    };

    onAddDebt(newDebt);

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setItemsDescription('');
    setTotalAmountStr('');
    setDebtNotes('');
    setIsAddModalOpen(false);
  };

  // Open Payment Settlement
  const openPaymentModal = (debt: CustomerDebt) => {
    setPaymentModalDebt(debt);
    setPayAmountStr(String(debt.remainingBalance));
    setPayMethod('Pochi la Biashara');
    setAutoRecordSale(true);
    setPayNotes('');
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebt) return;
    const amount = parseFloat(payAmountStr);
    if (isNaN(amount) || amount <= 0) return;

    onRecordPayment(
      paymentModalDebt.debtId,
      amount,
      payMethod,
      new Date().toISOString().split('T')[0],
      payNotes.trim() || undefined,
      autoRecordSale
    );

    setPaymentModalDebt(null);
  };

  // Copy Reminder Message for WhatsApp or SMS
  const handleCopyReminder = (debt: CustomerDebt) => {
    const text = `Habari ${debt.customerName}, this is a gentle reminder of your unpaid bill of ${formatKES(debt.remainingBalance)} for (${debt.itemsDescription}) at ${restaurant.restaurantName}. Kindly settle via Cash or Pochi la Biashara. Asante sana!`;
    navigator.clipboard.writeText(text);
    setCopiedId(debt.debtId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Kitabu cha Deni (Customer Credit)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track people who have eaten food or bought items and haven't paid yet.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Unpaid Food</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-800 block">
            Unpaid Meal Debt
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-rose-900 block mt-0.5">
            {formatKES(summary.totalPending)}
          </span>
          <span className="text-[10px] text-rose-700 font-medium">Pending collection</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block">
            People Owing
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-amber-900 block mt-0.5">
            {summary.owingCount}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">Active customer credit</span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
            Recovered / Settled
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-emerald-900 block mt-0.5">
            {formatKES(summary.totalSettled)}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">Cleared customer bills</span>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customer name, food eaten, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg shrink-0">
          {(['all', 'unpaid', 'partial', 'settled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === st ? 'bg-white text-neutral-900 font-semibold shadow-xs' : 'text-neutral-600'
              }`}
            >
              {st === 'all' ? 'All Records' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 py-12 px-4 text-center">
            <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700">No unpaid meal records found.</p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              When customers eat on credit, record their name and what they ate here.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl"
            >
              + Record Customer Credit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDebts.map((debt) => {
              const isSettled = debt.status === 'settled';
              const isPartial = debt.status === 'partial';

              return (
                <div
                  key={debt.debtId}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isSettled
                      ? 'border-neutral-200 opacity-75'
                      : isPartial
                      ? 'border-amber-200 ring-1 ring-amber-100'
                      : 'border-rose-200 ring-1 ring-rose-100'
                  }`}
                >
                  <div>
                    {/* Header: Customer Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-sm sm:text-base text-neutral-900 flex items-center gap-1.5">
                          <span>{debt.customerName}</span>
                          {debt.phone && (
                            <span className="text-xs font-normal text-neutral-400">· {debt.phone}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Date: {debt.date}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSettled
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {debt.status}
                      </span>
                    </div>

                    {/* What they ate / bought */}
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 mb-3 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-500 font-semibold mb-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-700" />
                        <span>Items Eaten / Bought:</span>
                      </div>
                      <div className="text-neutral-800 font-medium">{debt.itemsDescription}</div>
                      {debt.notes && (
                        <div className="text-[11px] text-neutral-500 mt-1 italic">
                          Note: "{debt.notes}"
                        </div>
                      )}
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-neutral-100 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                          Total Bill
                        </span>
                        <span className="font-bold font-mono text-neutral-900">
                          {formatKES(debt.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                          Paid
                        </span>
                        <span className="font-bold font-mono text-emerald-700">
                          {formatKES(debt.amountPaid)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                          Balance
                        </span>
                        <span
                          className={`font-bold font-mono ${
                            debt.remainingBalance > 0 ? 'text-rose-700' : 'text-neutral-400'
                          }`}
                        >
                          {formatKES(debt.remainingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Copy Reminder for WhatsApp / SMS */}
                      <button
                        onClick={() => handleCopyReminder(debt)}
                        className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Copy payment reminder message for WhatsApp / SMS"
                      >
                        {copiedId === debt.debtId ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteDebt(debt.debtId)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!isSettled ? (
                      <button
                        onClick={() => openPaymentModal(debt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Collect Payment</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled in Full
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Unpaid Food Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Record Unpaid Food / Credit</h2>
                <p className="text-xs text-neutral-500">Record customer name and what they ate</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Otieno Boda, Kamau Mechanic, Mama Stacy"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Phone Number (Optional for SMS / M-Pesa reminder)
                </label>
                <input
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  What did they eat or buy? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 1/2kg Nyama Choma, 2 Ugalis, 1 soda"
                  value={itemsDescription}
                  onChange={(e) => setItemsDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Bill Amount (KES) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="450"
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={debtDate}
                    onChange={(e) => setDebtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Notes / Promise Date</label>
                <input
                  type="text"
                  placeholder="e.g. Promised to pay Friday after salary or boda shift"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-xs"
                >
                  Save in Kitabu cha Deni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Settlement Modal */}
      {paymentModalDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setPaymentModalDebt(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Collect Payment</h2>
                <p className="text-xs text-neutral-500">
                  {paymentModalDebt.customerName} · Balance: {formatKES(paymentModalDebt.remainingBalance)}
                </p>
              </div>
              <button onClick={() => setPaymentModalDebt(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={paymentModalDebt.remainingBalance}
                  required
                  value={payAmountStr}
                  onChange={(e) => setPayAmountStr(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-lg font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Payment Method Selector: Cash and Pochi la Biashara */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Received Via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('Cash')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      payMethod === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-700" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('Pochi la Biashara')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      payMethod === 'Pochi la Biashara'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Pochi la Biashara</span>
                  </button>
                </div>
              </div>

              {/* Auto record as Sale */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRecordSale}
                    onChange={(e) => setAutoRecordSale(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-neutral-800">
                    Automatically record this payment as a Sale in today's revenue
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full at counter"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalDebt(null)}
                  className="w-1/2 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
