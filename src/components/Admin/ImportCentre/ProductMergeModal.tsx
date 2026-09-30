import React, { useState } from 'react';
import { GitMerge, X, AlertTriangle, Check, Package, ArrowRight } from 'lucide-react';
import { Product, DuplicateMatchInfo } from '../../../types';

interface Props {
  masterProduct: Partial<Product>;
  duplicates: DuplicateMatchInfo[];
  allProducts: Product[];
  onClose: () => void;
  onMerged: (updatedProducts: Product[]) => void;
}

export const ProductMergeModal: React.FC<Props> = ({
  masterProduct,
  duplicates,
  allProducts,
  onClose,
  onMerged
}) => {
  const [selectedMasterId, setSelectedMasterId] = useState<string>(
    masterProduct.id || duplicates[0]?.existingProductId || ''
  );
  const [mergeInventory, setMergeInventory] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find master product object
  const masterObj = allProducts.find(p => p.id === selectedMasterId) || masterProduct;
  const duplicateProducts = allProducts.filter(p => 
    p.id !== selectedMasterId && duplicates.some(d => d.existingProductId === p.id)
  );

  const totalCalculatedStock = (Number(masterObj.stock) || 0) + 
    (mergeInventory ? duplicateProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0) : 0);

  const handleExecuteMerge = async () => {
    if (!selectedMasterId) return;
    setIsMerging(true);
    setError(null);

    try {
      const dupIds = duplicateProducts.map(p => p.id);
      const res = await fetch('/api/import/merge-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProductId: selectedMasterId,
          duplicateProductIds: dupIds,
          mergeInventory
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to merge products');
      }

      // Fetch fresh products
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      onMerged(pData.products || []);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Merge failed');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-neutral-700 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#FFD400]/20 flex items-center justify-center text-[#FFD400]">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase">Product Merge & Duplicate Consolidation</h2>
              <p className="text-xs text-gray-400">Consolidate multiple duplicate catalogue records into a single authoritative master SKU</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Master Product Selection */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
            <label className="text-xs font-bold uppercase text-[#FFD400] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Designated Master Product (Source of Truth)
            </label>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 bg-[#181818] border border-emerald-500/50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-black text-sm text-white">{masterObj.title}</div>
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-3 mt-1">
                    <span>SKU: <strong className="text-white">{masterObj.sku}</strong></span>
                    <span>Price: <strong className="text-emerald-400">${masterObj.price}</strong></span>
                    <span>Current Stock: <strong className="text-white">{masterObj.stock}</strong></span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold bg-emerald-950 text-emerald-300 px-2 py-1 rounded border border-emerald-800">
                  Master SKU
                </span>
              </div>
            </div>
          </div>

          {/* Duplicates to be Merged */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
              Duplicate Records to be Merged & Archived ({duplicateProducts.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {duplicateProducts.map(dup => (
                <div key={dup.id} className="p-2.5 bg-[#181818] border border-neutral-800 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-200">{dup.title}</div>
                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-3 mt-0.5">
                      <span>SKU: {dup.sku}</span>
                      <span>Stock: +{dup.stock}</span>
                      <span>Location: {dup.warehouseLocation}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-800 font-mono">
                    Will Archive
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Options */}
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-200">
              <input
                type="checkbox"
                checked={mergeInventory}
                onChange={e => setMergeInventory(e.target.checked)}
                className="w-4 h-4 rounded accent-[#FFD400]"
              />
              <span>Combine and sum inventory quantities into Master Product</span>
            </label>

            <div className="p-3 bg-neutral-800/80 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Total Resulting Stock on Master SKU:</span>
              <span className="font-black text-sm text-[#FFD400]">{totalCalculatedStock} Units</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMerging || duplicateProducts.length === 0}
            onClick={handleExecuteMerge}
            className="px-5 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <GitMerge className="w-4 h-4" />
            {isMerging ? 'Merging Records...' : 'Execute Merge & Update DB'}
          </button>
        </div>
      </div>
    </div>
  );
};
