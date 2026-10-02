import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, LogOut, Check } from 'lucide-react';
import { User as UserType } from '../types';
import { DEMO_USER } from '../data/demoData';
import { ASSETS } from '../assets';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const user: UserType = {
      userId: `usr_${Date.now()}`,
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      phone: phone.trim(),
      role: 'owner',
      createdAt: new Date().toISOString(),
    };

    onLogin(user);
    onClose();
  };

  const handleDemoLogin = () => {
    onLogin(DEMO_USER);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900">
            {currentUser ? 'Restaurant Owner Account' : mode === 'signin' ? 'Sign In to ProfitPilot' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <img
                src={ASSETS.mamaNjeriAvatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-neutral-300"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-bold text-sm text-neutral-900">{currentUser.name}</div>
                <div className="text-neutral-500">{currentUser.email}</div>
                <div className="text-neutral-500">{currentUser.phone}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Demo Login */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-900 block mb-1">
                Fast Evaluation Access
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[40px]"
              >
                <span>Continue as Mama Njeri (Demo Restaurant)</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-3 text-neutral-400 text-[11px]">or use credentials</span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Mwangi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="manager@restaurant.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone (M-Pesa)</label>
                  <input
                    type="tel"
                    placeholder="+254 712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors min-h-[44px]"
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-neutral-600 hover:text-neutral-900 font-medium"
              >
                {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
