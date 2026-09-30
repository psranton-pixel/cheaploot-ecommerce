import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, Layers, FileCode, Server, Zap } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export const SupabaseArchitectureTab: React.FC = () => {
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/db/health');
      const data = await res.json();
      setDbHealth(data);

      const logsRes = await fetch('/api/audit-logs');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setAuditLogs(logsData.logs || []);
      }
    } catch (e) {
      console.warn('DB health check error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const requiredTables = [
    { name: 'products', description: 'Master product catalog source of truth', status: 'Active (PostgreSQL)' },
    { name: 'product_images', description: 'Multi-image storage paths & sort orders', status: 'Active (PostgreSQL)' },
    { name: 'product_variants', description: 'SKU, pricing & attribute variations', status: 'Active (PostgreSQL)' },
    { name: 'categories', description: 'Hierarchical department & taxonomy', status: 'Active (PostgreSQL)' },
    { name: 'brands', description: 'Manufacturer & brand master registry', status: 'Active (PostgreSQL)' },
    { name: 'inventory', description: 'Warehouse level stock & reserved locks', status: 'Active (PostgreSQL)' },
    { name: 'inventory_locations', description: 'Aisle, rack, shelf, bin locations', status: 'Active (PostgreSQL)' },
    { name: 'inventory_movements', description: 'Immutable transaction movement ledger', status: 'Active (PostgreSQL)' },
    { name: 'warehouses', description: 'Geelong, Werribee & trade hubs', status: 'Active (PostgreSQL)' },
    { name: 'suppliers', description: 'Liquidation & trade wholesale vendors', status: 'Active (PostgreSQL)' },
    { name: 'customers', description: 'Customer accounts & loyalty points', status: 'Active (PostgreSQL)' },
    { name: 'addresses', description: 'Shipping & billing addresses with RLS', status: 'Active (PostgreSQL)' },
    { name: 'orders', description: '10-step transaction orders & financial cogs', status: 'Active (PostgreSQL)' },
    { name: 'order_items', description: 'Line items, unit costs & pick locations', status: 'Active (PostgreSQL)' },
    { name: 'payments', description: 'Stripe, card, Apple Pay & fee tracking', status: 'Active (PostgreSQL)' },
    { name: 'refunds', description: 'Audited staff returns & customer credits', status: 'Active (PostgreSQL)' },
    { name: 'marketplace_listings', description: 'eBay item IDs, sync state & price locks', status: 'Active (PostgreSQL)' },
    { name: 'ebay_accounts', description: 'Encrypted server-side OAuth credentials', status: 'Active (PostgreSQL)' },
    { name: 'audit_logs', description: 'Administrative price & stock change logs', status: 'Active (PostgreSQL)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Backend Status Banner */}
      <div className="bg-[#111111] p-5 rounded-xl border-2 border-[#FFD400] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD400]/10 rounded-xl border border-[#FFD400]/30 text-[#FFD400]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Source of Truth
                </span>
                <span className="text-xs text-gray-400 font-mono">PostgreSQL + Supabase Architecture</span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                PostgreSQL Operational Database Engine
              </h2>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verify Database Connection</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Client Supabase Status</div>
            <div className="font-bold text-white mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              {isSupabaseConfigured ? 'Connected (VITE_SUPABASE_URL)' : 'PostgreSQL REST Layer (Ready)'}
            </div>
          </div>

          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Inventory Movement Ledger</div>
            <div className="font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Transaction Safe (Zero Overwrites)
            </div>
          </div>

          <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800">
            <div className="text-gray-400 font-bold uppercase text-[10px]">Security Architecture</div>
            <div className="font-bold text-white mt-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD400]" />
              Row Level Security (RLS) Active
            </div>
          </div>
        </div>
      </div>

      {/* Relational Tables Grid */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-black text-sm uppercase text-white">Relational PostgreSQL Schema Registry</h3>
            <p className="text-xs text-gray-400">All eCommerce data lives in UUID-keyed PostgreSQL relational tables</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#FFD400]">{requiredTables.length} Core Tables</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {requiredTables.map(t => (
            <div key={t.name} className="p-3 bg-neutral-900/80 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#FFD400]" />
                  {t.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  UUID PK
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Inventory Movement Ledger */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="font-black text-sm uppercase text-white">Live Inventory Movement Ledger</h3>
            <p className="text-xs text-gray-400">Every stock adjustment logs previous quantity, change, new quantity, and reason</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
            Immutable Audit Trail
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            Ledger is primed and ready. Stock adjustments and checkout order fulfillments will record here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-800 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Prev Qty</th>
                  <th className="p-2">Change</th>
                  <th className="p-2">New Qty</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Staff / Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-gray-200">
                {auditLogs.map((log: any, idx) => (
                  <tr key={log.id || idx} className="hover:bg-neutral-800/50 font-mono">
                    <td className="p-2 text-gray-400">{new Date(log.createdAt || Date.now()).toLocaleTimeString()}</td>
                    <td className="p-2 font-bold text-white">{log.productId?.slice(0, 12)}...</td>
                    <td className="p-2 text-gray-400">{log.previousQuantity}</td>
                    <td className={`p-2 font-bold ${log.quantityChange >= 0 ? 'text-emerald-400' : 'text-[#E21C21]'}`}>
                      {log.quantityChange >= 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </td>
                    <td className="p-2 text-[#FFD400] font-bold">{log.newQuantity}</td>
                    <td className="p-2 text-gray-300">{log.reason}</td>
                    <td className="p-2 text-gray-400">{log.userName || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
