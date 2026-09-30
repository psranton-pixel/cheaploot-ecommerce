import React, { useState, useEffect } from 'react';
import { Flame, Clock, ShieldCheck, ShoppingCart, Zap, ArrowRight, Check } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface LootOfTheDayProps {
  product?: Product;
}

export const LootOfTheDay: React.FC<LootOfTheDayProps> = ({ product }) => {
  const { products, addToCart, navigateToProduct } = useStore();

  // Find featured deal or fallback to first
  const deal = product || products.find(p => p.isLootOfTheDay) || products[0];

  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!deal) return null;

  const dollarSaving = deal.wasPrice ? deal.wasPrice - deal.price : 0;
  const percentageSaving = deal.wasPrice ? Math.round((dollarSaving / deal.wasPrice) * 100) : 0;

  return (
    <section className="py-6 sm:py-8 bg-[#14161A] text-white border-b-2 border-[#B8E62E] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center min-w-0">
          {/* Left Visual Image & Deal Highlight */}
          <div className="lg:col-span-5 relative w-full min-w-0">
            <div className="relative rounded-xl overflow-hidden bg-[#202329] p-4 border border-[#2C3038] shadow-2xl">
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-[#E21C21] text-white text-xs font-black uppercase px-3 py-1 rounded shadow">
                <Flame className="w-4 h-4 fill-white" />
                <span>LOOT OF THE DAY</span>
              </div>

              <img
                src={deal.images[0]}
                alt={deal.title}
                referrerPolicy="no-referrer"
                className="w-full aspect-square object-cover rounded-lg bg-[#14161A]"
              />

              <div className="absolute bottom-2 right-2 bg-[#14161A]/95 text-[#B8E62E] text-xs font-black px-2.5 py-1 rounded border border-[#B8E62E]">
                {deal.condition}
              </div>
            </div>
          </div>

          {/* Right Product Details & Buy Now */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="bg-[#B8E62E] text-[#14161A] font-black text-xs px-2.5 py-0.5 rounded uppercase">
                {deal.brand}
              </span>
              <span className="text-[#AEB3BA] font-mono text-xs">SKU: {deal.sku}</span>
              <div className="flex items-center gap-1 bg-[#202329] text-[#B8E62E] text-xs font-bold px-2.5 py-1 rounded border border-[#2C3038]">
                <Clock className="w-3.5 h-3.5" />
                <span>DEAL ENDS IN:</span>
                <span className="font-mono font-black">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <h3 
              onClick={() => navigateToProduct(deal.id)}
              className="text-xl sm:text-2xl lg:text-3xl font-black text-white hover:text-[#B8E62E] cursor-pointer transition-colors leading-tight uppercase break-words"
            >
              {deal.title}
            </h3>

            {/* Price & Savings Display */}
            <div className="flex flex-wrap items-baseline gap-3 bg-[#202329] p-3 sm:p-4 rounded-xl border border-[#2C3038]">
              <div>
                <span className="text-[11px] text-[#AEB3BA] font-bold block">TODAY'S SMASH PRICE</span>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#B8E62E]">
                  ${deal.price.toFixed(2)}
                </span>
              </div>
              {deal.wasPrice && (
                <div>
                  <span className="text-[11px] text-[#AEB3BA] font-bold block">WAS RRP</span>
                  <span className="text-base sm:text-lg text-[#AEB3BA] line-through font-bold">
                    ${deal.wasPrice.toFixed(2)}
                  </span>
                </div>
              )}
              {dollarSaving > 0 && (
                <div className="bg-[#E21C21] text-white px-2.5 py-1 rounded-md font-black text-xs sm:text-sm uppercase self-center shadow">
                  SAVE ${dollarSaving.toFixed(2)} ({percentageSaving}%)
                </div>
              )}
            </div>

            {/* Key Features Bullet List */}
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#E6E8EB]">
              {deal.features.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-[10px]">
                    ✓
                  </div>
                  <span className="truncate">{f}</span>
                </li>
              ))}
            </ul>

            {/* Stock Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-bold text-[#AEB3BA]">
                <span>Warehouse Stock Remaining</span>
                <span className="text-[#B8E62E] font-black">{deal.stock} UNITS LEFT</span>
              </div>
              <div className="w-full bg-[#202329] h-2.5 rounded-full overflow-hidden border border-[#2C3038]">
                <div 
                  className="bg-[#B8E62E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, (deal.stock / 30) * 100))}%` }}
                />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => addToCart(deal, 1)}
                className="flex-1 bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs sm:text-sm md:text-base py-3 px-4 sm:px-6 rounded-lg shadow-xl flex items-center justify-center gap-2 uppercase transition-transform active:scale-95 min-w-[180px]"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>SNAG THIS LOOT NOW</span>
              </button>

              <button
                onClick={() => navigateToProduct(deal.id)}
                className="bg-[#202329] hover:bg-[#2C3038] border border-[#2C3038] text-white font-bold text-xs sm:text-sm py-3 px-4 sm:px-5 rounded-lg uppercase transition-colors"
              >
                FULL SPECS & PHOTOS
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
