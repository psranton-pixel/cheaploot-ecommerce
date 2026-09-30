import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Play, Sparkles, ShieldCheck, 
  Layers, ArrowRight, RefreshCw, X, HelpCircle, FileCheck
} from 'lucide-react';
import { ProductIdentificationBenchmarkItem, BenchmarkTestResult } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleToLoad?: (item: ProductIdentificationBenchmarkItem) => void;
}

export const IdentificationBenchmarkModal: React.FC<Props> = ({ isOpen, onClose, onSelectSampleToLoad }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<BenchmarkTestResult[] | null>(null);
  const [accuracyStats, setAccuracyStats] = useState<{
    totalTested: number;
    passedCount: number;
    accuracyRate: number;
    avgConfidence: number;
  } | null>(null);
  const [selectedResult, setSelectedResult] = useState<BenchmarkTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/import/run-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Benchmark run failed');
      }
      setTestResults(data.results);
      setAccuracyStats({
        totalTested: data.totalTested,
        passedCount: data.passedCount,
        accuracyRate: data.accuracyRate,
        avgConfidence: data.avgConfidence
      });
      if (data.results && data.results.length > 0) {
        setSelectedResult(data.results[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute benchmark suite');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-neutral-800 w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#FFD400] text-black px-2 py-0.5 rounded">
                Quality Assurance
              </span>
              <h2 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FFD400]" />
                10-Product AI Identification Benchmark Suite
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Evaluates visual identification, OCR extraction, multi-image aggregation, and brand/model precision across 10 canonical hardware, media, automotive, and electronic categories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-xl flex items-center gap-1.5 transition-colors shadow disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? 'Running 10-Item Benchmark...' : 'Run Live Benchmark'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Accuracy KPI Strip */}
        {accuracyStats && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-neutral-900/80 border-b border-neutral-800 text-xs font-mono">
            <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/50">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-bold">Total Tests</div>
              <div className="text-lg font-black text-white mt-0.5">{accuracyStats.totalTested} Canonical Items</div>
            </div>
            <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/50">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-bold">Accuracy Rate</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{accuracyStats.accuracyRate}% Passed</div>
            </div>
            <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/50">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-bold">Passed Items</div>
              <div className="text-lg font-black text-[#FFD400] mt-0.5">{accuracyStats.passedCount} / {accuracyStats.totalTested}</div>
            </div>
            <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/50">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-bold">Avg AI Confidence</div>
              <div className="text-lg font-black text-sky-400 mt-0.5">{accuracyStats.avgConfidence}%</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 mx-4 mt-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Items List */}
          <div className="md:col-span-6 border-r border-neutral-800 overflow-y-auto p-4 space-y-2 max-h-[550px]">
            <div className="text-[11px] font-bold uppercase text-gray-400 mb-2 flex items-center justify-between">
              <span>Benchmark Items (10 Standard Categories)</span>
              <span className="text-[10px] font-mono text-gray-500">Click item to inspect evidence</span>
            </div>

            {!testResults && !isRunning && (
              <div className="p-8 text-center bg-neutral-900/40 rounded-xl border border-neutral-800/60 space-y-3">
                <Layers className="w-8 h-8 text-gray-600 mx-auto" />
                <div className="text-xs text-gray-400">
                  Click <strong>Run Live Benchmark</strong> above to evaluate the AI identification engine across DVD, Book, Power Tool, Power Adapter, Cable, Remote, Auto Part, Dishwasher Pack, Battery Charger, and Wireless Pad.
                </div>
              </div>
            )}

            {isRunning && (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#FFD400] animate-spin mx-auto" />
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Analyzing 10 Canonical Products...
                </div>
                <p className="text-[11px] text-gray-400">
                  Running visual analysis, label OCR extraction, and multi-image evidence synthesis.
                </p>
              </div>
            )}

            {testResults && testResults.map((result, idx) => {
              const isSelected = selectedResult?.itemId === result.itemId;
              return (
                <div
                  key={result.itemId}
                  onClick={() => setSelectedResult(result)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected ? 'bg-neutral-800/90 border-[#FFD400]' : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-gray-400 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="font-bold text-xs text-white line-clamp-1">{result.canonicalName}</div>
                    </div>

                    {result.overallPass ? (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-black uppercase rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Pass
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-black uppercase rounded flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Review
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className={`px-2 py-1 rounded border flex items-center justify-between ${result.brandPass ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300' : 'bg-red-950/40 border-red-900/60 text-red-300'}`}>
                      <span>Brand</span>
                      <span>{result.brandPass ? '✓' : '✗'}</span>
                    </div>
                    <div className={`px-2 py-1 rounded border flex items-center justify-between ${result.itemTypePass ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300' : 'bg-red-950/40 border-red-900/60 text-red-300'}`}>
                      <span>Type</span>
                      <span>{result.itemTypePass ? '✓' : '✗'}</span>
                    </div>
                    <div className={`px-2 py-1 rounded border flex items-center justify-between ${result.modelOrIdentifierPass ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300' : 'bg-amber-950/40 border-amber-900/60 text-amber-300'}`}>
                      <span>Model/ID</span>
                      <span>{result.modelOrIdentifierPass ? '✓' : '~'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Result Card */}
          <div className="md:col-span-6 overflow-y-auto p-5 space-y-4 max-h-[550px] bg-[#141414]">
            {selectedResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Item Inspection</span>
                    <h3 className="font-black text-sm text-white">{selectedResult.canonicalName}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FFD400] bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                    Confidence: {selectedResult.identification.confidence}% ({selectedResult.identification.confidence_tier})
                  </span>
                </div>

                {/* Structured Identification Output Fields */}
                <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Structured Identification Record
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-gray-500 block text-[10px]">ITEM TYPE:</span>
                      <strong className="text-white">{selectedResult.identification.item_type}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">BRAND:</span>
                      <strong className="text-[#FFD400]">{selectedResult.identification.brand}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">MODEL / MPN:</span>
                      <strong className="text-emerald-400">{selectedResult.identification.model || selectedResult.identification.manufacturer_part_number || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">CATEGORY:</span>
                      <strong className="text-gray-300">{selectedResult.identification.category}</strong>
                    </div>
                  </div>
                </div>

                {/* Confirmed vs Unconfirmed */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Attributes
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-300 font-mono">
                      {Object.entries(selectedResult.identification.confirmed_attributes).length > 0 ? (
                        Object.entries(selectedResult.identification.confirmed_attributes).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-gray-400">{k}:</span>
                            <span className="font-bold text-white">{v}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 italic">None logged</div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Unconfirmed / Missing
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-300 font-mono">
                      {selectedResult.identification.not_confirmed_attributes?.length > 0 ? (
                        selectedResult.identification.not_confirmed_attributes.map((u, i) => (
                          <div key={i} className="text-amber-200/80">• {u}</div>
                        ))
                      ) : (
                        <div className="text-emerald-400 font-bold">All Key Fields Verified ✓</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evidence Trail */}
                <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="text-[10px] font-black uppercase text-[#FFD400] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    AI Evidence Trail
                  </div>
                  <ul className="space-y-1 text-[11px] text-gray-300">
                    {selectedResult.identification.evidence?.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#FFD400] mt-0.5">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Operator Next Action */}
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Operator Guidance:</span>
                  <span className="text-gray-300 text-[11px]">
                    {selectedResult.identification.requested_photo_or_action || 'Identification confident. Ready to generate commercial listing.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 text-xs">
                Select an item on the left to view its detailed AI identification scorecard, evidence trail, and accuracy breakdown.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-900/40 text-xs">
          <span className="text-gray-400">
            CheapLoot AI Product Identification Engine — Strict 2-Stage Pipeline Verification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
