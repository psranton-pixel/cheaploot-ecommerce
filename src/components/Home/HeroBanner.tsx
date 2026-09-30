import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Clock, ArrowRight, ShieldCheck, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    badge: 'CHEAPLOOT PRICE SMASH',
    headline: 'THOUSANDS OF PRODUCTS. SERIOUSLY CHEAP PRICES.',
    subhead: 'Massive warehouse price drops on socket sets, 130A alternators, GaN chargers & power tools.',
    tagline: 'Australian Stock • Direct Dispatch • 30-Day Easy Returns',
    bgGradient: 'from-[#111111] via-[#1a1a1a] to-[#292929]',
    borderColor: '#FFD400',
    cta: 'SHOP PRICE SMASH',
    targetDept: 'tools',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&auto=format&fit=crop&q=80',
    highlightBadge: 'UP TO 70% OFF'
  },
  {
    id: 'slide-2',
    badge: 'WAREHOUSE CLEARANCE',
    headline: 'OVERSTOCK & REFURBISHED TECH LOOT',
    subhead: 'Certified Refurbished iPads, 100W GaN Fast Chargers & TKL Mechanical Gaming Keyboards.',
    tagline: 'Inspected by CheapLoot Technicians with 12-Month Guarantee',
    bgGradient: 'from-[#1a1111] via-[#221515] to-[#111111]',
    borderColor: '#E21C21',
    cta: 'EXPLORE TECH CLEARANCE',
    targetDept: 'electronics',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=900&auto=format&fit=crop&q=80',
    highlightBadge: 'FROM $19.95'
  },
  {
    id: 'slide-3',
    badge: 'UNDER $20 BARGAIN BIN',
    headline: 'ESSENTIAL TRADIE & AUTO ACCESSORIES',
    subhead: '4-Pack Ratchet Straps, OBD2 Bluetooth Scanners, 500GSM Microfibre & GaN Cables.',
    tagline: 'Stock Up For Your Ute, Workshop & Garage',
    bgGradient: 'from-[#111815] via-[#18241e] to-[#111111]',
    borderColor: '#10B981',
    cta: 'SHOP UNDER $20 LOOT',
    targetDept: 'clearance',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&auto=format&fit=crop&q=80',
    highlightBadge: 'OVER 150+ ITEMS'
  }
];

export const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { navigateToDepartment } = useStore();

  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 48 });

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide autoplay
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden bg-[#14161A] text-white border-b-2 border-[#B8E62E] shadow-2xl w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full max-w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center min-w-0">
          {/* Main Hero Copy & CTAs */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="bg-[#B8E62E] text-[#14161A] font-black text-xs px-2.5 sm:px-3 py-1 rounded uppercase tracking-wider flex items-center gap-1 shadow">
                <Flame className="w-3.5 h-3.5 text-[#E21C21]" /> {slide.badge}
              </span>
              <span className="bg-[#E21C21] text-white font-black text-xs px-2 py-1 rounded uppercase tracking-wider">
                {slide.highlightBadge}
              </span>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-[#202329] border border-[#2C3038] px-2 py-1 rounded text-[#AEB3BA]">
                <Clock className="w-3 h-3 text-[#B8E62E]" />
                <span>DEALS REFRESH:</span>
                <span className="font-mono text-[#B8E62E] font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight uppercase break-words">
              {slide.headline}
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-[#AEB3BA] font-medium max-w-xl">
              {slide.subhead}
            </p>

            <div className="text-xs text-[#B8E62E] font-bold tracking-wide">
              {slide.tagline}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => navigateToDepartment(slide.targetDept)}
                className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 transition-transform active:scale-95 flex-shrink-0"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={() => navigateToDepartment('clearance')}
                className="bg-[#202329] hover:bg-[#2C3038] border border-[#2C3038] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-lg uppercase transition-colors flex-shrink-0"
              >
                VIEW CLEARANCE LIST
              </button>
            </div>
          </div>

          {/* Hero Promotional Visual Graphic */}
          <div className="lg:col-span-5 relative w-full min-w-0">
            <div className="relative rounded-xl overflow-hidden border border-[#2C3038] shadow-2xl aspect-[16/10] sm:aspect-[4/3] bg-[#202329] group w-full">
              <img
                src={slide.image}
                alt={slide.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14161A]/95 via-[#14161A]/30 to-transparent flex flex-col justify-end p-3.5 sm:p-5">
                <div className="bg-[#B8E62E] text-[#14161A] text-[10px] sm:text-xs font-black px-2 py-0.5 rounded uppercase self-start mb-1">
                  GENUINE MERCHANDISE
                </div>
                <div className="text-white font-black text-base sm:text-lg leading-tight line-clamp-2">
                  {slide.headline}
                </div>
                <div className="text-[11px] text-[#AEB3BA] font-medium mt-0.5">
                  Dispatched same-day from Geelong & Werribee Hubs
                </div>
              </div>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1.5">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all ${
                      idx === currentSlide ? 'w-6 sm:w-8 bg-[#B8E62E]' : 'w-2 bg-[#2C3038]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  className="p-1 sm:p-1.5 rounded bg-[#202329] hover:bg-[#2C3038] text-white border border-[#2C3038]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="p-1 sm:p-1.5 rounded bg-[#202329] hover:bg-[#2C3038] text-white border border-[#2C3038]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
