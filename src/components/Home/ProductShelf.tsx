import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Flame, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard/ProductCard';
import { useStore } from '../../context/StoreContext';

interface ProductShelfProps {
  title: string;
  subtitle?: string;
  products: Product[];
  badgeText?: string;
  badgeColor?: string;
  targetDeptSlug?: string;
  filterOption?: any;
}

export const ProductShelf: React.FC<ProductShelfProps> = ({
  title,
  subtitle,
  products,
  badgeText,
  badgeColor = 'bg-[#B8E62E] text-[#14161A]',
  targetDeptSlug,
  filterOption
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { navigateToDepartment, updateFilters, setCurrentView } = useStore();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleViewAll = () => {
    if (targetDeptSlug) {
      navigateToDepartment(targetDeptSlug);
    } else if (filterOption) {
      updateFilters(filterOption);
      setCurrentView('catalog');
    } else {
      setCurrentView('catalog');
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-5 sm:py-7 bg-[#14161A] w-full max-w-full box-border border-b border-[#2C3038]/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        {/* Shelf Header */}
        <div className="flex items-center justify-between mb-3.5 border-b border-[#2C3038] pb-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {badgeText && (
              <span className={`${badgeColor} text-[10px] font-black uppercase px-2 py-0.5 rounded shadow tracking-wider flex-shrink-0`}>
                {badgeText}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#AEB3BA] font-medium mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleViewAll}
              className="text-xs font-black text-[#B8E62E] hover:text-white flex items-center gap-1 uppercase tracking-wider mr-1 sm:mr-2 hidden sm:flex"
            >
              <span>See All ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                className="p-1.5 rounded-lg bg-[#202329] border border-[#2C3038] hover:border-[#B8E62E] text-white shadow-sm active:scale-95 transition-all"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-1.5 rounded-lg bg-[#202329] border border-[#2C3038] hover:border-[#B8E62E] text-white shadow-sm active:scale-95 transition-all"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontally Scrollable Product Row */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory min-w-0"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[210px] sm:w-[250px] md:w-[270px] flex-shrink-0 snap-start flex flex-col min-w-0"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
