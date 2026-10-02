import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Restaurant, Sale, Expense, MenuItem } from '../types';
import { computeFinancialSummary, formatKES } from '../utils/calculations';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  sales: Sale[];
  expenses: Expense[];
  menuItems: MenuItem[];
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'deterministic';
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  sales,
  expenses,
  menuItems,
}) => {
  if (!isOpen) return null;

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute summary for context
  const summary = computeFinancialSummary(sales, expenses);

  const initialGreeting = `Hello! I'm your ProfitPilot Financial Advisor for ${restaurant.restaurantName}. I have analyzed your ${sales.length} sales and ${expenses.length} expenses. Ask me anything about your revenue, food costs, top expenses, or dish margins!`;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: initialGreeting,
    },
  ]);

  const quickQuestions = [
    'How much did I make this week?',
    'Where did most of my money go?',
    'What were my biggest expenses?',
    'Which menu item has the highest margin?',
    'Is my food cost percentage healthy?',
  ];

  const handleAsk = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    // Append user message
    const updatedMessages: Message[] = [...messages, { role: 'user', text: q }];
    setMessages(updatedMessages);
    setInputQuery('');
    setLoading(true);

    try {
      // Build safe context for current restaurant only (tenant isolation)
      const context = {
        restaurantName: restaurant.restaurantName,
        currency: restaurant.currency,
        summary: {
          revenue: summary.revenue,
          expenses: summary.expenses,
          estimatedProfit: summary.estimatedProfit,
          profitMargin: summary.profitMargin,
          foodExpenses: summary.foodExpenses,
          foodCostPercentage: summary.foodCostPercentage,
          otherExpenses: summary.otherExpenses,
          paymentMethodBreakdown: summary.paymentMethodBreakdown,
          expenseCategoryBreakdown: summary.expenseCategoryBreakdown,
        },
        sampleMenu: menuItems.map((m) => ({
          name: m.name,
          price: m.sellingPrice,
          cost: m.estimatedCost,
          margin: m.sellingPrice > 0 ? (((m.sellingPrice - m.estimatedCost) / m.sellingPrice) * 100).toFixed(1) + '%' : '0%',
        })),
      };

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          restaurantContext: context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...updatedMessages,
          { role: 'assistant', text: data.answer, source: data.source },
        ]);
      } else {
        throw new Error('API server returned error');
      }
    } catch (err) {
      // Deterministic client fallback using authentic data
      let answer = '';
      const lower = q.toLowerCase();
      if (lower.includes('margin') || lower.includes('dish') || lower.includes('menu')) {
        const sorted = [...menuItems].sort((a, b) => {
          const ma = a.sellingPrice > 0 ? (a.sellingPrice - a.estimatedCost) / a.sellingPrice : 0;
          const mb = b.sellingPrice > 0 ? (b.sellingPrice - b.estimatedCost) / b.sellingPrice : 0;
          return mb - ma;
        });
        if (sorted.length > 0) {
          const best = sorted[0];
          const mPct = (((best.sellingPrice - best.estimatedCost) / best.sellingPrice) * 100).toFixed(1);
          answer = `Your highest margin dish is ${best.name} at ${mPct}% gross margin (Price: ${formatKES(best.sellingPrice)}, Est. cost: ${formatKES(best.estimatedCost)}).`;
        } else {
          answer = 'You have not added any menu items yet. Visit the Menu section to add dishes.';
        }
      } else if (lower.includes('food')) {
        answer = `Your total food purchases are ${formatKES(summary.foodExpenses)}, representing ${summary.foodCostPercentage.toFixed(1)}% of your recorded revenue (${formatKES(summary.revenue)}). In Kenyan restaurants, keeping food cost below 38-40% maintains healthy profitability.`;
      } else if (lower.includes('where') || lower.includes('spend') || lower.includes('expense')) {
        const top = Object.entries(summary.expenseCategoryBreakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([c, amt]) => `• ${c}: ${formatKES(amt)}`)
          .join('\n');
        answer = `Your top expense categories across all records are:\n${top || 'No expenses logged.'}\nTotal expenses: ${formatKES(summary.expenses)}.`;
      } else {
        answer = `Here is your current financial summary for ${restaurant.restaurantName}:\n• Total Revenue: ${formatKES(summary.revenue)}\n• Total Expenses: ${formatKES(summary.expenses)}\n• Estimated Profit: ${formatKES(summary.estimatedProfit)} (${summary.profitMargin.toFixed(1)}% margin)\n• Food Cost: ${summary.foodCostPercentage.toFixed(1)}%`;
      }

      setMessages([
        ...updatedMessages,
        { role: 'assistant', text: answer, source: 'deterministic' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl z-10 flex flex-col h-[85vh] max-h-[640px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                ProfitPilot Financial AI
                <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  Tenant Isolated
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Grounded strictly in {restaurant.restaurantName}'s ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white rounded-tr-none'
                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                {m.source && (
                  <div className="mt-1.5 pt-1.5 border-t border-neutral-100 flex items-center gap-1 text-[10px] text-neutral-400">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>
                      {m.source === 'gemini'
                        ? 'Analyzed with Gemini 2.5 Flash'
                        : 'Calculated with deterministic ledger analytics'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Analyzing your restaurant's numbers...</span>
            </div>
          )}
        </div>

        {/* Quick questions chips */}
        <div className="px-4 py-2 bg-white border-t border-neutral-100 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mr-1">
            Try:
          </span>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              className="text-[11px] px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(inputQuery);
          }}
          className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask a question about your revenue, costs, or profit..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
