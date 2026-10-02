import React, { useState } from 'react';
import { Building2, Sparkles, Shield, User, ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { Restaurant, User as UserType } from '../types';
import { ASSETS } from '../assets';

interface TopBarProps {
  restaurant: Restaurant;
  user: UserType | null;
  allRestaurants: Restaurant[];
  isDemoMode: boolean;
  onSelectRestaurant: (restaurantId: string) => void;
  onOpenNewRestaurant: () => void;
  onOpenAI: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onToggleDemoMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  restaurant,
  user,
  allRestaurants,
  isDemoMode,
  onSelectRestaurant,
  onOpenNewRestaurant,
  onOpenAI,
  onOpenAdmin,
  onOpenAuth,
  onToggleDemoMode,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Demo Mode Notice Banner if enabled */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold tracking-wide uppercase text-[10px] text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">
              Demo Data Mode
            </span>
            <span className="truncate">Sample figures for Mama Njeri Restaurant (Nairobi, Kenya)</span>
          </div>
          <button
            onClick={onToggleDemoMode}
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 ml-2"
          >
            Start Fresh Data
          </button>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Context / Links) — Zone 3 (Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-900">
              ProfitPilot
            </span>
          </div>

          <span className="hidden sm:inline text-neutral-300">/</span>

          {/* Zone 2: Context - Restaurant Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 py-1 px-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
              aria-label="Select Restaurant"
            >
              <Building2 className="w-4 h-4 text-neutral-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-neutral-900 truncate max-w-[140px] sm:max-w-[220px]">
                  {restaurant.restaurantName}
                </span>
                <span className="text-[10px] text-neutral-500 hidden sm:block truncate">
                  {restaurant.location} · {restaurant.currency}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Your Restaurants
                  </div>
                  {allRestaurants.map((r) => (
                    <button
                      key={r.restaurantId}
                      onClick={() => {
                        onSelectRestaurant(r.restaurantId);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                        r.restaurantId === restaurant.restaurantId ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-neutral-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{r.restaurantName}</div>
                        <div className="text-[10px] text-neutral-400">{r.location}</div>
                      </div>
                      {r.restaurantId === restaurant.restaurantId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-neutral-100 my-1" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewRestaurant();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-emerald-700 font-medium hover:bg-neutral-50 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Restaurant</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Advisor Button */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="Ask ProfitPilot AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Financial AI</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Admin Console & Health"
            aria-label="Admin Console"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* User Account / Profile */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            title={user ? user.name : 'Sign In'}
            aria-label="User Account"
          >
            {isDemoMode ? (
              <img
                src={ASSETS.mamaNjeriAvatar}
                alt="Mama Njeri"
                className="w-7 h-7 rounded-full object-cover border border-neutral-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            )}
            <span className="text-xs font-medium text-neutral-800 hidden md:inline truncate max-w-[100px]">
              {user?.name?.split(' ')[0] || 'Account'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
