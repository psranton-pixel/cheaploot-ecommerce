import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, Barcode, CheckCircle2, AlertTriangle, Package, 
  MapPin, Plus, ArrowRight, RefreshCw, Layers, Sparkles,
  Volume2, VolumeX, ShieldCheck, Check
} from 'lucide-react';
import { Product, ImportDraftProduct } from '../../../types';

interface Props {
  onDraftGenerated: (draft: ImportDraftProduct) => void;
  onStockAdjusted?: (product: Product, newStock: number) => void;
}

export const BarcodeIntakeScanner: React.FC<Props> = ({
  onDraftGenerated,
  onStockAdjusted
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('W1-A-01-R1');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    barcode: string;
    type: 'existing_updated' | 'new_draft_created';
    title: string;
    timestamp: string;
    stock: number;
  }>>([]);
  const [activeResult, setActiveResult] = useState<{
    foundInDb: boolean;
    product?: Product;
    draft?: ImportDraftProduct;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick Barcode Examples
  const DEMO_BARCODES = [
    { label: 'Existing Makita Driver (088381826457)', code: '088381826457' },
    { label: 'Existing Philips LED H11 (8719018060303)', code: '8719018060303' },
    { label: 'New DeWalt Impact Socket (5035048644485)', code: '5035048644485' },
    { label: 'New Sony Bluetooth Speaker (4548736112216)', code: '4548736112216' }
  ];

  const handleLookupBarcode = async (codeToLookup: string) => {
    if (!codeToLookup.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setActiveResult(null);

    try {
      const res = await fetch('/api/import/barcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: codeToLookup.trim() })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Barcode scan failed');
      }

      if (data.foundInDb) {
        setActiveResult({
          foundInDb: true,
          product: data.product,
          message: data.message
        });
        setScanHistory(prev => [{
          barcode: codeToLookup,
          type: 'existing_updated',
          title: data.product.title,
          timestamp: new Date().toLocaleTimeString(),
          stock: data.product.stock
        }, ...prev]);
      } else {
        // Apply current active warehouse location to draft
        if (data.draft) {
          data.draft.warehouseLocation = currentLocation;
        }
        setActiveResult({
          foundInDb: false,
          draft: data.draft,
          message: data.message
        });
        setScanHistory(prev => [{
          barcode: codeToLookup,
          type: 'new_draft_created',
          title: data.draft.title,
          timestamp: new Date().toLocaleTimeString(),
          stock: data.draft.stock
        }, ...prev]);
      }

      setBarcodeInput('');
      if (inputRef.current) inputRef.current.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lookup error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Stock Add for existing item
  const handleQuickAddStock = async (product: Product, delta: number) => {
    try {
      const newStock = product.stock + delta;
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: 'W1-GEELONG',
          newStock,
          reason: 'Continuous Barcode Intake (+1 stock)',
          staffName: 'Intake Scanner Admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        product.stock = newStock;
        setActiveResult({
          foundInDb: true,
          product: { ...product, stock: newStock },
          message: `Stock updated to ${newStock} units for ${product.sku}`
        });
        if (onStockAdjusted) onStockAdjusted(product, newStock);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add draft to bulk queue
  const handleAddDraftToQueue = () => {
    if (activeResult?.draft) {
      onDraftGenerated(activeResult.draft);
      setActiveResult(null);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#FFD400]" />
            Continuous Barcode Intake & Warehouse Scanner
          </h2>
          <p className="text-xs text-gray-400">
            Rapid barcode scanner for pallets, crates, and individual items. Checks live PostgreSQL catalogue before auto-generating new AI listings.
          </p>
        </div>

        {/* Location Selector Barcode */}
        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
          <MapPin className="w-4 h-4 text-[#FFD400]" />
          <span className="text-gray-400 font-bold">Active Bin Location:</span>
          <input
            type="text"
            value={currentLocation}
            onChange={e => setCurrentLocation(e.target.value)}
            className="bg-neutral-800 text-white font-mono font-bold text-xs px-2 py-0.5 rounded border border-neutral-700 w-28 focus:outline-none focus:border-[#FFD400]"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Main Scanner Input Box */}
      <div className="bg-neutral-900/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookupBarcode(barcodeInput);
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 absolute left-4 top-3.5 text-[#FFD400]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan or type EAN-13, UPC, SKU, or QR Code..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              className="w-full bg-black/60 border-2 border-neutral-700 focus:border-[#FFD400] text-white font-mono text-base rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing || !barcodeInput.trim()}
            className="px-6 py-3 bg-[#FFD400] hover:bg-[#FFE033] text-black font-black text-xs uppercase rounded-xl flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50"
          >
            <Scan className="w-4 h-4" />
            {isProcessing ? 'Looking up...' : 'Lookup / Intake'}
          </button>
        </form>

        {/* Demo Barcode Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 font-bold">Quick Demo Barcodes:</span>
          {DEMO_BARCODES.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setBarcodeInput(b.code);
                handleLookupBarcode(b.code);
              }}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded border border-neutral-700 font-mono text-[11px] transition-colors"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Scan Result Box */}
      {activeResult && (
        <div className="p-5 rounded-xl border transition-all animate-fadeIn">
          {activeResult.foundInDb && activeResult.product ? (
            /* EXISTING PRODUCT FOUND */
            <div className="bg-[#181818] border-2 border-emerald-500/60 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Product Exists in CheapLoot Database
                </div>
                <span className="text-xs font-mono text-gray-400">
                  Location: <strong className="text-white">{activeResult.product.warehouseLocation}</strong>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={activeResult.product.images[0]}
                  alt={activeResult.product.title}
                  className="w-16 h-16 rounded-lg object-cover border border-neutral-700"
                />
                <div className="space-y-1">
                  <h3 className="font-black text-sm text-white">{activeResult.product.title}</h3>
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-4">
                    <span>SKU: <strong className="text-white">{activeResult.product.sku}</strong></span>
                    <span>Price: <strong className="text-emerald-400">${activeResult.product.price}</strong></span>
                    <span>Current Stock: <strong className="text-[#FFD400] text-sm">{activeResult.product.stock} units</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Stock Intake Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <span className="text-xs font-bold text-gray-400">Rapid Intake:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddStock(activeResult.product!, 1)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> +1 Unit
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddStock(activeResult.product!, 5)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg"
                >
                  +5 Units
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddStock(activeResult.product!, 10)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg"
                >
                  +10 Carton
                </button>
              </div>
            </div>
          ) : activeResult.draft ? (
            /* NEW DRAFT AUTO GENERATED */
            <div className="bg-[#181818] border-2 border-blue-500/60 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase">
                  <Sparkles className="w-4 h-4" />
                  New Item Auto-Catalogued by AI
                </div>
                <span className="text-xs font-mono font-bold text-white bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  Assigned Location: {activeResult.draft.warehouseLocation}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-sm text-white">{activeResult.draft.title}</h3>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-4">
                  <span>Generated SKU: <strong className="text-white">{activeResult.draft.sku}</strong></span>
                  <span>Brand: <strong className="text-white">{activeResult.draft.brand}</strong></span>
                  <span>Suggested Price: <strong className="text-emerald-400">${activeResult.draft.price}</strong></span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{activeResult.draft.shortDescription}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleAddDraftToQueue}
                  className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black font-black text-xs uppercase rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Queue Draft for Review
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Real-time Session Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="text-xs font-bold uppercase text-gray-300 flex items-center justify-between">
            <span>Intake Session Log</span>
            <span className="text-gray-500 font-mono">{scanHistory.length} Scans This Session</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scanHistory.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-400 text-[11px]">{item.timestamp}</span>
                  <span className="font-bold text-white truncate max-w-sm">{item.title}</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-gray-400">{item.barcode}</span>
                  {item.type === 'existing_updated' ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      Stock: {item.stock}
                    </span>
                  ) : (
                    <span className="text-blue-400 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      New AI Draft
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
