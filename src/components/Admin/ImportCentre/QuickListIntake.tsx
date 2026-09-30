import React, { useState } from 'react';
import { 
  Zap, Sparkles, Check, Plus, Trash2, ArrowRight, 
  DollarSign, Package, MapPin, Tag, Layers, RefreshCw
} from 'lucide-react';
import { ImportDraftProduct, ProductCondition } from '../../../types';

interface Props {
  onDraftGenerated: (draft: ImportDraftProduct) => void;
}

export const QuickListIntake: React.FC<Props> = ({ onDraftGenerated }) => {
  const [mode, setMode] = useState<'quick_one_off' | 'bulk_grid'>('quick_one_off');
  
  // Quick One-off state
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80');
  const [titleInput, setTitleInput] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [costInput, setCostInput] = useState('20.00');
  const [priceInput, setPriceInput] = useState('49.00');
  const [stockInput, setStockInput] = useState('1');
  const [conditionInput, setConditionInput] = useState<ProductCondition>('Good Used');
  const [categoryInput, setCategoryInput] = useState('Tools & Hardware');
  const [locationInput, setLocationInput] = useState('W1-A-01');
  const [notesInput, setNotesInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Bulk Quick Rows state
  const [bulkRows, setBulkRows] = useState<Array<{
    title: string;
    brand: string;
    cost: string;
    price: string;
    qty: string;
    condition: ProductCondition;
    location: string;
  }>>([
    { title: 'Ryobi One+ 18V Cordless Blower Bare Tool', brand: 'Ryobi', cost: '35', price: '79', qty: '2', condition: 'Good Used', location: 'W1-B-01' },
    { title: 'Stanley FatMax 8m Heavy Duty Tape Measure', brand: 'Stanley', cost: '12', price: '28', qty: '6', condition: 'Brand New', location: 'W1-A-03' }
  ]);

  const handleQuickAiGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/import/ai-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `${brandInput} ${titleInput} ${notesInput}`.trim(),
          brandHint: brandInput,
          conditionHint: conditionInput,
          categoryHint: categoryInput,
          costPrice: parseFloat(costInput) || 20,
          images: photoUrl ? [photoUrl] : []
        })
      });

      const data = await res.json();
      if (data.success && data.draft) {
        const draft: ImportDraftProduct = {
          ...data.draft,
          title: titleInput.trim() || data.draft.title,
          brand: brandInput.trim() || data.draft.brand,
          costPrice: parseFloat(costInput) || 20,
          price: parseFloat(priceInput) || data.draft.price,
          stock: parseInt(stockInput, 10) || 1,
          warehouseLocation: locationInput,
          condition: conditionInput
        };
        onDraftGenerated(draft);

        // Reset form
        setTitleInput('');
        setBrandInput('');
        setNotesInput('');
      }
    } catch (err) {
      console.error('Quick AI list failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommitBulkRows = () => {
    bulkRows.forEach(row => {
      if (!row.title.trim()) return;
      const cost = parseFloat(row.cost) || 0;
      const price = parseFloat(row.price) || (cost > 0 ? cost * 2.2 : 29.95);
      const stock = parseInt(row.qty, 10) || 1;

      const draft: ImportDraftProduct = {
        id: `draft-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: row.title,
        shortDescription: `${row.brand || 'CheapLoot'} ${row.title}`,
        description: `### Overview\n${row.title}\n\n### Condition Details\n${row.condition} liquidation stock inspected at warehouse.`,
        brand: row.brand || 'CheapLoot',
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        barcode: '',
        mpn: '',
        condition: row.condition,
        conditionDescription: row.condition,
        department: 'Tools & Hardware',
        category: 'Tools & Hardware',
        price,
        costPrice: cost,
        landedCost: cost * 1.05,
        stock,
        isOneOff: stock === 1,
        warehouseLocation: row.location || 'W1-A-01',
        weightKg: 1.0,
        dimensionsCm: { length: 20, width: 15, height: 10 },
        shippingClass: 'standard',
        images: ['https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80'],
        features: ['Australian warehouse stock', 'Inspected for condition'],
        specs: { Brand: row.brand, Condition: row.condition },
        whatsIncluded: ['1x ' + row.title],
        searchKeywords: [(row.brand || '').toLowerCase(), 'liquidation', 'tools'],
        tags: [row.brand || 'CheapLoot', 'Tools & Hardware'],
        ebayTitle: row.title.slice(0, 80),
        ebayCategory: 'Tools & Hardware',
        status: 'ready_to_publish',
        confidence: { overall: 85, title: 90, brand: 85, model: 80, category: 85, condition: 85, price: 85, requiresManualConfirmation: false },
        validationErrors: [],
        validationWarnings: [],
        qualityCompletenessScore: 80
      };

      onDraftGenerated(draft);
    });

    setBulkRows([
      { title: '', brand: '', cost: '', price: '', qty: '1', condition: 'Good Used', location: 'W1-A-01' }
    ]);
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800 space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFD400]" />
            Quick List & Rapid One-Off Intake
          </h2>
          <p className="text-xs text-gray-400">
            Speed-listing mode for singular liquidation items, pallets, or quick batch copy-paste
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('quick_one_off')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${mode === 'quick_one_off' ? 'bg-[#FFD400] text-black font-black' : 'text-gray-400 hover:text-white'}`}
          >
            Rapid One-Off (AI Auto-Fill)
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk_grid')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${mode === 'bulk_grid' ? 'bg-[#FFD400] text-black font-black' : 'text-gray-400 hover:text-white'}`}
          >
            Bulk Quick Grid
          </button>
        </div>
      </div>

      {mode === 'quick_one_off' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Fields */}
          <div className="space-y-4 bg-neutral-900/60 p-5 rounded-xl border border-neutral-800">
            <div className="text-xs font-bold uppercase text-[#FFD400] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Core Product Data
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Item Title / Model:</label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  placeholder="e.g. DeWalt 18V XR Brushless Combi Drill"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2.5 font-bold focus:outline-none focus:border-[#FFD400]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Brand:</label>
                  <input
                    type="text"
                    value={brandInput}
                    onChange={e => setBrandInput(e.target.value)}
                    placeholder="e.g. DeWalt, Makita"
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Condition:</label>
                  <select
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value as any)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  >
                    <option value="Good Used">Good Used</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="For Parts or Not Working">For Parts or Not Working</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="text-gray-400 block mb-1">Cost ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costInput}
                    onChange={e => {
                      setCostInput(e.target.value);
                      const cost = parseFloat(e.target.value) || 0;
                      if (cost > 0) setPriceInput((cost * 2.2).toFixed(2));
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-emerald-400 font-bold rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Qty:</label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={e => setStockInput(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 text-center focus:outline-none focus:border-[#FFD400]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Category:</label>
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Bin Location:</label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white font-mono rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Physical Notes / Scratches:</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="e.g. Tested fully working, includes belt clip and battery"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating || !titleInput.trim()}
              onClick={handleQuickAiGenerate}
              className="w-full py-3 bg-[#FFD400] hover:bg-[#FFE033] text-black font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'AI Auto-Enriching Listing...' : 'Enrich with AI & Add to Review Queue'}
            </button>
          </div>

          {/* Right: AI Listing Guarantee Summary */}
          <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
            <div className="text-xs font-bold uppercase text-gray-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD400]" />
              How Quick List Works
            </div>

            <div className="space-y-3 text-xs text-gray-400">
              <div className="p-3 bg-[#181818] rounded-lg border border-neutral-800 space-y-1">
                <span className="font-bold text-white">1. Instant SKU Generation</span>
                <p className="text-[11px]">System creates a unique, collision-proof CheapLoot SKU based on category initials.</p>
              </div>

              <div className="p-3 bg-[#181818] rounded-lg border border-neutral-800 space-y-1">
                <span className="font-bold text-white">2. Automatic Multi-Channel Copy</span>
                <p className="text-[11px]">Generates website product description, bulleted specs, and an 80-character eBay listing title.</p>
              </div>

              <div className="p-3 bg-[#181818] rounded-lg border border-neutral-800 space-y-1">
                <span className="font-bold text-white">3. Landed Cost Margin Calculation</span>
                <p className="text-[11px]">Auto-calculates standard 2.2x markup on cost price to ensure target margin.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bulk Grid Mode */
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-800 text-gray-400 uppercase font-black text-[10px]">
                <tr>
                  <th className="p-2.5">Title / Description</th>
                  <th className="p-2.5 w-32">Brand</th>
                  <th className="p-2.5 w-24">Cost ($)</th>
                  <th className="p-2.5 w-24">Price ($)</th>
                  <th className="p-2.5 w-16">Qty</th>
                  <th className="p-2.5 w-28">Condition</th>
                  <th className="p-2.5 w-24">Location</th>
                  <th className="p-2.5 w-10 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-gray-200">
                {bulkRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/40">
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].title = e.target.value;
                          setBulkRows(next);
                        }}
                        placeholder="Product title..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white font-bold focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.brand}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].brand = e.target.value;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.cost}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].cost = e.target.value;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-right font-mono text-gray-300 focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.price}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].price = e.target.value;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-right font-mono text-emerald-400 font-bold focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].qty = e.target.value;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-center font-mono text-white focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.condition}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].condition = e.target.value as any;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#FFD400]"
                      >
                        <option value="Good Used">Good Used</option>
                        <option value="Brand New">Brand New</option>
                        <option value="Open Box">Open Box</option>
                        <option value="Refurbished">Refurbished</option>
                        <option value="For Parts or Not Working">For Parts</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.location}
                        onChange={e => {
                          const next = [...bulkRows];
                          next[idx].location = e.target.value;
                          setBulkRows(next);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 font-mono text-gray-400 focus:outline-none focus:border-[#FFD400]"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setBulkRows([...bulkRows, { title: '', brand: '', cost: '', price: '', qty: '1', condition: 'Good Used', location: 'W1-A-01' }])}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>

            <button
              type="button"
              onClick={handleCommitBulkRows}
              className="px-5 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-lg"
            >
              <Check className="w-4 h-4" />
              Queue All {bulkRows.length} Rows for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
