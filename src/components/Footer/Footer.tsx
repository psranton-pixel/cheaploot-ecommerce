import React from 'react';
import { ShieldCheck, Truck, MapPin, Store, Mail, Phone, Heart, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { setCurrentView, navigateToDepartment, departments } = useStore();

  return (
    <footer className="bg-[#14161A] text-[#AEB3BA] border-t-2 border-[#B8E62E] pb-20 md:pb-0 w-full max-w-full box-border">
      {/* 1. Australian Retail Value Props Banner */}
      <div className="border-b border-[#2C3038] py-5 sm:py-6 bg-[#202329]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🦘
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-xs uppercase truncate">100% Australian Stock</div>
              <div className="text-[11px] text-[#AEB3BA] truncate">Geelong & Werribee hubs</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-xs uppercase truncate">Same-Day Pick & Pack</div>
              <div className="text-[11px] text-[#AEB3BA] truncate">Dispatched via AusPost & Couriers</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🛡️
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-xs uppercase truncate">30-Day Money Back</div>
              <div className="text-[11px] text-[#AEB3BA] truncate">Backed by Aussie Consumer Law</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🏪
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-xs uppercase truncate">Free Click & Collect</div>
              <div className="text-[11px] text-[#AEB3BA] truncate">Ready in 2 hours at depot counters</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Multi-Column Directory */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 text-xs min-w-0">
        {/* Brand & Mission */}
        <div className="lg:col-span-2 space-y-3 min-w-0">
          <div className="bg-[#B8E62E] text-[#14161A] px-3 py-1 rounded font-black text-2xl inline-block tracking-tighter">
            CHEAP<span className="bg-[#14161A] text-[#B8E62E] px-1.5 py-0.5 ml-1 rounded">LOOT</span>
          </div>
          <p className="text-[#AEB3BA] leading-relaxed font-medium">
            Australia’s high-volume discount retailer for quality automotive parts, workshop tools, brand-name electronics, home appliances, and genuine liquidation loot. No gimmicks, just serious bargain pricing.
          </p>
          <div className="space-y-1 text-[#AEB3BA] font-mono text-[11px]">
            <div>CheapLoot Australia Pty Ltd</div>
            <div>ABN: 48 912 345 678 | Australian Owned & Operated</div>
            <div>Geelong Hub: 110-120 Corio Quay Rd, North Geelong VIC 3215</div>
          </div>
        </div>

        {/* Customer Help */}
        <div className="space-y-2.5 min-w-0">
          <h4 className="text-white font-black uppercase text-xs tracking-wider">
            Customer Care & Help
          </h4>
          <ul className="space-y-1.5 text-[#AEB3BA]">
            <li>
              <button onClick={() => setCurrentView('tracking')} className="hover:text-[#B8E62E] text-left">
                Track Your Parcel
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('cart')} className="hover:text-[#B8E62E] text-left">
                Delivery Rates & Postcodes
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('catalog')} className="hover:text-[#B8E62E] text-left">
                30-Day Returns Policy
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('home')} className="hover:text-[#B8E62E] text-left">
                Australian Warranty Info
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('sell-stuff')} className="hover:text-[#B8E62E] text-left">
                Sell Your Inventory to Us
              </button>
            </li>
          </ul>
        </div>

        {/* Popular Departments */}
        <div className="space-y-2.5 min-w-0">
          <h4 className="text-white font-black uppercase text-xs tracking-wider">
            Popular Departments
          </h4>
          <ul className="space-y-1.5 text-[#AEB3BA]">
            {departments.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => navigateToDepartment(d.slug)}
                  className="hover:text-[#B8E62E] text-left truncate max-w-[180px]"
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Warehouse Hubs & Staff Portal */}
        <div className="space-y-2.5 min-w-0">
          <h4 className="text-white font-black uppercase text-xs tracking-wider">
            Warehouse Hubs
          </h4>
          <div className="space-y-2 text-[#AEB3BA] text-[11px]">
            <div>
              <strong className="text-white block">Geelong Depot:</strong>
              110-120 Corio Quay Rd, North Geelong VIC 3215
              <span className="text-[#B8E62E] block font-bold">Pick-up counter open 8am-6pm</span>
            </div>
            <div>
              <strong className="text-white block">Werribee Depot:</strong>
              45-49 Synnot St, Werribee VIC 3030
              <span className="text-[#B8E62E] block font-bold">Pick-up counter open 8am-5pm</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-[#202329] hover:bg-black border border-[#2C3038] text-[#B8E62E] font-black text-xs px-3 py-1.5 rounded uppercase"
            >
              Warehouse Staff Portal
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Payment Icons */}
      <div className="border-t border-[#2C3038] py-4 bg-[#14161A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#AEB3BA] min-w-0">
          <div>
            &copy; {new Date().getFullYear()} CheapLoot Australia. All prices in AUD including 10% GST.
          </div>

          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-white font-bold">
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-[10px]">VISA</span>
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-[10px]">MASTERCARD</span>
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-[10px]">AMEX</span>
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-[#B8E62E] text-[10px]">PAYPAL</span>
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-emerald-400 text-[10px]">AFTERPAY</span>
            <span className="bg-[#202329] border border-[#2C3038] px-2 py-0.5 rounded text-purple-400 text-[10px]">ZIP</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
