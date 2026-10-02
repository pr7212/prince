import React, { useState } from 'react';
import { Building2, Utensils, CheckCircle2, ArrowRight } from 'lucide-react';
import { Restaurant, RestaurantType } from '../types';
import { ASSETS } from '../assets';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (restaurant: Restaurant, loadDemo: boolean) => void;
}

const RESTAURANT_TYPES: RestaurantType[] = [
  'Nyama Choma',
  'Eatery / Small Hotel',
  'Café',
  'Takeaway & Fast Food',
  'Bakery',
  'Family Restaurant',
  'Other',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  if (!isOpen) return null;

  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [phone, setPhone] = useState('+254 7');
  const [restaurantType, setRestaurantType] = useState<RestaurantType>('Nyama Choma');
  const [currency, setCurrency] = useState('KES');
  const [loadDemo, setLoadDemo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) return;

    const newRestaurant: Restaurant = {
      restaurantId: `rest_${Date.now()}`,
      ownerId: `usr_${Date.now()}`,
      restaurantName: restaurantName.trim(),
      location: location.trim(),
      phone: phone.trim(),
      currency,
      restaurantType,
      subscriptionPlan: 'pro',
      createdAt: new Date().toISOString(),
    };

    onComplete(newRestaurant, loadDemo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
        {/* Banner with Restaurant Interior asset */}
        <div className="relative h-36 w-full overflow-hidden bg-neutral-900">
          <img
            src={ASSETS.restaurantInterior}
            alt="Kenyan Restaurant Interior"
            className="w-full h-full object-cover opacity-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex items-end p-5">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Welcome to ProfitPilot
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Set Up Your Restaurant
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Restaurant Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Mama Oliech Eatery, Kilimani Java, Nyama Point"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Restaurant Type
              </label>
              <select
                value={restaurantType}
                onChange={(e) => setRestaurantType(e.target.value as RestaurantType)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
              >
                {RESTAURANT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
              >
                <option value="KES">KES (Kenyan Shilling - KSh)</option>
                <option value="USD">USD ($)</option>
                <option value="UGX">UGX (Ugandan Shilling)</option>
                <option value="TZS">TZS (Tanzanian Shilling)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Location (Town / Area)
              </label>
              <input
                type="text"
                placeholder="e.g. Westlands, Nairobi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+254 712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Demo Data Option */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={loadDemo}
                onChange={(e) => setLoadDemo(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Preload sample data to test features
                </span>
                <span className="text-[11px] text-neutral-500 leading-tight block">
                  Includes realistic Kenyan sales, M-Pesa receipts, meat & vegetable purchases. You can wipe sample data at any time.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={!restaurantName.trim()}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
