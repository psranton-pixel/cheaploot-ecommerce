import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Sparkles, Trash2, Edit3, Eye, 
  Layers, ArrowUpRight, Search, Filter, ShieldCheck, Check,
  AlertCircle, ChevronDown, Wand2, Tag, DollarSign, RefreshCw,
  GitMerge, HelpCircle, SlidersHorizontal, MapPin
} from 'lucide-react';
import { ImportDraftProduct, Product, DuplicateMatchInfo } from '../../../types';
import { INITIAL_DEPARTMENTS } from '../../../data/mockData';
import { ProductMergeModal } from './ProductMergeModal';
import { BulkEditModal, BulkUpdatePayload } from '../Common/BulkEditModal';

interface Props {
  drafts: ImportDraftProduct[];
  allProducts: Product[];
  onUpdateDraft: (index: number, updated: ImportDraftProduct) => void;
  onRemoveDraft: (index: number) => void;
  onCommitBatch: (approvedDrafts: ImportDraftProduct[]) => void;
  isPublishing: boolean;
}

export const BulkReviewGrid: React.FC<Props> = ({
  drafts,
  allProducts,
  onUpdateDraft,
  onRemoveDraft,
  onCommitBatch,
  isPublishing
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'needs_review' | 'duplicates' | 'errors'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [activeMergeProduct, setActiveMergeProduct] = useState<{
    master: Partial<Product>;
    duplicates: DuplicateMatchInfo[];
  } | null>(null);

  // Filtered drafts list
  const filteredItems = drafts
    .map((draft, originalIndex) => ({ draft, originalIndex }))
    .filter(({ draft }) => {
      // Tab filter
      if (filterTab === 'ready' && draft.status !== 'ready_to_publish') return false;
      if (filterTab === 'needs_review' && draft.status !== 'needs_review') return false;
      if (filterTab === 'duplicates' && (!draft.possibleDuplicates || draft.possibleDuplicates.length === 0)) return false;
      if (filterTab === 'errors' && draft.status !== 'error') return false;

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          draft.title.toLowerCase().includes(q) ||
          draft.sku.toLowerCase().includes(q) ||
          draft.brand.toLowerCase().includes(q) ||
          (draft.barcode && draft.barcode.includes(q))
        );
      }
      return true;
    });

  const allFilteredSelected = filteredItems.length > 0 && 
    filteredItems.every(({ originalIndex }) => selectedIndices.includes(originalIndex));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(filteredItems.map(f => f.originalIndex));
    }
  };

  const toggleSelectOne = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  // Apply comprehensive bulk updates
  const handleApplyBulkUpdate = (payload: BulkUpdatePayload) => {
    const targets = selectedIndices.length > 0 ? selectedIndices : drafts.map((_, i) => i);
    targets.forEach(idx => {
      const d = { ...drafts[idx] };

      if (payload.department) d.department = payload.department;
      if (payload.category) d.category = payload.category;
      if (payload.condition) d.condition = payload.condition;
      if (payload.warehouseLocation) d.warehouseLocation = payload.warehouseLocation;
      if (payload.brand) d.brand = payload.brand;

      // Pricing logic
      if (payload.priceAdjustmentType === 'fixed' && typeof payload.priceValue === 'number') {
        d.price = payload.priceValue;
        d.suggestedPrice = payload.priceValue;
      } else if (payload.priceAdjustmentType === 'percent_increase' && typeof payload.priceValue === 'number') {
        d.price = Number((d.price * (1 + payload.priceValue / 100)).toFixed(2));
      } else if (payload.priceAdjustmentType === 'percent_decrease' && typeof payload.priceValue === 'number') {
        d.price = Math.max(0.99, Number((d.price * (1 - payload.priceValue / 100)).toFixed(2)));
      } else if (payload.priceAdjustmentType === 'margin_markup' && typeof payload.priceValue === 'number') {
        const cost = d.costPrice > 0 ? d.costPrice : 10;
        d.price = Number((cost * payload.priceValue).toFixed(2));
        d.suggestedPrice = d.price;
      }

      if (payload.roundTo95) {
        d.price = Math.floor(d.price) + 0.95;
      }

      // Cost price
      if (payload.costPriceAdjustmentType === 'fixed' && typeof payload.costPriceValue === 'number') {
        d.costPrice = payload.costPriceValue;
      } else if (payload.costPriceAdjustmentType === 'percent_increase' && typeof payload.costPriceValue === 'number') {
        d.costPrice = Number((d.costPrice * (1 + payload.costPriceValue / 100)).toFixed(2));
      } else if (payload.costPriceAdjustmentType === 'percent_decrease' && typeof payload.costPriceValue === 'number') {
        d.costPrice = Math.max(0, Number((d.costPrice * (1 - payload.costPriceValue / 100)).toFixed(2)));
      }

      // Draft status
      if (payload.draftStatus === 'ready_to_publish') {
        d.status = 'ready_to_publish';
        if (d.confidence) d.confidence.requiresManualConfirmation = false;
      } else if (payload.draftStatus === 'needs_review') {
        d.status = 'needs_review';
      }

      onUpdateDraft(idx, d);
    });

    setIsBulkEditModalOpen(false);
  };

  // Quick 1-click Department & Category assignment
  const handleQuickAssignDepartment = (deptSlug: string) => {
    const dept = INITIAL_DEPARTMENTS.find(d => d.slug === deptSlug);
    if (!dept) return;

    const targets = selectedIndices.length > 0 ? selectedIndices : drafts.map((_, i) => i);
    targets.forEach(idx => {
      const d = { ...drafts[idx] };
      d.department = dept.name;
      if (dept.subcategories && dept.subcategories.length > 0) {
        d.category = dept.subcategories[0].name;
      }
      onUpdateDraft(idx, d);
    });
  };

  // Mass Actions
  const handleMassAction = (action: 'normalize' | 'approve' | 'suggest_price' | 'delete') => {
    const targets = selectedIndices.length > 0 ? selectedIndices : drafts.map((_, i) => i);
    
    if (action === 'delete') {
      if (!window.confirm(`Remove ${targets.length} drafts from import staging?`)) return;
      // Remove in descending index order so indices don't shift
      const sorted = [...targets].sort((a, b) => b - a);
      sorted.forEach(idx => onRemoveDraft(idx));
      setSelectedIndices([]);
      return;
    }

    targets.forEach(idx => {
      const d = { ...drafts[idx] };
      if (action === 'approve') {
        if (!d.validationErrors || d.validationErrors.length === 0) {
          d.status = 'ready_to_publish';
          if (d.confidence) d.confidence.requiresManualConfirmation = false;
        }
      } else if (action === 'normalize') {
        d.title = d.title.replace(/\s+/g, ' ').trim();
        d.brand = d.brand.trim();
      } else if (action === 'suggest_price') {
        if (d.costPrice > 0) {
          d.price = Number((d.costPrice * 2.2).toFixed(2));
          d.suggestedPrice = d.price;
        }
      }
      onUpdateDraft(idx, d);
    });
  };

  const readyToPublishCount = drafts.filter(d => d.status === 'ready_to_publish').length;
  const needsReviewCount = drafts.filter(d => d.status === 'needs_review').length;
  const errorCount = drafts.filter(d => d.status === 'error').length;
  const duplicateCount = drafts.filter(d => d.possibleDuplicates && d.possibleDuplicates.length > 0).length;

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors whitespace-nowrap ${filterTab === 'all' ? 'bg-[#FFD400] text-black font-black' : 'text-gray-400 hover:text-white'}`}
          >
            All Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setFilterTab('ready')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${filterTab === 'ready' ? 'bg-emerald-500 text-black font-black' : 'text-emerald-400 hover:bg-neutral-800'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to Publish ({readyToPublishCount})
          </button>
          <button
            onClick={() => setFilterTab('needs_review')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${filterTab === 'needs_review' ? 'bg-yellow-500 text-black font-black' : 'text-yellow-400 hover:bg-neutral-800'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Review ({needsReviewCount})
          </button>
          <button
            onClick={() => setFilterTab('duplicates')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${filterTab === 'duplicates' ? 'bg-purple-500 text-white font-black' : 'text-purple-400 hover:bg-neutral-800'}`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            Duplicates ({duplicateCount})
          </button>
          {errorCount > 0 && (
            <button
              onClick={() => setFilterTab('errors')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${filterTab === 'errors' ? 'bg-red-500 text-white font-black' : 'text-red-400 hover:bg-neutral-800'}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Errors ({errorCount})
            </button>
          )}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search title, SKU, barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFD400] w-56"
            />
          </div>

          <button
            disabled={isPublishing || readyToPublishCount === 0}
            onClick={() => {
              const approved = drafts.filter(d => d.status === 'ready_to_publish');
              onCommitBatch(approved);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            {isPublishing ? 'Publishing...' : `Publish Approved (${readyToPublishCount})`}
          </button>
        </div>
      </div>

      {/* Enhanced Multi-Select Mass Action Toolbar */}
      <div className="bg-neutral-900/90 border-2 border-neutral-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3 text-gray-300">
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-[#FFD400]"
            />
            <span>Select All Filtered ({filteredItems.length})</span>
          </label>
          <span className="text-gray-600">|</span>
          <span>Selected: <strong className="text-[#FFD400] text-sm">{selectedIndices.length}</strong> of {drafts.length}</span>
          {selectedIndices.length > 0 && (
            <button
              onClick={() => setSelectedIndices([])}
              className="text-[11px] text-gray-400 hover:text-white underline"
            >
              Clear Selection
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY: Bulk Edit Modal Button */}
          <button
            onClick={() => setIsBulkEditModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black rounded-lg flex items-center gap-1.5 text-xs uppercase shadow transition-all hover:scale-105 active:scale-95"
            title="Open Bulk Batch Editor for Selected Items"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Bulk Edit ({selectedIndices.length > 0 ? selectedIndices.length : 'All'})</span>
          </button>

          {/* Quick Department / Category Assign Dropdown */}
          <div className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-700">
            <Tag className="w-3.5 h-3.5 text-[#FFD400]" />
            <select
              onChange={e => {
                if (e.target.value) {
                  handleQuickAssignDepartment(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
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

          <button
            onClick={() => handleMassAction('approve')}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 font-bold rounded-lg border border-neutral-700 flex items-center gap-1 text-[11px]"
            title="Approve all valid selected drafts as Ready to Publish"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Approve
          </button>

          <button
            onClick={() => handleMassAction('normalize')}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold rounded-lg border border-neutral-700 flex items-center gap-1 text-[11px]"
            title="Clean whitespace and brand casing"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-400" />
            Clean Text
          </button>

          <button
            onClick={() => handleMassAction('suggest_price')}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[#FFD400] font-bold rounded-lg border border-neutral-700 flex items-center gap-1 text-[11px]"
            title="Auto calculate 120% margin from cost price"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Auto Margin
          </button>

          {selectedIndices.length > 0 && (
            <button
              onClick={() => handleMassAction('delete')}
              className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 font-bold rounded-lg border border-red-800 flex items-center gap-1 text-[11px] transition-colors"
              title="Delete selected items from staging"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Delete ({selectedIndices.length})
            </button>
          )}
        </div>
      </div>

      {/* High Speed Bulk Table */}
      <div className="bg-[#111111] rounded-xl border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-800/90 text-gray-400 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded accent-[#FFD400]"
                  />
                </th>
                <th className="p-3 w-16">Image</th>
                <th className="p-3">Title & Classification</th>
                <th className="p-3 w-28">SKU / Barcode</th>
                <th className="p-3 w-28">Condition</th>
                <th className="p-3 w-20">Cost ($)</th>
                <th className="p-3 w-20">Price ($)</th>
                <th className="p-3 w-16">Stock</th>
                <th className="p-3 w-24">Location</th>
                <th className="p-3 w-24">Quality</th>
                <th className="p-3 w-32">Status / Duplicates</th>
                <th className="p-3 w-12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-gray-200">
              {filteredItems.map(({ draft, originalIndex }) => {
                const isSelected = selectedIndices.includes(originalIndex);
                const hasDuplicates = draft.possibleDuplicates && draft.possibleDuplicates.length > 0;
                const hasErrors = draft.validationErrors && draft.validationErrors.length > 0;

                return (
                  <tr 
                    key={draft.id} 
                    className={`hover:bg-neutral-800/40 transition-colors ${isSelected ? 'bg-neutral-800/70 border-l-4 border-l-[#FFD400]' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(originalIndex)}
                        className="w-3.5 h-3.5 rounded accent-[#FFD400]"
                      />
                    </td>

                    {/* Image Thumbnail */}
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center relative">
                        {draft.images && draft.images.length > 0 ? (
                          <img
                            src={draft.images[0]}
                            alt={draft.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-gray-500 font-mono">No Img</span>
                        )}
                        {draft.images && draft.images.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-bold px-1 rounded-tl text-white">
                            +{draft.images.length - 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Classification */}
                    <td className="p-3 space-y-1">
                      <input
                        type="text"
                        value={draft.title}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, title: e.target.value })}
                        className="w-full bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-[#FFD400] text-white font-bold text-xs py-0.5 focus:outline-none"
                      />
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="text-white font-semibold">{draft.brand}</span>
                        <span>•</span>
                        <span className="text-[#FFD400] font-semibold">{draft.category}</span>
                        <span>•</span>
                        <span className="font-mono text-gray-500">{draft.department}</span>
                      </div>
                      {draft.defectsDetected && draft.defectsDetected.length > 0 && (
                        <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Defect: {draft.defectsDetected.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* SKU / Barcode */}
                    <td className="p-3 font-mono text-[11px] space-y-1">
                      <input
                        type="text"
                        value={draft.sku}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, sku: e.target.value.toUpperCase() })}
                        className="w-full bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-white font-bold focus:outline-none focus:border-[#FFD400]"
                      />
                      <div className="text-[10px] text-gray-500">
                        {draft.barcode ? `BC: ${draft.barcode}` : 'No Barcode'}
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="p-3">
                      <select
                        value={draft.condition}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, condition: e.target.value as any })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#FFD400]"
                      >
                        <option value="Brand New">Brand New</option>
                        <option value="Open Box">Open Box</option>
                        <option value="Refurbished">Refurbished</option>
                        <option value="Good Used">Good Used</option>
                        <option value="For Parts or Not Working">For Parts</option>
                      </select>
                    </td>

                    {/* Cost */}
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        value={draft.costPrice}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, costPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-gray-300 rounded px-1.5 py-1 text-xs text-right font-mono focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>

                    {/* Price */}
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        value={draft.price}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-emerald-400 font-bold rounded px-1.5 py-1 text-xs text-right font-mono focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>

                    {/* Stock */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={draft.stock}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-bold rounded px-1.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>

                    {/* Warehouse Location */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={draft.warehouseLocation || ''}
                        onChange={e => onUpdateDraft(originalIndex, { ...draft, warehouseLocation: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-gray-300 rounded px-1.5 py-1 text-[11px] font-mono focus:outline-none focus:border-[#FFD400]"
                        placeholder="W1-A-01"
                      />
                    </td>

                    {/* Quality Completeness Score */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${draft.qualityCompletenessScore >= 80 ? 'bg-emerald-400' : draft.qualityCompletenessScore >= 60 ? 'bg-[#FFD400]' : 'bg-red-400'}`}
                            style={{ width: `${draft.qualityCompletenessScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{draft.qualityCompletenessScore}%</span>
                      </div>
                      {draft.confidence && (
                        <div className="text-[9px] text-gray-500 font-mono">
                          AI: {draft.confidence.overall}%
                        </div>
                      )}
                    </td>

                    {/* Status & Duplicates */}
                    <td className="p-3 space-y-1">
                      {draft.status === 'ready_to_publish' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                      {draft.status === 'needs_review' && (
                        <span className="inline-flex items-center gap-1 bg-yellow-950/80 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-800">
                          <AlertTriangle className="w-3 h-3" />
                          Review Required
                        </span>
                      )}
                      {draft.status === 'error' && (
                        <span className="inline-flex items-center gap-1 bg-red-950/80 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-800">
                          <AlertCircle className="w-3 h-3" />
                          {draft.validationErrors?.[0] || 'Error'}
                        </span>
                      )}

                      {/* Duplicate resolution selector */}
                      {hasDuplicates && (
                        <div className="flex items-center gap-1 mt-1">
                          <select
                            value={draft.duplicateResolution || 'update_existing'}
                            onChange={e => onUpdateDraft(originalIndex, { ...draft, duplicateResolution: e.target.value as any })}
                            className="bg-neutral-900 border border-purple-800/80 text-purple-300 rounded text-[9px] px-1 py-0.5 focus:outline-none"
                          >
                            <option value="update_existing">Update Existing</option>
                            <option value="use_existing">Use Existing (Add Stock)</option>
                            <option value="create_separate">Create Separate SKU</option>
                            <option value="skip">Skip Record</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setActiveMergeProduct({ master: draft, duplicates: draft.possibleDuplicates! })}
                            className="p-1 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded border border-purple-800 text-[9px]"
                            title="Open Advanced Merge Tool"
                          >
                            <GitMerge className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onRemoveDraft(originalIndex)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove from batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          itemCount={selectedIndices.length > 0 ? selectedIndices.length : drafts.length}
          itemTypeLabel="staged drafts"
          showDraftStatus={true}
          onApply={handleApplyBulkUpdate}
        />
      )}

      {/* Duplicate Merge Modal */}
      {activeMergeProduct && (
        <ProductMergeModal
          masterProduct={activeMergeProduct.master}
          duplicates={activeMergeProduct.duplicates}
          allProducts={allProducts}
          onClose={() => setActiveMergeProduct(null)}
          onMerged={() => {
            setActiveMergeProduct(null);
          }}
        />
      )}
    </div>
  );
};
