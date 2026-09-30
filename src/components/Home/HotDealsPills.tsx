import React from 'react';
import { Flame, Sparkles, Tag, DollarSign, Wrench, Car, Disc, Cpu, Clock, Zap } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const PILLS = [
  { label: '🔥 All Hot Deals', filter: { isHotDeal: true }, icon: Flame, color: 'bg-[#E21C21] text-white hover:bg-red-700' },
  { label: '💥 Warehouse Clearance', filter: { isClearance: true }, icon: Tag, color: 'bg-[#14161A] text-[#B8E62E] border border-[#B8E62E] hover:bg-[#202329]' },
  { label: '💰 Under $10 Loot', filter: { maxPrice: 10 }, icon: DollarSign, color: 'bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338]' },
  { label: '🏷️ Under $20 Loot', filter: { maxPrice: 20 }, icon: DollarSign, color: 'bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338]' },
  { label: '💵 Under $50 Loot', filter: { maxPrice: 50 }, icon: DollarSign, color: 'bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338]' },
  { label: '🚗 Automotive Deals', deptSlug: 'automotive', icon: Car, color: 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] hover:border-[#B8E62E]' },
  { label: '🔧 Tradie Tool Deals', deptSlug: 'tools', icon: Wrench, color: 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] hover:border-[#B8E62E]' },
  { label: '⚡ Fast Chargers & Tech', deptSlug: 'electronics', icon: Cpu, color: 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] hover:border-[#B8E62E]' },
  { label: '💿 Vinyl & 4K Blu-ray', deptSlug: 'entertainment', icon: Disc, color: 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] hover:border-[#B8E62E]' },
  { label: '✨ Newly Listed Loot', filter: { sort: 'newest' }, icon: Sparkles, color: 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] hover:border-[#B8E62E]' }
];

export const HotDealsPills: React.FC = () => {
  const { navigateToDepartment, updateFilters, setCurrentView } = useStore();

  return (
    <section className="bg-[#14161A] border-b border-[#2C3038] py-2.5 shadow-inner w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#B8E62E] tracking-wider flex-shrink-0">
            <Zap className="w-4 h-4 text-[#B8E62E] fill-[#B8E62E]" />
            <span className="hidden sm:inline">QUICK LOOT:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 min-w-0 w-full">
            {PILLS.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (pill.deptSlug) {
                    navigateToDepartment(pill.deptSlug);
                  } else {
                    updateFilters(pill.filter || {});
                    setCurrentView('catalog');
                  }
                }}
                className={`text-xs font-black px-3.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1.5 transition-all shadow-sm active:scale-95 flex-shrink-0 ${pill.color}`}
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
