import React, { useState } from 'react';
import { Plus, UtensilsCrossed, Edit2, Trash2, HelpCircle, Check, X } from 'lucide-react';
import { MenuItem, Restaurant } from '../types';
import { formatKES, formatPercentage, computeMenuItemProfitability } from '../utils/calculations';
import { ASSETS } from '../assets';

interface MenuProfitabilityViewProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (menuItemId: string) => void;
}

export const MenuProfitabilityView: React.FC<MenuProfitabilityViewProps> = ({
  restaurant,
  menuItems,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [category, setCategory] = useState('Main Dishes');
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditingItem(null);
    setName('');
    setSellingPrice('');
    setEstimatedCost('');
    setCategory('Main Dishes');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setSellingPrice(String(item.sellingPrice));
    setEstimatedCost(String(item.estimatedCost));
    setCategory(item.category);
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(sellingPrice);
    const cost = parseFloat(estimatedCost);

    if (!name.trim() || isNaN(price) || price < 0 || isNaN(cost) || cost < 0) {
      return;
    }

    if (editingItem) {
      onUpdateMenuItem({
        ...editingItem,
        name: name.trim(),
        sellingPrice: price,
        estimatedCost: cost,
        category: category.trim(),
        notes: notes.trim() || undefined,
      });
    } else {
      const newItem: MenuItem = {
        menuItemId: `menu_${Date.now()}`,
        restaurantId: restaurant.restaurantId,
        name: name.trim(),
        sellingPrice: price,
        estimatedCost: cost,
        category: category.trim(),
        active: true,
        notes: notes.trim() || undefined,
      };
      onAddMenuItem(newItem);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 pt-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Menu Item Profitability
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Identify which dishes contribute the strongest gross margin to your restaurant.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Menu Dish</span>
        </button>
      </div>

      {/* Feature Spotlight Card with Authentic Image */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-center">
        <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
          <img
            src={ASSETS.nyamaChomaDish}
            alt="Kenyan Signature Dish"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Recipe Economics
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">Mama Njeri Signature Nyama</span>
          </div>
          <h2 className="text-base font-bold text-neutral-900">
            Keep Dish Margins Healthy & Account for Spices
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
            Gross margin is based on your estimated ingredient costs (meat, cooking oil, greens, and charcoal).
            Always review portion sizes when raw meat and vegetable wholesale prices fluctuate at Marikiti.
          </p>
        </div>
      </div>

      {/* Menu Items Table / Grid */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-neutral-900">Configured Menu Dishes</h2>
          </div>
          <span className="text-xs text-neutral-500 font-mono font-medium">
            {menuItems.length} dishes tracked
          </span>
        </div>

        {menuItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <p className="font-semibold text-neutral-700 mb-1">No menu items configured yet.</p>
            <p className="text-neutral-400 mb-3">Add your first dish to track selling price vs ingredient cost.</p>
            <button
              onClick={openAdd}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              + Add First Dish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Dish Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Est. Cost</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Gross Margin</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {menuItems.map((item) => {
                  const { grossProfit, grossMargin } = computeMenuItemProfitability(
                    item.sellingPrice,
                    item.estimatedCost
                  );
                  return (
                    <tr key={item.menuItemId} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{item.name}</div>
                        {item.notes && <div className="text-[11px] text-neutral-400">{item.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{item.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-900">
                        {formatKES(item.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">
                        {formatKES(item.estimatedCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        {formatKES(grossProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            grossMargin >= 50
                              ? 'bg-emerald-50 text-emerald-800'
                              : grossMargin >= 30
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {formatPercentage(grossMargin)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                            title="Edit dish"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMenuItem(item.menuItemId)}
                            className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-semibold text-neutral-900">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nyama Choma 1kg, Chicken & Chips"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Selling Price (KES)</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="450"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Est. Ingredient Cost (KES)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="210"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Grill & Nyama, Main Dishes, Beverages"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Notes / Accompaniments</label>
                <input
                  type="text"
                  placeholder="e.g. Served with ugali & kachumbari"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
