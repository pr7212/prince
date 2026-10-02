import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { runFinancialCalculationsTests } from './src/tests/financialCalculations.test.ts';

dotenv.config();

const app = express();
app.use(express.json());

// Run verification tests on startup
const testResults = runFinancialCalculationsTests();
console.log(`[ProfitPilot] Financial calculations test suite: ${testResults.passedCount}/${testResults.total} passed.`);

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'ProfitPilot',
    timestamp: new Date().toISOString(),
    testsPassed: testResults.allPassed,
  });
});

app.get('/api/tests', (req, res) => {
  const currentTests = runFinancialCalculationsTests();
  res.json(currentTests);
});

// AI Financial Assistant Endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, restaurantContext } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API is available, generate grounded advice
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are ProfitPilot AI, a practical financial advisor for small restaurants and eateries in Kenya.
The user is a restaurant owner/manager asking about their restaurant's performance.
Always use Kenyan Shillings (KSh or KES) and refer to their real numbers provided in the context.
Keep your answers concise (2-4 short bullet points or a short paragraph), direct, and actionable.
Do NOT invent numbers outside what is provided.
Context from their actual ledger:
${JSON.stringify(restaurantContext, null, 2)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }],
            },
          ],
        });

        const replyText = response.text || 'Unable to generate analysis at this time.';
        res.json({ answer: replyText, source: 'gemini' });
        return;
      } catch (aiErr) {
        console.warn('Gemini API call failed, falling back to deterministic analytics:', aiErr);
      }
    }

    // Deterministic fallback using the provided numbers
    const { summary, restaurantName } = restaurantContext || {};
    const rev = summary?.revenue ?? 0;
    const exp = summary?.expenses ?? 0;
    const profit = summary?.estimatedProfit ?? 0;
    const margin = summary?.profitMargin ?? 0;
    const foodCost = summary?.foodCostPercentage ?? 0;

    const lowerQ = question.toLowerCase();
    let reply = '';

    if (lowerQ.includes('make') || lowerQ.includes('profit') || lowerQ.includes('revenue')) {
      reply = `According to your records for ${restaurantName || 'your restaurant'}:\n• Total Revenue: KSh ${rev.toLocaleString()}\n• Total Expenses: KSh ${exp.toLocaleString()}\n• Estimated Profit: KSh ${profit.toLocaleString()}\n• Profit Margin: ${margin.toFixed(1)}%`;
    } else if (lowerQ.includes('food') || lowerQ.includes('ingredient')) {
      reply = `Your food cost percentage is currently ${foodCost.toFixed(1)}% of revenue (KSh ${(summary?.foodExpenses || 0).toLocaleString()}). Healthy restaurant benchmarks generally target under 38-40%.`;
    } else if (lowerQ.includes('where') || lowerQ.includes('spend') || lowerQ.includes('expense')) {
      const topCats = Object.entries(summary?.expenseCategoryBreakdown || {})
        .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `• ${cat}: KSh ${(amt as number).toLocaleString()}`)
        .join('\n');
      reply = `Your top recorded expense categories are:\n${topCats || 'No expenses logged yet.'}\nTotal expenses recorded: KSh ${exp.toLocaleString()}`;
    } else {
      reply = `Here is your quick financial status for ${restaurantName || 'your restaurant'}:\n• Sales: KSh ${rev.toLocaleString()}\n• Expenses: KSh ${exp.toLocaleString()}\n• Estimated Profit: KSh ${profit.toLocaleString()} (${margin.toFixed(1)}% margin)\n• Food Cost: ${foodCost.toFixed(1)}%`;
    }

    res.json({ answer: reply, source: 'deterministic' });
  } catch (error) {
    console.error('AI assistant error:', error);
    res.status(500).json({ error: 'Failed to process inquiry. Please try again.' });
  }
});

// Vite or Production Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProfitPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
