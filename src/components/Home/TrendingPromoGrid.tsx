import React from 'react';
import { Flame, ArrowRight, Wrench, Car, Cpu, Home, Tag, Disc } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const TRENDING_CARDS = [
  {
    id: 'tc-1',
    title: 'Automotive & 4WD Clearance',
    subtitle: '130A Alternators, Brake Kits & Light Bars',
    badge: 'UP TO 65% OFF',
    badgeColor: 'bg-[#E21C21]',
    deptSlug: 'automotive',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80',
    icon: Car
  },
  {
    id: 'tc-2',
    title: 'Workshop & Tradie Tool Deals',
    subtitle: '216-Pc Socket Sets, Drills & Ratchet Straps',
    badge: 'FROM $18.95',
    badgeColor: 'bg-[#B8E62E] text-[#14161A]',
    deptSlug: 'tools',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80',
    icon: Wrench
  },
  {
    id: 'tc-3',
    title: 'Tech Loot & GaN Chargers',
    subtitle: '100W Super Chargers, M.2 SSDs & Mech Keyboards',
    badge: 'POPULAR',
    badgeColor: 'bg-[#14161A] text-[#B8E62E]',
    deptSlug: 'electronics',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80',
    icon: Cpu
  },
  {
    id: 'tc-4',
    title: 'Certified Refurbished & Open Box',
    subtitle: 'Grade-A iPads, Air Fryers & Espresso Machines',
    badge: 'TESTED & GUARANTEED',
    badgeColor: 'bg-emerald-600 text-white',
    deptSlug: 'clearance',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80',
    icon: Tag
  },
  {
    id: 'tc-5',
    title: 'Australian Vinyl & 4K Cinema',
    subtitle: 'Midnight Oil, Mad Max 4K Steelbooks & PS5 Games',
    badge: 'BARGAINS',
    badgeColor: 'bg-blue-600 text-white',
    deptSlug: 'entertainment',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=80',
    icon: Disc
  },
  {
    id: 'tc-6',
    title: 'Under $20 Bargain Bin',
    subtitle: '10-Pack Microfibres, OBD2 Scanners & Cables',
    badge: 'SERIOUSLY CHEAP',
    badgeColor: 'bg-[#E21C21]',
    deptSlug: 'clearance',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&auto=format&fit=crop&q=80',
    icon: Tag
  }
];

export const TrendingPromoGrid: React.FC = () => {
  const { navigateToDepartment } = useStore();

  return (
    <section className="py-6 sm:py-8 bg-[#14161A] border-b border-[#2C3038] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        {/* Section Heading */}
        <div className="flex items-center justify-between mb-4 border-b border-[#2C3038] pb-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-[#B8E62E] text-[#14161A] p-1.5 rounded font-black flex-shrink-0">
              <Flame className="w-5 h-5 text-[#E21C21]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight uppercase truncate">
                What’s Trending
              </h2>
              <p className="text-xs text-[#AEB3BA] font-medium truncate">
                High-demand department promotions & seasonal warehouse clearance
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateToDepartment(null)}
            className="text-xs font-black text-[#B8E62E] hover:text-white flex items-center gap-1 uppercase tracking-wider group flex-shrink-0"
          >
            <span className="hidden sm:inline">View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 6-Card Responsive Promotional Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
          {TRENDING_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigateToDepartment(card.deptSlug)}
                className="group cursor-pointer rounded-xl border border-[#2C3038] hover:border-[#B8E62E] bg-[#202329] p-3.5 flex items-center gap-3.5 shadow-sm hover:shadow-lg transition-all duration-200 min-w-0"
              >
                {/* Promo Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-[#14161A] flex-shrink-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  />
                  <div className="absolute top-1 left-1">
                    <span className={`${card.badgeColor} text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow tracking-tight`}>
                      {card.badge}
                    </span>
                  </div>
                </div>

                {/* Promo Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#AEB3BA] uppercase mb-0.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-[#B8E62E] flex-shrink-0" />
                    <span className="truncate">Department Deal</span>
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-white group-hover:text-[#B8E62E] leading-snug line-clamp-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#AEB3BA] font-medium line-clamp-2 mt-0.5 mb-2">
                    {card.subtitle}
                  </p>
                  <div className="text-xs font-black text-[#B8E62E] group-hover:text-white flex items-center gap-1">
                    <span>Shop Deals</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
