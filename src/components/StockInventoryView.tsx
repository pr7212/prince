import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Check,
  Edit2,
  Trash2,
  X,
  History,
  Banknote,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StockItem, StockMovement, Restaurant, PaymentMethod, StockCategory, StockUnit } from '../types';
import { formatKES } from '../utils/calculations';

interface StockInventoryViewProps {
  restaurant: Restaurant;
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  onAddStockItem: (item: StockItem) => void;
  onUpdateStockItem: (item: StockItem) => void;
  onDeleteStockItem: (itemId: string) => void;
  onRecordStockMovement: (movement: StockMovement, autoRecordExpense?: boolean) => void;
}

const STOCK_CATEGORIES: StockCategory[] = [
  'Meat & Poultry',
  'Vegetables & Produce',
  'Oils & Fats',
  'Grains & Flours',
  'Dairy & Eggs',
  'Beverages & Drinks',
  'Gas & Fuel',
  'Packaging & Disposables',
  'Other',
];

const STOCK_UNITS: StockUnit[] = ['kg', 'g', 'litres', 'bags', 'crates', 'packets', 'cylinders', 'pieces'];

export const StockInventoryView: React.FC<StockInventoryViewProps> = ({
  restaurant,
  stockItems,
  stockMovements,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  onRecordStockMovement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Modals
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Quick Action Item selection
  const [selectedItemForAction, setSelectedItemForAction] = useState<StockItem | null>(null);

  // Form State: Stock In (Delivery / Purchase)
  const [inItemId, setInItemId] = useState('');
  const [inQtyStr, setInQtyStr] = useState('');
  const [inUnitCostStr, setInUnitCostStr] = useState('');
  const [inReason, setInReason] = useState('Market delivery purchase');
  const [inPaymentMethod, setInPaymentMethod] = useState<PaymentMethod>('Pochi la Biashara');
  const [inAutoExpense, setInAutoExpense] = useState(true);
  const [inDate, setInDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State: Stock Out (Kitchen Usage / Spoilage)
  const [outItemId, setOutItemId] = useState('');
  const [outQtyStr, setOutQtyStr] = useState('');
  const [outReason, setOutReason] = useState('Kitchen daily prep & cooking');
  const [outDate, setOutDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State: New Item
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<StockCategory>('Meat & Poultry');
  const [newStockStr, setNewStockStr] = useState('');
  const [newUnit, setNewUnit] = useState<StockUnit>('kg');
  const [newUnitCostStr, setNewUnitCostStr] = useState('');
  const [newMinThresholdStr, setNewMinThresholdStr] = useState('');
  const [newStorageLocation, setNewStorageLocation] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  // Summary Metrics
  const summary = useMemo(() => {
    let totalValue = 0;
    let lowStockCount = 0;

    for (const item of stockItems) {
      totalValue += item.currentStock * item.unitCost;
      if (item.currentStock <= item.minThreshold) {
        lowStockCount += 1;
      }
    }

    return {
      totalItems: stockItems.length,
      totalValue: Math.round(totalValue),
      lowStockCount,
    };
  }, [stockItems]);

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      if (filterLowStockOnly && item.currentStock > item.minThreshold) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchLoc = (item.storageLocation || '').toLowerCase().includes(q);
        const matchSup = (item.supplier || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchLoc && !matchSup) return false;
      }
      return true;
    });
  }, [stockItems, filterLowStockOnly, selectedCategory, searchTerm]);

  // Handle Quick Open Stock In
  const handleOpenStockIn = (item?: StockItem) => {
    const target = item || stockItems[0];
    if (target) {
      setInItemId(target.itemId);
      setInUnitCostStr(String(target.unitCost));
    }
    setInQtyStr('');
    setInReason('Market delivery purchase');
    setInPaymentMethod('Pochi la Biashara');
    setInAutoExpense(true);
    setIsStockInModalOpen(true);
  };

  // Handle Quick Open Stock Out
  const handleOpenStockOut = (item?: StockItem) => {
    const target = item || stockItems[0];
    if (target) {
      setOutItemId(target.itemId);
    }
    setOutQtyStr('');
    setOutReason('Kitchen daily prep & cooking');
    setIsStockOutModalOpen(true);
  };

  // Submit Stock In
  const handleSubmitStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(inQtyStr);
    const unitCost = inUnitCostStr ? parseFloat(inUnitCostStr) : undefined;
    if (!inItemId || isNaN(qty) || qty <= 0) return;

    const totalCost = unitCost ? Math.round(qty * unitCost) : undefined;

    const movement: StockMovement = {
      movementId: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId: inItemId,
      restaurantId: restaurant.restaurantId,
      type: 'in',
      quantity: qty,
      unitCost,
      totalCost,
      reason: inReason.trim() || 'Stock Delivery',
      paymentMethod: inPaymentMethod,
      date: inDate,
      recordedAt: new Date().toISOString(),
      recordedBy: 'Kitchen Staff',
    };

    onRecordStockMovement(movement, inAutoExpense);
    setIsStockInModalOpen(false);
  };

  // Submit Stock Out
  const handleSubmitStockOut = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(outQtyStr);
    if (!outItemId || isNaN(qty) || qty <= 0) return;

    const movement: StockMovement = {
      movementId: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId: outItemId,
      restaurantId: restaurant.restaurantId,
      type: 'out',
      quantity: qty,
      reason: outReason.trim() || 'Kitchen Usage',
      date: outDate,
      recordedAt: new Date().toISOString(),
      recordedBy: 'Kitchen Staff',
    };

    onRecordStockMovement(movement, false);
    setIsStockOutModalOpen(false);
  };

  // Submit New Stock Item
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = parseFloat(newStockStr) || 0;
    const unitCost = parseFloat(newUnitCostStr) || 0;
    const minThreshold = parseFloat(newMinThresholdStr) || 0;

    if (!newName.trim()) return;

    const item: StockItem = {
      itemId: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: restaurant.restaurantId,
      name: newName.trim(),
      category: newCategory,
      currentStock: stock,
      unit: newUnit,
      unitCost,
      minThreshold,
      storageLocation: newStorageLocation.trim() || undefined,
      supplier: newSupplier.trim() || undefined,
      lastRestockedDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    onAddStockItem(item);

    // Reset
    setNewName('');
    setNewStockStr('');
    setNewUnitCostStr('');
    setNewMinThresholdStr('');
    setNewStorageLocation('');
    setNewSupplier('');
    setIsNewItemModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Stock & Inventory Management
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Record kitchen stock deliveries, track daily ingredient usage, and monitor par levels.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenStockIn()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all min-h-[44px]"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>+ Restock (Stock In)</span>
          </button>

          <button
            onClick={() => handleOpenStockOut()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-xs shadow-xs active:scale-95 transition-all min-h-[44px]"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Log Usage (Stock Out)</span>
          </button>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-semibold text-xs active:scale-95 transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Total Stock Value
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 block mt-0.5">
            {formatKES(summary.totalValue)}
          </span>
          <span className="text-[10px] text-neutral-400">Inventory on shelves</span>
        </div>

        <div className="p-3.5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Items Tracked
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 block mt-0.5">
            {summary.totalItems}
          </span>
          <span className="text-[10px] text-neutral-400">Food, gas & supplies</span>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            summary.lowStockCount > 0
              ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              summary.lowStockCount > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            Low Stock Alerts
          </span>
          <span
            className={`text-lg sm:text-2xl font-bold font-mono tabular-nums block mt-0.5 ${
              summary.lowStockCount > 0 ? 'text-rose-900' : 'text-emerald-900'
            }`}
          >
            {summary.lowStockCount}
          </span>
          <span className="text-[10px] font-medium text-rose-700">
            {summary.lowStockCount > 0 ? 'Needs reorder (Tap to filter)' : 'All par levels healthy'}
          </span>
        </div>
      </div>

      {/* Tabs: Active Inventory vs Movements Audit Log */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'inventory' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
            }`}
          >
            Kitchen Stock List ({stockItems.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'movements' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Log ({stockMovements.length})</span>
          </button>
        </div>

        {summary.lowStockCount > 0 && activeTab === 'inventory' && (
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              filterLowStockOnly
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {filterLowStockOnly ? 'Show All Items' : `⚠️ Show Low Stock Only (${summary.lowStockCount})`}
          </button>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-3 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search stock item, location, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none font-medium text-neutral-700 shrink-0"
              >
                <option value="all">All Categories</option>
                {STOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Items Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 py-12 px-4 text-center">
              <Boxes className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700">No stock items match your criteria.</p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                Record new deliveries or add inventory items to track kitchen supplies.
              </p>
              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl"
              >
                + Add New Stock Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;
                const totalItemVal = Math.round(item.currentStock * item.unitCost);
                const stockHealthPct = item.minThreshold > 0
                  ? Math.min(100, Math.round((item.currentStock / (item.minThreshold * 2)) * 100))
                  : 100;

                return (
                  <div
                    key={item.itemId}
                    className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                      isLow ? 'border-rose-300 ring-1 ring-rose-200/60' : 'border-neutral-200'
                    }`}
                  >
                    <div>
                      {/* Top Row: Category & Low Alert */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>

                        {isLow ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Item Name */}
                      <h3 className="font-bold text-sm text-neutral-900">{item.name}</h3>

                      {/* Location & Supplier */}
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        {item.storageLocation && <span>📍 {item.storageLocation}</span>}
                        {item.supplier && <span>🚚 {item.supplier}</span>}
                      </div>

                      {/* Stock Figures */}
                      <div className="mt-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-neutral-500">Current Stock</span>
                          <div className="text-right">
                            <span
                              className={`text-xl font-bold font-mono tabular-nums ${
                                isLow ? 'text-rose-700' : 'text-neutral-900'
                              }`}
                            >
                              {item.currentStock}
                            </span>
                            <span className="text-xs font-semibold text-neutral-600 ml-1">{item.unit}</span>
                          </div>
                        </div>

                        {/* Par Level Progress Bar */}
                        <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isLow ? 'bg-rose-500' : stockHealthPct < 60 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.max(5, stockHealthPct)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Min Par: {item.minThreshold} {item.unit}</span>
                          <span className="font-mono text-neutral-600 font-medium">
                            {formatKES(item.unitCost)} / {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs px-1">
                        <span className="text-neutral-400">Est. Total Value:</span>
                        <span className="font-bold font-mono text-neutral-900">{formatKES(totalItemVal)}</span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenStockIn(item)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                          title="Record Stock In / Delivery"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>

                        <button
                          onClick={() => handleOpenStockOut(item)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Record Kitchen Usage / Out"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Use</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDeleteStockItem(item.itemId)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Stock Item"
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
      ) : (
        /* Movements Audit Log Tab */
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900">Stock Movements History</h2>
            <span className="text-xs text-neutral-400">{stockMovements.length} log entries</span>
          </div>

          {stockMovements.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No stock movements logged yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stockMovements.map((mov) => {
                const target = stockItems.find((s) => s.itemId === mov.itemId);
                const isIn = mov.type === 'in';
                const isOut = mov.type === 'out';

                return (
                  <div key={mov.movementId} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900">
                          {target ? target.name : 'Unknown Item'}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {mov.reason} · {mov.date} {mov.recordedBy && `· by ${mov.recordedBy}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold font-mono text-sm tabular-nums ${
                          isIn ? 'text-emerald-700' : 'text-neutral-900'
                        }`}
                      >
                        {isIn ? '+' : '-'}{mov.quantity} {target ? target.unit : ''}
                      </div>
                      {mov.totalCost && (
                        <div className="text-[11px] font-mono text-neutral-500">
                          {formatKES(mov.totalCost)} {mov.paymentMethod && `(${mov.paymentMethod})`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Restock / Stock In (Delivery / Purchase) */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsStockInModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Record Stock In (Delivery / Purchase)</h2>
                <p className="text-xs text-neutral-500">Add fresh supplies to your current stock</p>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Stock Item <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={inItemId}
                  onChange={(e) => {
                    setInItemId(e.target.value);
                    const it = stockItems.find((s) => s.itemId === e.target.value);
                    if (it) setInUnitCostStr(String(it.unitCost));
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                >
                  {stockItems.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.name} ({item.currentStock} {item.unit} currently)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Quantity Delivered <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 15"
                    value={inQtyStr}
                    onChange={(e) => setInQtyStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Unit Cost (KES per unit)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 850"
                    value={inUnitCostStr}
                    onChange={(e) => setInUnitCostStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              {/* Calculated total cost preview */}
              {inQtyStr && inUnitCostStr && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Total Purchase Amount:</span>
                  <span className="font-bold font-mono text-emerald-950 text-sm">
                    {formatKES(parseFloat(inQtyStr) * parseFloat(inUnitCostStr))}
                  </span>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Supplier Paid Via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInPaymentMethod('Cash')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      inPaymentMethod === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-700" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInPaymentMethod('Pochi la Biashara')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      inPaymentMethod === 'Pochi la Biashara'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Pochi la Biashara</span>
                  </button>
                </div>
              </div>

              {/* Auto Record as Expense */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inAutoExpense}
                    onChange={(e) => setInAutoExpense(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-neutral-800">
                    Also record this purchase as an Expense in the financial ledger
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Reason / Supplier Note</label>
                <input
                  type="text"
                  placeholder="e.g. City Market morning butcher delivery"
                  value={inReason}
                  onChange={(e) => setInReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={inDate}
                  onChange={(e) => setInDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="w-1/2 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-xs"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Kitchen Usage / Stock Out */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsStockOutModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Log Kitchen Usage (Stock Out)</h2>
                <p className="text-xs text-neutral-500">Deduct items used for daily cooking or prep</p>
              </div>
              <button onClick={() => setIsStockOutModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockOut} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Stock Item <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={outItemId}
                  onChange={(e) => setOutItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                >
                  {stockItems.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.name} (Available: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Quantity Used <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  placeholder="e.g. 5"
                  value={outQtyStr}
                  onChange={(e) => setOutQtyStr(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Purpose / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch rush beef stew & wet fry prep"
                  value={outReason}
                  onChange={(e) => setOutReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Date</label>
                <input
                  type="date"
                  value={outDate}
                  onChange={(e) => setOutDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="w-1/2 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl font-semibold shadow-xs"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Stock Item */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsNewItemModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Add New Inventory Item</h2>
                <p className="text-xs text-neutral-500">Track an ingredient or kitchen supply</p>
              </div>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goat Meat, Cooking Oil, Brown Ugali Flour"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as StockCategory)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  >
                    {STOCK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit of Measure</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as StockUnit)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  >
                    {STOCK_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="10"
                    value={newStockStr}
                    onChange={(e) => setNewStockStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit Cost (KES)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="650"
                    value={newUnitCostStr}
                    onChange={(e) => setNewUnitCostStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="5"
                    value={newMinThresholdStr}
                    onChange={(e) => setNewMinThresholdStr(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Freezer 1, Dry Pantry"
                    value={newStorageLocation}
                    onChange={(e) => setNewStorageLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Supplier (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. City Market Butcher 14"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="w-1/2 py-2.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-xs"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
