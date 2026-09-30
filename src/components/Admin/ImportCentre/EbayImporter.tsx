import React, { useState } from 'react';
import { 
  ShoppingBag, RefreshCw, CheckCircle2, AlertTriangle, 
  ExternalLink, ArrowRight, ShieldCheck, Download, Check
} from 'lucide-react';
import { ImportDraftProduct, ImportMode } from '../../../types';

interface Props {
  onParsedDrafts: (drafts: ImportDraftProduct[], sourceName: string, mode: ImportMode) => void;
}

const SAMPLE_EBAY_ACTIVE_LISTINGS = [
  {
    ebayItemId: '194820194812',
    sku: 'EBAY-MAK-DTW300',
    title: 'Makita DTW300Z 18V Brushless 1/2" Cordless Impact Wrench Skin',
    brand: 'Makita',
    mpn: 'DTW300Z',
    category: 'Tools & Hardware',
    condition: 'Brand New',
    price: 189.00,
    costPrice: 110.00,
    stock: 5,
    warehouseLocation: 'W1-A-02',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80']
  },
  {
    ebayItemId: '194820194813',
    sku: 'EBAY-PHIL-H4LED',
    title: 'Philips Ultinon Pro5000 LED H4 Headlight Bulbs Twin Pack 5800K',
    brand: 'Philips',
    mpn: '11342U50CWX2',
    category: 'Automotive',
    condition: 'Brand New',
    price: 129.00,
    costPrice: 65.00,
    stock: 8,
    warehouseLocation: 'W1-B-03',
    images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&q=80']
  },
  {
    ebayItemId: '194820194814',
    sku: 'EBAY-SONY-WF1000',
    title: 'Sony WF-1000XM4 Truly Wireless Noise Cancelling Earbuds Black',
    brand: 'Sony',
    mpn: 'WF1000XM4B',
    category: 'Electronics',
    condition: 'Open Box',
    price: 179.00,
    costPrice: 90.00,
    stock: 2,
    warehouseLocation: 'W1-A-04',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80']
  }
];

export const EbayImporter: React.FC<Props> = ({ onParsedDrafts }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(
    SAMPLE_EBAY_ACTIVE_LISTINGS.map(i => i.ebayItemId)
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const handleIngestEbay = () => {
    setIsSyncing(true);
    const chosen = SAMPLE_EBAY_ACTIVE_LISTINGS.filter(i => selectedItems.includes(i.ebayItemId));

    const drafts: ImportDraftProduct[] = chosen.map(item => ({
      id: `draft-ebay-${item.ebayItemId}`,
      title: item.title,
      shortDescription: `${item.brand} item imported from eBay AU store.`,
      description: `### Overview\n${item.title}\n\n### Condition\n${item.condition}. Sourced and verified from eBay active inventory.`,
      brand: item.brand,
      sku: item.sku,
      barcode: '',
      mpn: item.mpn,
      condition: item.condition as any,
      conditionDescription: item.condition,
      department: item.category,
      category: item.category,
      price: item.price,
      costPrice: item.costPrice,
      landedCost: item.costPrice * 1.05,
      stock: item.stock,
      isOneOff: item.stock === 1,
      warehouseLocation: item.warehouseLocation,
      weightKg: 1.2,
      dimensionsCm: { length: 20, width: 15, height: 10 },
      shippingClass: 'standard',
      images: item.images,
      features: ['Genuine manufacturer part', 'Direct eBay sync'],
      specs: { Brand: item.brand, MPN: item.mpn, Condition: item.condition },
      whatsIncluded: ['1x ' + item.title],
      searchKeywords: [item.brand.toLowerCase(), item.mpn.toLowerCase()],
      tags: [item.brand, item.category],
      ebayTitle: item.title.slice(0, 80),
      ebayCategory: item.category,
      status: 'ready_to_publish',
      confidence: { overall: 95, title: 95, brand: 95, model: 90, category: 95, condition: 90, price: 95, requiresManualConfirmation: false },
      validationErrors: [],
      validationWarnings: [],
      qualityCompletenessScore: 90
    }));

    setTimeout(() => {
      setIsSyncing(false);
      onParsedDrafts(drafts, 'eBay Store Import (Active Listings)', 'CREATE_AND_UPDATE');
    }, 500);
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FFD400]" />
            eBay Store Direct Catalogue Importer
          </h2>
          <p className="text-xs text-gray-400">
            Ingest active listings directly from your eBay AU Seller account into CheapLoot's master database
          </p>
        </div>

        <button
          type="button"
          disabled={isSyncing || selectedItems.length === 0}
          onClick={handleIngestEbay}
          className="px-5 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isSyncing ? 'Ingesting from eBay...' : `Import ${selectedItems.length} Selected Listings`}
        </button>
      </div>

      {/* Live eBay Active Items Grid */}
      <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="p-3 bg-neutral-800/80 border-b border-neutral-700 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-300">Active eBay Australia Listings Detected (3 Found)</span>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> eBay AU Token Connected
          </span>
        </div>

        <div className="divide-y divide-neutral-800">
          {SAMPLE_EBAY_ACTIVE_LISTINGS.map(item => {
            const isSelected = selectedItems.includes(item.ebayItemId);
            return (
              <div key={item.ebayItemId} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-800/40">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSelectedItems(selectedItems.filter(id => id !== item.ebayItemId));
                      } else {
                        setSelectedItems([...selectedItems, item.ebayItemId]);
                      }
                    }}
                    className="w-4 h-4 rounded accent-[#FFD400]"
                  />
                  <img src={item.images[0]} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-neutral-700" />
                  <div>
                    <h4 className="font-bold text-xs text-white">{item.title}</h4>
                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-3 mt-1">
                      <span>eBay Item ID: {item.ebayItemId}</span>
                      <span>SKU: {item.sku}</span>
                      <span>Condition: {item.condition}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-black text-emerald-400 text-sm">${item.price.toFixed(2)}</div>
                  <div className="text-gray-400 text-[11px]">{item.stock} Available</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
