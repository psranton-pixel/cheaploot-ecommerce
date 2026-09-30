import React, { useState } from 'react';
import { 
  Layers, X, Check, DollarSign, Tag, MapPin, Sparkles, 
  ShieldCheck, AlertTriangle, ArrowRight, Percent, RefreshCw,
  Truck, Flame
} from 'lucide-react';
import { INITIAL_DEPARTMENTS } from '../../../data/mockData';
import { ProductCondition } from '../../../types';

export interface BulkUpdatePayload {
  department?: string;
  category?: string;
  subCategory?: string;
  condition?: ProductCondition;
  warehouseLocation?: string;
  brand?: string;
  shippingClass?: 'standard' | 'express' | 'bulky' | 'free';
  isClearance?: boolean;
  isSale?: boolean;
  isHotDeal?: boolean;
  // Price adjustments
  priceAdjustmentType?: 'none' | 'fixed' | 'percent_increase' | 'percent_decrease' | 'margin_markup';
  priceValue?: number;
  roundTo95?: boolean;
  // Cost adjustments
  costPriceAdjustmentType?: 'none' | 'fixed' | 'percent_increase' | 'percent_decrease';
  costPriceValue?: number;
  // Draft specific
  draftStatus?: 'ready_to_publish' | 'needs_review' | 'leave_unchanged';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  itemTypeLabel?: string;
  onApply: (payload: BulkUpdatePayload) => void;
  isSubmitting?: boolean;
  showDraftStatus?: boolean;
}

export const BulkEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  itemCount,
  itemTypeLabel = 'items',
  onApply,
  isSubmitting = false,
  showDraftStatus = false
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'pricing' | 'condition_loc' | 'flags'>('categories');

  // Category State
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>('keep_existing');
  const [selectedSubCatName, setSelectedSubCatName] = useState<string>('keep_existing');
  const [customCategory, setCustomCategory] = useState<string>('');

  // Condition & Warehouse
  const [selectedCondition, setSelectedCondition] = useState<string>('keep_existing');
  const [locationValue, setLocationValue] = useState<string>('');
  const [brandValue, setBrandValue] = useState<string>('');
  const [shippingClassValue, setShippingClassValue] = useState<string>('keep_existing');

  // Pricing State
  const [priceAction, setPriceAction] = useState<'none' | 'fixed' | 'percent_increase' | 'percent_decrease' | 'margin_markup'>('none');
  const [priceValue, setPriceValue] = useState<string>('');
  const [roundTo95, setRoundTo95] = useState<boolean>(false);
  const [costAction, setCostAction] = useState<'none' | 'fixed' | 'percent_increase' | 'percent_decrease'>('none');
  const [costValue, setCostValue] = useState<string>('');

  // Flags State
  const [clearanceFlag, setClearanceFlag] = useState<'leave' | 'set_true' | 'set_false'>('leave');
  const [saleFlag, setSaleFlag] = useState<'leave' | 'set_true' | 'set_false'>('leave');
  const [hotDealFlag, setHotDealFlag] = useState<'leave' | 'set_true' | 'set_false'>('leave');
  const [draftStatusValue, setDraftStatusValue] = useState<'leave_unchanged' | 'ready_to_publish' | 'needs_review'>('leave_unchanged');

  if (!isOpen) return null;

  const currentDeptObj = INITIAL_DEPARTMENTS.find(d => d.slug === selectedDeptSlug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BulkUpdatePayload = {};

    // Category logic
    if (selectedDeptSlug !== 'keep_existing') {
      if (selectedDeptSlug === 'custom') {
        if (customCategory.trim()) {
          payload.department = customCategory.trim();
          payload.category = customCategory.trim();
        }
      } else if (currentDeptObj) {
        payload.department = currentDeptObj.name;
        if (selectedSubCatName !== 'keep_existing') {
          payload.category = selectedSubCatName;
        }
      }
    }

    // Condition
    if (selectedCondition !== 'keep_existing') {
      payload.condition = selectedCondition as ProductCondition;
    }

    // Warehouse Location
    if (locationValue.trim()) {
      payload.warehouseLocation = locationValue.trim();
    }

    // Brand
    if (brandValue.trim()) {
      payload.brand = brandValue.trim();
    }

    // Shipping Class
    if (shippingClassValue !== 'keep_existing') {
      payload.shippingClass = shippingClassValue as any;
    }

    // Pricing
    if (priceAction !== 'none' && priceValue !== '') {
      payload.priceAdjustmentType = priceAction;
      payload.priceValue = parseFloat(priceValue);
    }
    if (roundTo95) {
      payload.roundTo95 = true;
    }

    // Cost
    if (costAction !== 'none' && costValue !== '') {
      payload.costPriceAdjustmentType = costAction;
      payload.costPriceValue = parseFloat(costValue);
    }

    // Flags
    if (clearanceFlag === 'set_true') payload.isClearance = true;
    if (clearanceFlag === 'set_false') payload.isClearance = false;
    if (saleFlag === 'set_true') payload.isSale = true;
    if (saleFlag === 'set_false') payload.isSale = false;
    if (hotDealFlag === 'set_true') payload.isHotDeal = true;
    if (hotDealFlag === 'set_false') payload.isHotDeal = false;

    // Draft Status
    if (showDraftStatus && draftStatusValue !== 'leave_unchanged') {
      payload.draftStatus = draftStatusValue;
    }

    onApply(payload);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#14161A] border-2 border-[#FFD400] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-gray-200 my-auto">
        {/* Header */}
        <div className="bg-[#111111] p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD400] text-[#111111] flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD400] text-[#111111] text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  BULK BATCH EDIT
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {itemCount} {itemTypeLabel} selected
                </span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                Multi-Item Bulk Editor
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'categories', label: 'Categories & Depts', icon: Tag },
            { id: 'pricing', label: 'Pricing & Margins', icon: DollarSign },
            { id: 'condition_loc', label: 'Condition & Location', icon: MapPin },
            { id: 'flags', label: 'Badges & Status', icon: Flame }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'text-[#FFD400] border-[#FFD400] bg-[#14161A]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* TAB 1: Categories & Department */}
          {activeTab === 'categories' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-xs text-gray-300">
                💡 <strong className="text-white">Batch Category Assignment:</strong> Select a master department and subcategory to apply to all <strong className="text-[#FFD400]">{itemCount}</strong> selected items at once.
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Target Department
                </label>
                <select
                  value={selectedDeptSlug}
                  onChange={e => {
                    setSelectedDeptSlug(e.target.value);
                    setSelectedSubCatName('keep_existing');
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#FFD400]"
                >
                  <option value="keep_existing">— Keep Current Department on Each Item —</option>
                  {INITIAL_DEPARTMENTS.map(dept => (
                    <option key={dept.slug} value={dept.slug}>
                      {dept.name}
                    </option>
                  ))}
                  <option value="custom">+ Custom Department / Name</option>
                </select>
              </div>

              {selectedDeptSlug === 'custom' && (
                <div>
                  <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                    Custom Department / Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Commercial Marine Parts, Vintage Toys"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#FFD400]"
                  />
                </div>
              )}

              {currentDeptObj && (
                <div>
                  <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                    Subcategory / Specific Line
                  </label>
                  <select
                    value={selectedSubCatName}
                    onChange={e => setSelectedSubCatName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#FFD400]"
                  >
                    <option value="keep_existing">— Leave Subcategory Unchanged —</option>
                    {currentDeptObj.subcategories.map(sub => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Brand Name Override (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to keep existing brands"
                  value={brandValue}
                  onChange={e => setBrandValue(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#FFD400]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Margins */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-xs text-gray-300">
                💰 <strong className="text-white">Commercial Pricing Engine:</strong> Bulk adjust selling prices or apply percentage markups/markdowns across all selected inventory.
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Sell Price Adjustment Rule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Do not alter prices', desc: 'Keep existing sell prices' },
                    { id: 'fixed', label: 'Set Fixed Price ($)', desc: 'Set all to same price' },
                    { id: 'percent_increase', label: 'Increase Price by %', desc: 'e.g. +10% price bump' },
                    { id: 'percent_decrease', label: 'Discount Price by %', desc: 'e.g. 20% clearance sale' },
                    { id: 'margin_markup', label: 'Set Markup on Cost', desc: 'e.g. Cost × 2.2 markup' }
                  ].map(rule => (
                    <label
                      key={rule.id}
                      className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                        priceAction === rule.id
                          ? 'bg-[#FFD400]/10 border-[#FFD400] text-white'
                          : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{rule.label}</span>
                        <input
                          type="radio"
                          name="priceAction"
                          value={rule.id}
                          checked={priceAction === rule.id}
                          onChange={() => setPriceAction(rule.id as any)}
                          className="accent-[#FFD400]"
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">{rule.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {priceAction !== 'none' && (
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <label className="block text-xs font-black uppercase text-[#FFD400]">
                    {priceAction === 'fixed' && 'New Selling Price (AUD $)'}
                    {priceAction === 'percent_increase' && 'Percentage Increase (%)'}
                    {priceAction === 'percent_decrease' && 'Percentage Discount (%)'}
                    {priceAction === 'margin_markup' && 'Markup Multiplier (e.g. 2.2 = 120% margin)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder={priceAction === 'fixed' ? '29.95' : priceAction === 'margin_markup' ? '2.2' : '15'}
                      value={priceValue}
                      onChange={e => setPriceValue(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl p-3 text-sm font-mono font-bold focus:outline-none focus:border-[#FFD400]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={roundTo95}
                      onChange={e => setRoundTo95(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#FFD400]"
                    />
                    <span className="text-xs text-gray-300 font-medium">
                      Round final prices to <strong>.95</strong> (e.g. $29.95)
                    </span>
                  </label>
                </div>
              )}

              {/* Cost Price Adjustment */}
              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">
                  Cost Price Update (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Leave Cost Unchanged' },
                    { id: 'fixed', label: 'Set Fixed Cost ($)' },
                    { id: 'percent_increase', label: 'Adjust Cost (+/- %)' }
                  ].map(c => (
                    <label
                      key={c.id}
                      className={`p-2.5 rounded-lg border text-xs font-bold cursor-pointer flex items-center justify-between ${
                        costAction === c.id
                          ? 'bg-neutral-800 border-[#FFD400] text-white'
                          : 'bg-neutral-900 border-neutral-800 text-gray-400'
                      }`}
                    >
                      <span>{c.label}</span>
                      <input
                        type="radio"
                        name="costAction"
                        value={c.id}
                        checked={costAction === c.id}
                        onChange={() => setCostAction(c.id as any)}
                        className="accent-[#FFD400]"
                      />
                    </label>
                  ))}
                </div>

                {costAction !== 'none' && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter cost value..."
                    value={costValue}
                    onChange={e => setCostValue(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-mono mt-2 focus:outline-none focus:border-[#FFD400]"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Condition & Location */}
          {activeTab === 'condition_loc' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Product Condition Grading
                </label>
                <select
                  value={selectedCondition}
                  onChange={e => setSelectedCondition(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#FFD400]"
                >
                  <option value="keep_existing">— Keep Current Conditions —</option>
                  <option value="Brand New">Brand New (Factory Sealed)</option>
                  <option value="Open Box">Open Box (Like New / Tested)</option>
                  <option value="Refurbished">Refurbished (Certified Grade A)</option>
                  <option value="Good Used">Good Used (Minor signs of wear)</option>
                  <option value="For Parts or Not Working">For Parts or Not Working</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Warehouse Location / Bin Code
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. W1-A-01, Geelong Bay 3, Werribee Pallet 12"
                    value={locationValue}
                    onChange={e => setLocationValue(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#FFD400]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['W1-A-01', 'W1-B-02', 'W1-C-03', 'Geelong Dock 3', 'Werribee DC-02'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLocationValue(preset)}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white rounded text-[11px] font-mono border border-neutral-800"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-300 mb-1.5">
                  Shipping Class
                </label>
                <select
                  value={shippingClassValue}
                  onChange={e => setShippingClassValue(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#FFD400]"
                >
                  <option value="keep_existing">— Keep Current Shipping Class —</option>
                  <option value="standard">Standard Australia Post / Courier</option>
                  <option value="express">Express Courier Delivery</option>
                  <option value="bulky">Bulky / Freight Only</option>
                  <option value="free">Free Australia-Wide Shipping</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: Badges & Flags */}
          {activeTab === 'flags' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Clearance */}
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E21C21]" />
                    Clearance Flag
                  </div>
                  <select
                    value={clearanceFlag}
                    onChange={e => setClearanceFlag(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="leave">Leave Unchanged</option>
                    <option value="set_true">Set as Clearance (YES)</option>
                    <option value="set_false">Remove Clearance (NO)</option>
                  </select>
                </div>

                {/* Hot Deal */}
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FFD400]" />
                    Hot Deal Banner
                  </div>
                  <select
                    value={hotDealFlag}
                    onChange={e => setHotDealFlag(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="leave">Leave Unchanged</option>
                    <option value="set_true">Mark as Hot Deal</option>
                    <option value="set_false">Remove Hot Deal</option>
                  </select>
                </div>

                {/* Sale */}
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Special Sale Flag
                  </div>
                  <select
                    value={saleFlag}
                    onChange={e => setSaleFlag(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="leave">Leave Unchanged</option>
                    <option value="set_true">Mark on Sale</option>
                    <option value="set_false">Remove Sale</option>
                  </select>
                </div>
              </div>

              {showDraftStatus && (
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2">
                  <label className="block text-xs font-black uppercase text-[#FFD400]">
                    Import Workflow Status
                  </label>
                  <select
                    value={draftStatusValue}
                    onChange={e => setDraftStatusValue(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="leave_unchanged">— Leave Status Unchanged —</option>
                    <option value="ready_to_publish">Approve as Ready to Publish</option>
                    <option value="needs_review">Mark as Needs Manual Review</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              Applying changes to <strong className="text-white">{itemCount}</strong> selected {itemTypeLabel}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/2 sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 sm:w-auto px-5 py-2.5 bg-[#FFD400] hover:bg-yellow-400 text-[#111111] text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply to {itemCount} Items</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
