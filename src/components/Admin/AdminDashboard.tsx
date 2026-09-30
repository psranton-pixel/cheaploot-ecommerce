import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, Sparkles, AlertTriangle, Layers, 
  DollarSign, TrendingUp, CheckCircle2, QrCode, ArrowUpRight, 
  RefreshCw, Bot, Plus, Tag, ArrowLeft, ShieldAlert, Cpu, Wrench,
  Database, ShoppingBag, FileSpreadsheet, Calendar, Search, 
  Trash2, SlidersHorizontal, Check, Filter, CheckSquare, Square
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { WarehousePicker } from './WarehousePicker';
import { StocktakeScanner } from './StocktakeScanner';
import { AiListingCreator } from './AiListingCreator';
import { AiProfitIntelligence } from './AiProfitIntelligence';
import { SupabaseArchitectureTab } from './SupabaseArchitectureTab';
import { EbaySyncTab } from './EbaySyncTab';
import { ProductImportCentre } from './ImportCentre/ProductImportCentre';
import { CreateProductPage } from './CreateProduct/CreateProductPage';
import { GoogleCalendarHub } from '../Calendar/GoogleCalendarHub';
import { GoogleSheetsHub } from '../Sheets/GoogleSheetsHub';
import { ExportToSheetButton } from '../Sheets/ExportToSheetButton';
import { BulkEditModal, BulkUpdatePayload } from './Common/BulkEditModal';
import { INITIAL_DEPARTMENTS } from '../../data/mockData';
import { Product, Order } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { products, orders, setCurrentView, refreshProducts } = useStore();
  // Default to products so staff immediately see the live inventory and bulk editor
  const [activeTab, setActiveTab] = useState<'products' | 'create-product' | 'import-centre' | 'ai-listing' | 'sheets' | 'calendar' | 'kpi' | 'picker' | 'stocktake' | 'ai-profit' | 'ebay' | 'database'>('products');
  const [profitStats, setProfitStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Catalogue Multi-Select & Filter State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDeptFilter, setCatalogDeptFilter] = useState('all');
  const [catalogConditionFilter, setCatalogConditionFilter] = useState('all');
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/profit-stats')
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success) setProfitStats(data.stats);
      })
      .catch(() => {
        // Silent fallback
      });
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const paidOrdersCount = orders.filter(o => o.status === 'paid' || o.status === 'picking').length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const clearanceCount = products.filter(p => p.isClearance).length;

  // Filter products for catalogue
  const filteredProducts = products.filter(p => {
    if (catalogDeptFilter !== 'all' && p.department !== catalogDeptFilter) return false;
    if (catalogConditionFilter !== 'all' && p.condition !== catalogConditionFilter) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.warehouseLocation && p.warehouseLocation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const allFilteredSelected = filteredProducts.length > 0 && 
    filteredProducts.every(p => selectedProductIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Execute Bulk Update on Catalogue
  const handleApplyBulkUpdate = async (payload: BulkUpdatePayload) => {
    const targetIds = selectedProductIds.length > 0 ? selectedProductIds : filteredProducts.map(p => p.id);
    if (targetIds.length === 0) return;

    setIsBulkSubmitting(true);
    try {
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: targetIds,
          updates: payload
        })
      });
      const data = await res.json();
      if (data.success) {
        const count = data.updatedCount ?? data.count ?? targetIds.length;
        setStatusFeedback(`Successfully updated ${count} items!`);
        setTimeout(() => setStatusFeedback(null), 4000);
        setIsBulkEditModalOpen(false);
        setSelectedProductIds([]);
        await refreshProducts();
      } else {
        setStatusFeedback(`Failed: ${data.message || data.error || 'Could not apply bulk update'}`);
        setTimeout(() => setStatusFeedback(null), 5000);
      }
    } catch (err: any) {
      setStatusFeedback(`Error updating products: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 5000);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Quick 1-click Category / Department Assignment
  const handleQuickAssignDepartment = async (deptSlug: string) => {
    const dept = INITIAL_DEPARTMENTS.find(d => d.slug === deptSlug);
    if (!dept) return;

    const targetIds = selectedProductIds.length > 0 ? selectedProductIds : filteredProducts.map(p => p.id);
    if (targetIds.length === 0) return;

    setIsBulkSubmitting(true);
    try {
      const updates: any = {
        department: dept.name
      };
      if (dept.subcategories && dept.subcategories.length > 0) {
        updates.category = dept.subcategories[0].name;
      }

      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: targetIds,
          updates
        })
      });
      const data = await res.json();
      if (data.success) {
        const count = data.updatedCount ?? data.count ?? targetIds.length;
        setStatusFeedback(`Assigned "${dept.name}" to ${count} items!`);
        setTimeout(() => setStatusFeedback(null), 4000);
        await refreshProducts();
      } else {
        setStatusFeedback(`Failed to assign department: ${data.message || 'Server error'}`);
        setTimeout(() => setStatusFeedback(null), 5000);
      }
    } catch (err: any) {
      setStatusFeedback(`Error assigning department: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 5000);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    setIsBulkSubmitting(true);
    try {
      const res = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProductIds })
      });
      const data = await res.json();
      if (data.success) {
        setStatusFeedback(`Deleted ${data.deletedCount ?? selectedProductIds.length} items from inventory.`);
        setTimeout(() => setStatusFeedback(null), 4000);
        setSelectedProductIds([]);
        await refreshProducts();
      } else {
        setStatusFeedback(`Failed to delete: ${data.message || 'Server error'}`);
        setTimeout(() => setStatusFeedback(null), 5000);
      }
    } catch (err: any) {
      setStatusFeedback(`Error deleting items: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 5000);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  return (
    <div className="py-6 bg-[#181818] min-h-screen text-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6">
        {/* Top Command Bar */}
        <div className="bg-[#111111] p-4 sm:p-5 rounded-xl border-2 border-[#FFD400] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-[#FFD400] transition-colors"
              title="Return to Customer Store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD400] text-[#111111] text-xs font-black uppercase px-2 py-0.5 rounded">
                  STAFF PORTAL
                </span>
                <span className="text-xs text-gray-400 font-mono">Geelong Hub • DC-01</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                CheapLoot Warehouse Command Centre
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsRefreshing(true);
                refreshProducts().then(() => setIsRefreshing(false));
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-listing')}
              className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] text-xs font-black px-3.5 py-2 rounded flex items-center gap-1.5 uppercase shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Create Listing</span>
            </button>
          </div>
        </div>

        {/* Action Required Banner */}
        {paidOrdersCount > 0 && (
          <div className="bg-[#E21C21]/20 border border-[#E21C21] text-white p-3 rounded-lg flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E21C21] animate-ping" />
              <span>ACTION REQUIRED: {paidOrdersCount} customer orders awaiting pick & dispatch at Geelong and Werribee depots.</span>
            </div>
            <button
              onClick={() => setActiveTab('picker')}
              className="bg-[#E21C21] hover:bg-red-700 text-white font-black px-3 py-1 rounded uppercase text-[11px]"
            >
              Open Picker View
            </button>
          </div>
        )}

        {/* Quick Workflows Launchpad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Products & Bulk Edit */}
          <div 
            onClick={() => setActiveTab('products')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTab === 'products' 
                ? 'bg-neutral-900 border-[#FFD400] shadow-lg scale-[1.01]' 
                : 'bg-neutral-900/60 border-neutral-800 hover:border-yellow-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFD400] text-[#111111] flex items-center justify-center font-black">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-tight">
                    Products & Bulk Edit
                  </h3>
                  <span className="text-[11px] text-[#FFD400] font-bold">
                    {products.length} Active Items • Multi-Select Ready
                  </span>
                </div>
              </div>
              <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                activeTab === 'products' ? 'bg-[#FFD400] text-[#111111]' : 'bg-neutral-800 text-gray-300'
              }`}>
                {activeTab === 'products' ? 'ACTIVE' : 'VIEW'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Select multiple items, batch assign categories & departments, apply price markups, or toggle clearance.
            </p>
          </div>

          {/* Card 2: AI Import Centre */}
          <div 
            onClick={() => setActiveTab('import-centre')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTab === 'import-centre' 
                ? 'bg-neutral-900 border-emerald-500 shadow-lg scale-[1.01]' 
                : 'bg-neutral-900/60 border-neutral-800 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-tight">
                    AI Import Centre
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    CSV • Photos • Barcodes • eBay
                  </span>
                </div>
              </div>
              <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                activeTab === 'import-centre' ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-gray-300'
              }`}>
                {activeTab === 'import-centre' ? 'ACTIVE' : 'VIEW'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Ingest product batches from spreadsheets, photo folders, and eBay with automatic duplicate protection.
            </p>
          </div>

          {/* Card 3: AI Listing Studio */}
          <div 
            onClick={() => setActiveTab('ai-listing')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTab === 'ai-listing' 
                ? 'bg-neutral-900 border-purple-500 shadow-lg scale-[1.01]' 
                : 'bg-neutral-900/60 border-neutral-800 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center font-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white uppercase tracking-tight">
                    AI Listing Studio
                  </h3>
                  <span className="text-[11px] text-purple-400 font-bold">
                    eBay Ready • AUD Valuations
                  </span>
                </div>
              </div>
              <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                activeTab === 'ai-listing' ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-gray-300'
              }`}>
                {activeTab === 'ai-listing' ? 'ACTIVE' : 'VIEW'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Analyze product photos to identify MPN, research sold prices, and create finished eBay listings.
            </p>
          </div>
        </div>

        {/* Command Navigation Tabs */}
        <div className="flex border-b border-neutral-700 overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 'products', label: `🏷️ Products & Bulk Edit (${products.length})`, icon: Layers, highlight: true },
            { id: 'create-product', label: '➕ Create Product', icon: Plus, highlight: true },
            { id: 'import-centre', label: '📥 AI Import Centre', icon: FileSpreadsheet },
            { id: 'ai-listing', label: '✨ AI Listing Studio', icon: Sparkles },
            { id: 'kpi', label: '📊 Command Overview', icon: BarChart3 },
            { id: 'sheets', label: '📄 Google Sheets & Drive', icon: FileSpreadsheet },
            { id: 'calendar', label: '📅 Warehouse Calendar', icon: Calendar },
            { id: 'picker', label: `📦 Pick & Pack (${paidOrdersCount})`, icon: Package },
            { id: 'stocktake', label: '📷 Barcode Stocktake', icon: QrCode },
            { id: 'ai-profit', label: '🤖 AI Profit Intel', icon: Bot },
            { id: 'ebay', label: '🛍️ eBay Sync', icon: ShoppingBag },
            { id: 'database', label: '🗄️ PostgreSQL / Supabase', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 rounded-t-lg text-xs sm:text-sm font-black uppercase whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#111111] text-[#FFD400] border-t-2 border-x border-[#FFD400]'
                    : 'text-gray-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: KPI Command Overview */}
        {activeTab === 'kpi' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 shadow">
                <div className="text-xs font-bold text-gray-400 uppercase">Today's Gross Sales</div>
                <div className="text-2xl sm:text-3xl font-black text-[#FFD400] mt-1">
                  ${(profitStats?.todayRevenue || totalRevenue).toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last week
                </div>
              </div>

              <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 shadow">
                <div className="text-xs font-bold text-gray-400 uppercase">Estimated Gross Profit</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  ${(profitStats?.grossProfit || (totalRevenue * 0.42)).toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 font-semibold mt-1">
                  42.8% Average Commercial Margin
                </div>
              </div>

              <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 shadow">
                <div className="text-xs font-bold text-gray-400 uppercase">Awaiting Warehouse Pick</div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {paidOrdersCount}
                </div>
                <div className="text-[11px] text-amber-400 font-bold mt-1">
                  Target SLA: &lt; 2 Hours
                </div>
              </div>

              <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 shadow">
                <div className="text-xs font-bold text-gray-400 uppercase">Low Stock Alerts</div>
                <div className="text-2xl sm:text-3xl font-black text-[#E21C21] mt-1">
                  {lowStockCount}
                </div>
                <div className="text-[11px] text-gray-400 font-semibold mt-1">
                  Items with &le; 5 units remaining
                </div>
              </div>
            </div>

            {/* Department Breakdown & Top Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Profit Performance */}
              <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="font-black text-sm uppercase text-white">Department Margins & Volume</h3>
                  <span className="text-xs font-bold text-[#FFD400]">Weekly Snapshot</span>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { name: 'Automotive & 4WD Parts', revenue: '$3,820', margin: '48%', color: 'bg-emerald-500' },
                    { name: 'Workshop & Tradie Tools', revenue: '$2,940', margin: '44%', color: 'bg-[#FFD400]' },
                    { name: 'Electronics & Fast Chargers', revenue: '$1,680', margin: '39%', color: 'bg-blue-500' },
                    { name: 'Clearance & Liquidations', revenue: '$1,210', margin: '56%', color: 'bg-[#E21C21]' }
                  ].map(dep => (
                    <div key={dep.name} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-200">{dep.name}</span>
                        <span className="text-gray-400">{dep.revenue} (Margin: {dep.margin})</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${dep.color}`} style={{ width: dep.margin }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick AI Intelligence Card */}
              <div className="bg-[#111111] p-5 rounded-xl border-2 border-[#FFD400] space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFD400]" />
                    <h3 className="font-black text-sm uppercase text-white">AI Commercial Advice</h3>
                  </div>
                  <span className="bg-[#E21C21] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">LIVE</span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {products.length > 0
                    ? `Catalogue contains ${products.length} active SKUs. Run full profit analysis to evaluate turnover velocity and discount strategies.`
                    : 'Inventory is currently empty. Use the AI Listing Studio or Bulk Ingestion to add stock and activate automated real-time margin suggestions.'}
                </p>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setActiveTab('ai-profit')}
                    className="bg-[#FFD400] text-[#111111] font-black text-xs px-4 py-2 rounded uppercase"
                  >
                    Run Full Profit Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Create Product Page */}
        {activeTab === 'create-product' && (
          <CreateProductPage
            onBack={() => setActiveTab('products')}
            onProductCreated={() => {
              setActiveTab('products');
              refreshProducts();
            }}
          />
        )}

        {/* TAB: Product Import & AI Listing Centre */}
        {activeTab === 'import-centre' && (
          <ProductImportCentre 
            allProducts={products} 
            onProductsUpdated={() => refreshProducts()} 
          />
        )}

        {/* TAB: Google Sheets & Drive Hub */}
        {activeTab === 'sheets' && <GoogleSheetsHub />}

        {/* TAB: Google Calendar & Warehouse Scheduling */}
        {activeTab === 'calendar' && <GoogleCalendarHub />}

        {/* TAB: PostgreSQL / Supabase Architecture */}
        {activeTab === 'database' && <SupabaseArchitectureTab />}

        {/* TAB: eBay Multi-Channel Engine */}
        {activeTab === 'ebay' && <EbaySyncTab />}

        {/* TAB 2: Warehouse Picker View */}
        {activeTab === 'picker' && <WarehousePicker />}

        {/* TAB 3: Stocktake & Barcode Scanner */}
        {activeTab === 'stocktake' && <StocktakeScanner />}

        {/* TAB 4: AI Listing Creator */}
        {activeTab === 'ai-listing' && <AiListingCreator />}

        {/* TAB 5: AI Profit & Commercial Intelligence */}
        {activeTab === 'ai-profit' && <AiProfitIntelligence />}

        {/* TAB 6: Products & Catalogue Table */}
        {activeTab === 'products' && (
          <div className="bg-[#111111] p-4 sm:p-6 rounded-xl border border-neutral-800 space-y-4 animate-in fade-in">
            {/* Feedback notification */}
            {statusFeedback && (
              <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-lg animate-in slide-in-from-top">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{statusFeedback}</span>
                </div>
                <button onClick={() => setStatusFeedback(null)} className="text-emerald-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {/* Header & Main Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl uppercase text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#FFD400]" />
                    <span>Warehouse Inventory & Bulk Editor</span>
                  </h3>
                  <span className="bg-[#FFD400] text-[#111111] text-xs px-2.5 py-0.5 rounded-full font-mono font-black">
                    {filteredProducts.length} {filteredProducts.length !== products.length ? `of ${products.length}` : 'Items'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  Manage categories, calculate commercial markups, update warehouse bins, and modify clearance status across multiple products at once.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ExportToSheetButton
                  type="inventory"
                  data={products}
                  label="Export to Sheets"
                />
                <button
                  onClick={() => setActiveTab('create-product')}
                  className="bg-[#FFD400] text-[#111111] font-black text-xs px-3.5 py-2 rounded-lg uppercase hover:bg-yellow-400 transition-colors flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Create Product</span>
                </button>
              </div>
            </div>

            {/* 3-STEP QUICK BULK EDIT GUIDE BANNER */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-neutral-700 p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-black uppercase text-[#FFD400] flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>How to Bulk Edit in 3 Quick Steps:</span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">Real-time Batch Sync</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-300 text-[11px]">
                <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFD400] text-black font-black flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <div>
                    <strong className="text-white block">Select Target Items</strong>
                    <span>Tick boxes on items below or click <em>"Select All ({filteredProducts.length})"</em>.</span>
                  </div>
                </div>
                <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFD400] text-black font-black flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <div>
                    <strong className="text-white block">Click "⚡ Bulk Edit"</strong>
                    <span>Or use the <em>"Quick Assign Category"</em> dropdown for instant 1-click updates.</span>
                  </div>
                </div>
                <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFD400] text-black font-black flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <div>
                    <strong className="text-white block">Set Values & Apply</strong>
                    <span>Choose new Department, Price Markup (+10%, ×2.0), Bin, or Condition.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by title, SKU, brand, barcode, bin..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFD400]"
                  />
                </div>

                {/* Department Filter */}
                <select
                  value={catalogDeptFilter}
                  onChange={e => setCatalogDeptFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#FFD400]"
                >
                  <option value="all">All Departments ({products.length})</option>
                  {INITIAL_DEPARTMENTS.map(d => (
                    <option key={d.slug} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Condition Filter */}
                <select
                  value={catalogConditionFilter}
                  onChange={e => setCatalogConditionFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#FFD400]"
                >
                  <option value="all">All Conditions</option>
                  <option value="Brand New">Brand New</option>
                  <option value="Open Box">Open Box</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Good Used">Good Used</option>
                  <option value="For Parts or Not Working">For Parts</option>
                </select>
              </div>

              {(catalogSearch || catalogDeptFilter !== 'all' || catalogConditionFilter !== 'all') && (
                <button
                  onClick={() => {
                    setCatalogSearch('');
                    setCatalogDeptFilter('all');
                    setCatalogConditionFilter('all');
                  }}
                  className="text-gray-400 hover:text-white text-xs underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* BATCH ACTION CONTROLS */}
            <div className={`p-3.5 rounded-xl border-2 transition-all flex flex-wrap items-center justify-between gap-3 text-xs shadow-md ${
              selectedProductIds.length > 0 
                ? 'bg-neutral-900 border-[#FFD400] ring-2 ring-[#FFD400]/20' 
                : 'bg-[#14161A] border-neutral-800'
            }`}>
              <div className="flex items-center gap-3 text-gray-300">
                <label className="flex items-center gap-2 font-black cursor-pointer select-none bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-700 hover:border-gray-500">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-[#FFD400]"
                  />
                  <span className="text-white">Select All ({filteredProducts.length})</span>
                </label>
                <span className="text-gray-600">|</span>
                <span className="text-xs">
                  Selected: <strong className="text-[#FFD400] text-sm px-1.5 py-0.5 bg-neutral-950 rounded border border-neutral-700 font-mono">{selectedProductIds.length}</strong> items
                </span>
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={() => setSelectedProductIds([])}
                    className="text-[11px] text-gray-400 hover:text-white underline font-semibold"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Primary Bulk Edit Modal Trigger */}
                <button
                  onClick={() => setIsBulkEditModalOpen(true)}
                  disabled={isBulkSubmitting}
                  className={`px-4 py-2 bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black rounded-lg flex items-center gap-1.5 text-xs uppercase shadow transition-all active:scale-95 disabled:opacity-50 ${
                    selectedProductIds.length > 0 ? 'animate-pulse ring-2 ring-yellow-400' : ''
                  }`}
                  title="Bulk batch update categories, pricing formulas, condition, and location"
                >
                  <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                  <span>⚡ Bulk Edit ({selectedProductIds.length > 0 ? selectedProductIds.length : 'All Filtered'})</span>
                </button>

                {/* Quick Department / Category Assign Dropdown */}
                <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-gray-500">
                  <Tag className="w-3.5 h-3.5 text-[#FFD400]" />
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleQuickAssignDepartment(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    disabled={isBulkSubmitting}
                    className="bg-transparent text-gray-200 text-xs font-bold focus:outline-none cursor-pointer pr-2"
                  >
                    <option value="" disabled>Quick Assign Category...</option>
                    {INITIAL_DEPARTMENTS.map(dept => (
                      <option key={dept.slug} value={dept.slug} className="bg-neutral-900 text-white">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Clearance Mark */}
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={() => handleApplyBulkUpdate({ isClearance: true })}
                    disabled={isBulkSubmitting}
                    className="px-3 py-1.5 bg-[#E21C21]/20 hover:bg-[#E21C21]/30 text-[#E21C21] font-bold rounded-lg border border-[#E21C21]/50 flex items-center gap-1 text-xs"
                    title="Mark selected as Clearance"
                  >
                    Mark Clearance
                  </button>
                )}

                {/* Delete Selected */}
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkSubmitting}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 font-bold rounded-lg border border-red-800 flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                    title="Delete selected items from inventory"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Delete ({selectedProductIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Data Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-800 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded accent-[#FFD400]"
                      />
                    </th>
                    <th className="p-3">Item / SKU / Brand</th>
                    <th className="p-3">Department & Category</th>
                    <th className="p-3">Condition</th>
                    <th className="p-3">Warehouse Bin</th>
                    <th className="p-3 text-right">Cost ($)</th>
                    <th className="p-3 text-right">Sell Price ($)</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-500">
                        No products match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const isSelected = selectedProductIds.includes(p.id);
                      
                      // Department color badge helper
                      let deptColor = 'bg-blue-950 text-blue-300 border-blue-800';
                      if (p.department.includes('Auto')) deptColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                      else if (p.department.includes('Tool')) deptColor = 'bg-amber-950 text-amber-300 border-amber-800';
                      else if (p.department.includes('Home')) deptColor = 'bg-purple-950 text-purple-300 border-purple-800';
                      else if (p.department.includes('DVD') || p.department.includes('Gaming')) deptColor = 'bg-pink-950 text-pink-300 border-pink-800';
                      else if (p.department.includes('Clearance')) deptColor = 'bg-red-950 text-red-300 border-red-800';

                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-neutral-800/60 transition-colors ${
                            isSelected ? 'bg-neutral-800/90 border-l-4 border-l-[#FFD400]' : ''
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(p.id)}
                              className="w-3.5 h-3.5 rounded accent-[#FFD400]"
                            />
                          </td>

                          {/* Title / SKU / Brand */}
                          <td className="p-3">
                            <div className="font-bold text-white line-clamp-1">{p.title}</div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span className="text-white font-semibold">{p.brand}</span>
                              <span>•</span>
                              <span className="font-mono text-gray-400">SKU: {p.sku}</span>
                              {p.barcode && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-gray-500">BC: {p.barcode}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Department & Category */}
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${deptColor}`}>
                              {p.department}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.category || 'General'}</div>
                          </td>

                          {/* Condition */}
                          <td className="p-3">
                            <span className="bg-neutral-900 border border-neutral-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium">
                              {p.condition}
                            </span>
                          </td>

                          {/* Bin Location */}
                          <td className="p-3 font-mono font-bold text-[#FFD400]">
                            {p.warehouseLocation || (p as any).locationBin || 'Bay A1'}
                          </td>

                          {/* Cost */}
                          <td className="p-3 font-mono text-gray-400 text-right">
                            ${(Number(p.costPrice) || 0).toFixed(2)}
                          </td>

                          {/* Sell Price */}
                          <td className="p-3 font-mono font-bold text-white text-right">
                            ${(Number(p.price) || 0).toFixed(2)}
                          </td>

                          {/* Stock */}
                          <td className="p-3 font-bold text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              p.stock <= 3 ? 'bg-red-950/80 text-[#E21C21] border border-red-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            }`}>
                              {p.stock} units
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            {p.isClearance ? (
                              <span className="bg-[#E21C21] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                CLEARANCE
                              </span>
                            ) : p.isHotDeal ? (
                              <span className="bg-[#FFD400] text-[#111111] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                HOT DEAL
                              </span>
                            ) : (
                              <span className="bg-emerald-950 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-800">
                                ACTIVE
                              </span>
                            )}
                          </td>

                          {/* Quick 1-Item Actions */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedProductIds([p.id]);
                                setIsBulkEditModalOpen(true);
                              }}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white rounded text-[11px] font-bold transition-colors"
                              title="Edit this item"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bulk Edit Modal for Catalogue */}
            {isBulkEditModalOpen && (
              <BulkEditModal
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                itemCount={selectedProductIds.length > 0 ? selectedProductIds.length : filteredProducts.length}
                itemTypeLabel="catalogue products"
                onApply={handleApplyBulkUpdate}
                isSubmitting={isBulkSubmitting}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
