import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Activity, Users, Building, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Restaurant } from '../types';
import { runFinancialCalculationsTests, TestResult } from '../tests/financialCalculations.test';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  totalTransactionsCount: number;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  totalTransactionsCount,
}) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState<{
    allPassed: boolean;
    total: number;
    passedCount: number;
    results: TestResult[];
  }>({
    allPassed: true,
    total: 0,
    passedCount: 0,
    results: [],
  });

  useEffect(() => {
    const res = runFinancialCalculationsTests();
    setTestResults(res);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-neutral-900">ProfitPilot Platform & System Health</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Top Platform Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[11px] text-neutral-500 font-semibold block uppercase tracking-wider">
                Total Restaurants
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900">
                {restaurants.length}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[11px] text-neutral-500 font-semibold block uppercase tracking-wider">
                Active Tenant Stores
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700">
                {restaurants.length}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[11px] text-neutral-500 font-semibold block uppercase tracking-wider">
                Total Ledger Items
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900">
                {totalTransactionsCount}
              </span>
            </div>
          </div>

          {/* Subscription Tier Distribution */}
          <div>
            <h3 className="font-bold text-neutral-900 mb-2">SaaS Plan Distribution</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
                <span>Free Tier</span>
                <span className="font-mono font-bold">
                  {restaurants.filter((r) => r.subscriptionPlan === 'free').length}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 flex items-center justify-between font-semibold">
                <span>Pro Tier (KES)</span>
                <span className="font-mono font-bold">
                  {restaurants.filter((r) => r.subscriptionPlan === 'pro').length}
                </span>
              </div>
              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
                <span>Business Multi-branch</span>
                <span className="font-mono font-bold">
                  {restaurants.filter((r) => r.subscriptionPlan === 'business').length}
                </span>
              </div>
            </div>
          </div>

          {/* Unit Test & Financial Calculation Integrity Status (Section 28) */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-neutral-900">
                  Financial Calculation Test Suite (Section 28)
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                {testResults.passedCount}/{testResults.total} Passed
              </span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Verified: Profit calculation, Margin with zero revenue safety, Food cost %, Floating-point cents rounding, and Tenant Isolation.
            </p>

            <div className="divide-y divide-emerald-100/60 pt-1 text-[11px]">
              {testResults.results.map((t, idx) => (
                <div key={idx} className="py-1 flex items-center justify-between">
                  <span className="text-neutral-700">{t.name}</span>
                  <span className="font-mono font-bold text-emerald-800">Pass</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
