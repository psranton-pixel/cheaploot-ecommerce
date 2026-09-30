import React, { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, CheckCircle2, AlertCircle, Lock, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const EbaySyncTab: React.FC = () => {
  const { products } = useStore();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/ebay/status');
      const data = await res.json();
      setSyncStatus(data);
    } catch (e) {
      console.warn('eBay status check error:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/ebay/sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      fetchStatus();
    } catch (err: any) {
      setSyncResult({ success: false, errors: [{ sku: 'ALL', error: err.message }] });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-[#111111] p-5 rounded-xl border-2 border-[#FFD400] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-blue-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Server-Side OAuth Protected
                </span>
                <span className="text-xs text-gray-400 font-mono">eBay Australia Multi-Channel Engine</span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                eBay Master Inventory Synchronizer
              </h2>
            </div>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs px-4 py-2.5 rounded flex items-center gap-2 uppercase shadow self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing eBay API...' : 'Trigger Full Stock Sync'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Master Stock Source</div>
            <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CheapLoot PostgreSQL
            </div>
          </div>

          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Credential Security</div>
            <div className="font-bold text-white mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#FFD400]" />
              Zero Frontend Exposure
            </div>
          </div>

          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Active SKUs in Scope</div>
            <div className="font-bold text-white mt-1">
              {products.length} Products Monitored
            </div>
          </div>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncResult && (
        <div className={`p-4 rounded-xl border text-xs ${
          syncResult.success
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : 'bg-[#E21C21]/20 border-[#E21C21] text-red-200'
        }`}>
          <div className="font-bold flex items-center gap-2">
            {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-[#E21C21]" />}
            <span>
              {syncResult.success
                ? `Successfully synchronized ${syncResult.syncedCount} items with eBay marketplace.`
                : 'Encountered issues during marketplace synchronization.'}
            </span>
          </div>
        </div>
      )}

      {/* Marketplace Listings Table */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-black text-sm uppercase text-white">Live eBay Listing Mapping</h3>
            <p className="text-xs text-gray-400">PostgreSQL stock level automatically revises or ends eBay listings upon purchase</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#FFD400]">{products.length} Channel SKUs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-800 text-gray-400 uppercase font-black">
              <tr>
                <th className="p-2.5">CheapLoot SKU</th>
                <th className="p-2.5">Title</th>
                <th className="p-2.5">Master Stock</th>
                <th className="p-2.5">Store Price</th>
                <th className="p-2.5">eBay Status</th>
                <th className="p-2.5">Sync Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-gray-200">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-neutral-800/50">
                  <td className="p-2.5 font-mono font-bold text-[#FFD400]">{p.sku}</td>
                  <td className="p-2.5">
                    <div className="font-bold text-white line-clamp-1">{p.title}</div>
                    <div className="text-[10px] text-gray-400">{p.brand}</div>
                  </td>
                  <td className="p-2.5 font-bold">
                    <span className={p.stock <= 0 ? 'text-[#E21C21]' : 'text-emerald-400'}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-2.5 font-mono font-bold text-white">${p.price.toFixed(2)}</td>
                  <td className="p-2.5">
                    {p.stock > 0 ? (
                      <span className="bg-blue-950 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-800/50">
                        Active Listing
                      </span>
                    ) : (
                      <span className="bg-red-950 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-800/50">
                        Auto-Ended (0 Stock)
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-gray-400 font-mono text-[11px]">
                    Real-time webhook sync
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
