import React, { useState } from 'react';
import { Sparkles, DollarSign, Upload, CheckCircle2, ArrowRight, ShieldCheck, Tag, Wrench, Cpu, Car, Disc } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const SellStuffPage: React.FC = () => {
  const { setCurrentView } = useStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    postcode: '',
    category: 'tools',
    brand: '',
    itemTitle: '',
    condition: 'Excellent Used',
    quantity: '1',
    askingPrice: '',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [estimatedOffer, setEstimatedOffer] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate instant valuation algorithm
    const base = formData.askingPrice ? parseFloat(formData.askingPrice) * 0.75 : 120;
    setEstimatedOffer(Math.round(base));
    setIsSubmitted(true);
  };

  return (
    <div className="py-8 bg-[#F4F4F4] min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 space-y-6">
        {/* Header Banner */}
        <div className="bg-[#111111] text-white p-6 sm:p-8 rounded-xl border-2 border-[#FFD400] shadow-xl space-y-3">
          <span className="bg-[#FFD400] text-[#111111] text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            CHEAPLOOT LIQUIDATION & INVENTORY BUY-BACK
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Sell Your Tools, Tech, Auto Parts & Media to Us
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 font-medium max-w-2xl">
            Whether you're clearing workshop surplus, closing a business, upgrading power tools, or offloading vinyl collections — CheapLoot pays same-day cash/EFT with free courier pickup or warehouse drop-off!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-800 text-xs">
            <div className="flex items-center gap-2 text-gray-200">
              <span className="text-[#FFD400] font-black">✓</span> Same-Day Payout
            </div>
            <div className="flex items-center gap-2 text-gray-200">
              <span className="text-[#FFD400] font-black">✓</span> Free AU Freight Pickup
            </div>
            <div className="flex items-center gap-2 text-gray-200">
              <span className="text-[#FFD400] font-black">✓</span> Bulk Pallets Accepted
            </div>
            <div className="flex items-center gap-2 text-gray-200">
              <span className="text-[#FFD400] font-black">✓</span> Honest Fair Valuations
            </div>
          </div>
        </div>

        {/* Form Container */}
        {isSubmitted ? (
          <div className="bg-white p-8 rounded-xl border-2 border-emerald-500 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black uppercase px-3 py-1 rounded">
                SUBMISSION RECEIVED
              </span>
              <h2 className="text-2xl font-black uppercase text-[#111111] mt-2">
                Estimated Buy-In Offer: ${estimatedOffer} AUD
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-semibold max-w-md mx-auto mt-1">
                Our acquisition team in Geelong has reviewed your submission for <strong>{formData.itemTitle}</strong>. A courier pickup label and formal offer agreement have been sent to <strong>{formData.email}</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-[#111111] hover:bg-black text-white font-black text-xs px-5 py-2.5 rounded uppercase"
              >
                Submit Another Item
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs px-5 py-2.5 rounded uppercase"
              >
                Return to Store
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <h2 className="text-lg font-black uppercase text-[#111111] border-b pb-2">
              Item & Seller Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brad Wilson"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. brad@workshop.com.au"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="0400 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Postcode / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3220 (Geelong) or 3030 (Werribee)"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>
            </div>

            <h3 className="text-sm font-black uppercase text-[#111111] border-t pt-4">
              What Are You Selling?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                >
                  <option value="tools">Workshop Tools & Power Tools</option>
                  <option value="automotive">Automotive Parts & 4WD Accessories</option>
                  <option value="electronics">Electronics, Tablets & Hardware</option>
                  <option value="media">Vinyl Records, DVDs, Blu-rays & Games</option>
                  <option value="appliances">Home Appliances & Overstock</option>
                  <option value="bulk">Bulk Inventory / Entire Liquidation Lot</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Brand / Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milwaukee, Makita, Bosch, Apple, Sidchrome"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 mb-1">Item Title / Model Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18V Brushless Impact Driver with 2x 5.0Ah Batteries"
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({ ...formData, itemTitle: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Item Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                >
                  <option value="Brand New">Brand New / Unopened</option>
                  <option value="Open Box">Open Box / Complete</option>
                  <option value="Refurbished">Refurbished / Serviced</option>
                  <option value="Excellent Used">Excellent Used (Fully Working)</option>
                  <option value="Good Used">Good Used (Minor cosmetic wear)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Expected Price (AUD, Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. $150"
                  value={formData.askingPrice}
                  onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 mb-1">Additional Notes / Included Accessories</label>
                <textarea
                  rows={3}
                  placeholder="Mention charger, case, accessories, or bulk pallet dimensions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2.5 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-sm py-3.5 rounded-lg uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>GET INSTANT CHEAPLOOT BUYOUT VALUATION</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
