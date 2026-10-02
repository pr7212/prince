import React, { useState, useEffect, useCallback } from 'react';
import {
  initializeStorage,
  getCurrentUser,
  setCurrentUser,
  getActiveRestaurant,
  getRestaurants,
  setActiveRestaurantId,
  addRestaurant,
  updateRestaurant,
  getSales,
  addSale,
  updateSale,
  deleteSale,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  recordDebtPayment,
  getStockItems,
  addStockItem,
  updateStockItem,
  deleteStockItem,
  getStockMovements,
  recordStockMovement,
  loadSampleDemoData,
  clearAllData,
  isDemoModeActive,
  setDemoModeActive,
} from './services/storage';
import { User, Restaurant, Sale, Expense, MenuItem, CustomerDebt, PaymentMethod, StockItem, StockMovement } from './types';
import { TopBar } from './components/TopBar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CustomerDebtsView } from './components/CustomerDebtsView';
import { StockInventoryView } from './components/StockInventoryView';
import { ReportsView } from './components/ReportsView';
import { MenuProfitabilityView } from './components/MenuProfitabilityView';
import { SettingsView } from './components/SettingsView';
import { QuickAddModal } from './components/QuickAddModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  // App initialization
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setUserState] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Transactions & Menu state
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'sale' | 'expense'>('sale');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Reload state helper
  const reloadData = useCallback(() => {
    const user = getCurrentUser();
    const activeRest = getActiveRestaurant();
    const rests = getRestaurants();
    const demoActive = isDemoModeActive();

    setUserState(user);
    setRestaurant(activeRest);
    setAllRestaurants(rests);
    setIsDemoMode(demoActive);

    if (activeRest) {
      setSales(getSales(activeRest.restaurantId));
      setExpenses(getExpenses(activeRest.restaurantId));
      setMenuItems(getMenuItems(activeRest.restaurantId));
      setDebts(getDebts(activeRest.restaurantId));
      setStockItems(getStockItems(activeRest.restaurantId));
      setStockMovements(getStockMovements(activeRest.restaurantId));
    }
  }, []);

  useEffect(() => {
    initializeStorage();
    reloadData();
    setInitialized(true);
  }, [reloadData]);

  // Handler: Select Restaurant
  const handleSelectRestaurant = (restaurantId: string) => {
    setActiveRestaurantId(restaurantId);
    reloadData();
  };

  // Handler: Add Sale
  const handleSaveSale = (newSale: Sale) => {
    addSale(newSale);
    if (restaurant) {
      setSales(getSales(restaurant.restaurantId));
    }
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    updateSale(updatedSale);
    if (restaurant) {
      setSales(getSales(restaurant.restaurantId));
    }
  };

  const handleDeleteSale = (saleId: string) => {
    if (restaurant) {
      deleteSale(saleId, restaurant.restaurantId);
      setSales(getSales(restaurant.restaurantId));
    }
  };

  // Handler: Add Expense
  const handleSaveExpense = (newExpense: Expense) => {
    addExpense(newExpense);
    if (restaurant) {
      setExpenses(getExpenses(restaurant.restaurantId));
    }
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    updateExpense(updatedExpense);
    if (restaurant) {
      setExpenses(getExpenses(restaurant.restaurantId));
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (restaurant) {
      deleteExpense(expenseId, restaurant.restaurantId);
      setExpenses(getExpenses(restaurant.restaurantId));
    }
  };

  // Handler: Customer Debts ("Kitabu cha Deni")
  const handleAddDebt = (debt: CustomerDebt) => {
    addDebt(debt);
    if (restaurant) {
      setDebts(getDebts(restaurant.restaurantId));
    }
  };

  const handleUpdateDebt = (debt: CustomerDebt) => {
    updateDebt(debt);
    if (restaurant) {
      setDebts(getDebts(restaurant.restaurantId));
    }
  };

  const handleDeleteDebt = (debtId: string) => {
    if (restaurant) {
      deleteDebt(debtId, restaurant.restaurantId);
      setDebts(getDebts(restaurant.restaurantId));
    }
  };

  const handleRecordDebtPayment = (
    debtId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string,
    autoRecordSale?: boolean
  ) => {
    if (restaurant) {
      recordDebtPayment(debtId, amount, paymentMethod, date, restaurant.restaurantId, notes, autoRecordSale);
      setDebts(getDebts(restaurant.restaurantId));
      setSales(getSales(restaurant.restaurantId));
    }
  };

  // Handler: Stock & Inventory
  const handleAddStockItem = (item: StockItem) => {
    addStockItem(item);
    if (restaurant) {
      setStockItems(getStockItems(restaurant.restaurantId));
    }
  };

  const handleUpdateStockItem = (item: StockItem) => {
    updateStockItem(item);
    if (restaurant) {
      setStockItems(getStockItems(restaurant.restaurantId));
    }
  };

  const handleDeleteStockItem = (itemId: string) => {
    if (restaurant) {
      deleteStockItem(itemId, restaurant.restaurantId);
      setStockItems(getStockItems(restaurant.restaurantId));
    }
  };

  const handleRecordStockMovement = (movement: StockMovement, autoRecordExpense: boolean = false) => {
    if (restaurant) {
      const { expenseCreated } = recordStockMovement(movement, autoRecordExpense);
      setStockItems(getStockItems(restaurant.restaurantId));
      setStockMovements(getStockMovements(restaurant.restaurantId));
      if (expenseCreated) {
        setExpenses(getExpenses(restaurant.restaurantId));
      }
    }
  };

  // Handler: Menu Items
  const handleAddMenuItem = (item: MenuItem) => {
    addMenuItem(item);
    if (restaurant) {
      setMenuItems(getMenuItems(restaurant.restaurantId));
    }
  };

  const handleUpdateMenuItem = (item: MenuItem) => {
    updateMenuItem(item);
    if (restaurant) {
      setMenuItems(getMenuItems(restaurant.restaurantId));
    }
  };

  const handleDeleteMenuItem = (menuItemId: string) => {
    if (restaurant) {
      deleteMenuItem(menuItemId, restaurant.restaurantId);
      setMenuItems(getMenuItems(restaurant.restaurantId));
    }
  };

  // Handler: Update Restaurant
  const handleUpdateRestaurant = (updated: Restaurant) => {
    updateRestaurant(updated);
    reloadData();
  };

  // Handler: Complete Onboarding / Create New Restaurant
  const handleCompleteOnboarding = (newRest: Restaurant, loadDemo: boolean) => {
    addRestaurant(newRest);
    if (loadDemo) {
      loadSampleDemoData();
    } else {
      setDemoModeActive(false);
    }
    reloadData();
  };

  // Handler: Toggle Demo Mode / Fresh
  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      setDemoModeActive(false);
      // create blank store for user
      const blankRest: Restaurant = {
        restaurantId: `rest_${Date.now()}`,
        ownerId: currentUser?.userId || 'usr_01',
        restaurantName: 'My Live Restaurant',
        location: 'Nairobi, Kenya',
        phone: '+254 700 000 000',
        currency: 'KES',
        restaurantType: 'Eatery / Small Hotel',
        subscriptionPlan: 'pro',
        createdAt: new Date().toISOString(),
      };
      addRestaurant(blankRest);
      reloadData();
    } else {
      loadSampleDemoData();
      reloadData();
    }
  };

  // Open Quick Add Modal
  const handleOpenQuickAdd = (type: 'sale' | 'expense' = 'sale') => {
    setQuickAddType(type);
    setQuickAddOpen(true);
  };

  if (!initialized || !restaurant) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg animate-pulse">
            P
          </div>
          <div className="text-xs font-semibold text-neutral-500">Loading ProfitPilot...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 font-sans selection:bg-emerald-500/20">
      {/* Top Bar Contract */}
      <TopBar
        restaurant={restaurant}
        user={currentUser}
        allRestaurants={allRestaurants}
        isDemoMode={isDemoMode}
        onSelectRestaurant={handleSelectRestaurant}
        onOpenNewRestaurant={() => setOnboardingOpen(true)}
        onOpenAI={() => setAiModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            restaurant={restaurant}
            sales={sales}
            expenses={expenses}
            debts={debts}
            stockItems={stockItems}
            onOpenQuickAdd={handleOpenQuickAdd}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToReports={() => setActiveTab('reports')}
            onNavigateToDebts={() => setActiveTab('debts')}
            onNavigateToStock={() => setActiveTab('stock')}
            onOpenAI={() => setAiModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            restaurantId={restaurant.restaurantId}
            sales={sales}
            expenses={expenses}
            onOpenQuickAdd={handleOpenQuickAdd}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'debts' && (
          <CustomerDebtsView
            restaurant={restaurant}
            debts={debts}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            onRecordPayment={handleRecordDebtPayment}
          />
        )}

        {activeTab === 'stock' && (
          <StockInventoryView
            restaurant={restaurant}
            stockItems={stockItems}
            stockMovements={stockMovements}
            onAddStockItem={handleAddStockItem}
            onUpdateStockItem={handleUpdateStockItem}
            onDeleteStockItem={handleDeleteStockItem}
            onRecordStockMovement={handleRecordStockMovement}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            restaurant={restaurant}
            sales={sales}
            expenses={expenses}
          />
        )}

        {activeTab === 'menu' && (
          <MenuProfitabilityView
            restaurant={restaurant}
            menuItems={menuItems}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            restaurant={restaurant}
            user={currentUser}
            onUpdateRestaurant={handleUpdateRestaurant}
            onOpenNewRestaurant={() => setOnboardingOpen(true)}
            onNavigateToMenu={() => setActiveTab('menu')}
            onNavigateToDebts={() => setActiveTab('debts')}
            onNavigateToStock={() => setActiveTab('stock')}
            onReloadDemo={() => {
              loadSampleDemoData();
              reloadData();
            }}
            onClearData={() => {
              clearAllData();
              initializeStorage();
              reloadData();
            }}
            onOpenAdmin={() => setAdminModalOpen(true)}
            onOpenAI={() => setAiModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Thumb Navigation Anchor (Mobile & Desktop) */}
      <BottomNav
        activeTab={activeTab}
        unpaidDebtsCount={debts.filter((d) => d.status !== 'settled').length}
        lowStockCount={stockItems.filter((s) => s.currentStock <= s.minThreshold).length}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenQuickAdd={() => handleOpenQuickAdd('sale')}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        restaurantId={restaurant.restaurantId}
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaveSale={handleSaveSale}
        onSaveExpense={handleSaveExpense}
        onNavigateToDebts={() => setActiveTab('debts')}
        initialType={quickAddType}
      />

      {/* AI Financial Advisor Modal */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        restaurant={restaurant}
        sales={sales}
        expenses={expenses}
        menuItems={menuItems}
      />

      {/* Admin & System Health Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        restaurants={allRestaurants}
        totalTransactionsCount={sales.length + expenses.length}
      />

      {/* User Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(u) => {
          setCurrentUser(u);
          reloadData();
        }}
        onLogout={() => {
          setUserState(null);
          localStorage.removeItem('profitpilot_user');
        }}
      />

      {/* Restaurant Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
