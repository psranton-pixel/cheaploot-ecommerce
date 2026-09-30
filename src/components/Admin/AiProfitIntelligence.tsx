import React, { useState } from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';

export const AiProfitIntelligence: React.FC = () => {
  const [query, setQuery] = useState('What is our current inventory margin and stock recommendations?');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (qToSend?: string) => {
    const text = qToSend || query;
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/profit-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text })
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data.analysis);
      }
    } catch (err) {
      console.error('Profit intel error:', err);
      setResponse('Commercial analysis service is currently offline. Please check active inventory in the Catalogue tab.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#FFD400] text-[#111111] flex items-center justify-center font-black">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base uppercase text-white">
              AI Commercial Profit & Restock Intelligence
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Ask questions about sales velocity, gross margins, slow inventory, and pricing strategy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            'What is our current inventory margin and stock recommendations?',
            'Identify slow-moving stock across warehouses',
            'What clearance promotions should we run this week?',
            'Analyze turnover rates and margin optimization'
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(preset); handleAsk(preset); }}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 px-3 py-1.5 rounded text-[11px] font-semibold border border-neutral-700 text-left"
            >
              {preset}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-2.5 text-xs text-white font-bold"
            placeholder="Ask a commercial question about inventory, profit, or sales..."
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#FFD400] text-[#111111] font-black text-xs px-5 py-2.5 rounded uppercase"
          >
            {isLoading ? 'Analyzing...' : 'Run Query'}
          </button>
        </form>
      </div>

      {response && (
        <div className="bg-[#111111] p-5 rounded-xl border-2 border-emerald-500 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>AI Commercial Intelligence Report</span>
          </div>

          <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line font-medium bg-neutral-900 p-4 rounded border border-neutral-800">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};
