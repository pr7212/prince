import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  RefreshCw,
  Trash2,
  Check,
  Shield,
  UtensilsCrossed,
  Sparkles,
  BookOpen,
  Boxes,
} from 'lucide-react';
import { Restaurant, User } from '../types';

interface SettingsViewProps {
  restaurant: Restaurant;
  user: User | null;
  onUpdateRestaurant: (restaurant: Restaurant) => void;
  onOpenNewRestaurant: () => void;
  onNavigateToMenu: () => void;
  onNavigateToDebts?: () => void;
  onNavigateToStock?: () => void;
  onReloadDemo: () => void;
  onClearData: () => void;
  onOpenAdmin: () => void;
  onOpenAI: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  restaurant,
  user,
  onUpdateRestaurant,
  onOpenNewRestaurant,
  onNavigateToMenu,
  onNavigateToDebts,
  onNavigateToStock,
  onReloadDemo,
  onClearData,
  onOpenAdmin,
  onOpenAI,
}) => {
  const [name, setName] = useState(restaurant.restaurantName);
  const [location, setLocation] = useState(restaurant.location);
  const [phone, setPhone] = useState(restaurant.phone);
  const [currency, setCurrency] = useState(restaurant.currency);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRestaurant({
      ...restaurant,
      restaurantName: name.trim(),
      location: location.trim(),
      phone: phone.trim(),
      currency,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 pt-4 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          Restaurant Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage your restaurant profile, subscription tier, and data preferences.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-neutral-900">Restaurant Details</h2>
          </div>
          {savedNotice && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Base Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
            >
              <option value="KES">KES (Kenyan Shilling - KSh)</option>
              <option value="USD">USD ($)</option>
              <option value="UGX">UGX (Ugandan Shilling)</option>
              <option value="TZS">TZS (Tanzanian Shilling)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenNewRestaurant}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl"
            >
              + Create Another Branch / Restaurant
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Update Restaurant
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Tier Info (Section 31) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-neutral-900">Subscription Plan</h2>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
            {restaurant.subscriptionPlan} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="font-bold text-neutral-900">Free Starter</div>
            <div className="text-neutral-500 mt-1">Up to 50 monthly transactions & basic P&L</div>
          </div>
          <div className="p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/50">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>Pro (Active)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Current</span>
            </div>
            <div className="text-neutral-600 mt-1">Unlimited sales & expenses, AI Insights, CSV export</div>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="font-bold text-neutral-900">Business Multi-Branch</div>
            <div className="text-neutral-500 mt-1">Multiple outlets, aggregated reports, staff permissions</div>
          </div>
        </div>
      </div>

      {/* Shortcuts & Data Controls */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Quick Navigation & Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors text-left flex items-center gap-3"
            >
              <Boxes className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="font-semibold text-xs text-neutral-900">Stock & Inventory</div>
                <div className="text-[11px] text-neutral-500">Record stock, deliveries & par levels</div>
              </div>
            </button>
          )}

          {onNavigateToDebts && (
            <button
              onClick={onNavigateToDebts}
              className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors text-left flex items-center gap-3"
            >
              <BookOpen className="w-5 h-5 text-rose-700 shrink-0" />
              <div>
                <div className="font-semibold text-xs text-rose-950">Kitabu cha Deni</div>
                <div className="text-[11px] text-rose-700">Track customer meal debts</div>
              </div>
            </button>
          )}

          <button
            onClick={onNavigateToMenu}
            className="p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-left flex items-center gap-3"
          >
            <UtensilsCrossed className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-neutral-900">Menu Dish Costing</div>
              <div className="text-[11px] text-neutral-500">Track dish selling price vs cost</div>
            </div>
          </button>

          <button
            onClick={onOpenAI}
            className="p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-left flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-neutral-900">Financial AI</div>
              <div className="text-[11px] text-neutral-500">Ask questions about your ledger</div>
            </div>
          </button>

          <button
            onClick={onOpenAdmin}
            className="p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-left flex items-center gap-3"
          >
            <Shield className="w-5 h-5 text-neutral-700 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-neutral-900">System & Test Health</div>
              <div className="text-[11px] text-neutral-500">View test results & platform metrics</div>
            </div>
          </button>
        </div>

        {/* Reset / Demo Data section */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={onReloadDemo}
            className="flex items-center gap-1.5 px-3 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Mama Njeri Demo Data</span>
          </button>

          <button
            onClick={onClearData}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Local Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
