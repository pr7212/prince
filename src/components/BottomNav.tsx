import React from 'react';
import { LayoutDashboard, Receipt, Plus, BookOpen, Settings } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'transactions' | 'debts' | 'stock' | 'reports' | 'menu' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  unpaidDebtsCount?: number;
  lowStockCount?: number;
  onTabChange: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  unpaidDebtsCount = 0,
  lowStockCount = 0,
  onTabChange,
  onOpenQuickAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 safe-area-bottom shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-2">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          aria-label="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Dashboard</span>
        </button>

        {/* Tab 2: Transactions / Ledger */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'transactions' ? 'text-emerald-700 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          aria-label="Transactions"
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Ledger</span>
        </button>

        {/* Tab 3: Prominent Center + Add Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 -mt-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/25 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            aria-label="Record Sale or Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Kitabu cha Deni / Customer Debts */}
        <button
          onClick={() => onTabChange('debts')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'debts' ? 'text-emerald-700 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          aria-label="Kitabu cha Deni"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Deni Book</span>
          {unpaidDebtsCount > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unpaidDebtsCount}
            </span>
          )}
        </button>

        {/* Tab 5: More (Reports, Stock, Menu & Settings) */}
        <button
          onClick={() => onTabChange('reports')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'reports' || activeTab === 'stock' || activeTab === 'menu' || activeTab === 'settings'
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
          aria-label="Reports, Stock and Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">More</span>
          {lowStockCount > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

