import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Heart, Car, Sparkles, ChevronDown, 
  Layers, Package, ShieldCheck, MapPin, X, Flame, SlidersHorizontal, ArrowRight, Wrench, Cpu, Home, Disc, Tag, User, Store, Calendar, FileSpreadsheet
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const PROMO_MESSAGES = [
  '⚡ FREE SHIPPING ON ELIGIBLE ORDERS OVER $99 AUSTRALIA-WIDE',
  '🔥 NEW LOOT ADDED DAILY DIRECT FROM OUR WAREHOUSES',
  '🦘 100% AUSTRALIAN OWNED & OPERATED STOCK READY TO DISPATCH',
  '⚡ CLICK & COLLECT AVAILABLE IN GEELONG & WERRIBEE'
];

const DEPARTMENT_ICONS: Record<string, any> = {
  'Automotive & Car Parts': Car,
  'Tools & Power Tools': Wrench,
  'Electronics & Computers': Cpu,
  'Home Appliances & Living': Home,
  'DVDs, Vinyl & Gaming': Disc,
  'Clearance & Used Loot': Tag
};

export const Header: React.FC = () => {
  const { 
    cart, 
    wishlist, 
    userVehicle, 
    setUserVehicle, 
    setCurrentView, 
    navigateToDepartment, 
    departments,
    searchQuery,
    setSearchQuery,
    setIsAiSearchActive,
    navigateToProduct,
    products,
    isVehicleModalOpen,
    setIsVehicleModalOpen
  } = useStore();

  const [promoIndex, setPromoIndex] = useState(0);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeDeptHover, setActiveDeptHover] = useState<string>(departments[0]?.id || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ year: 2016, make: 'Toyota', model: 'Hilux', series: 'GUN126', engine: '1GD-FTV 2.8L Turbo Diesel' });
  const [instantResults, setInstantResults] = useState<any>({ products: [], categories: [], brands: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Rotating promo bar
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_MESSAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Fetch instant search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setInstantResults({
        products: products.slice(0, 4),
        categories: departments.slice(0, 4),
        brands: ['Sidchrome Style', 'ApexAuto', 'VoltForge', 'Cucina Luxe']
      });
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/instant?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setInstantResults(data);
          return;
        }
      } catch {
        // Fall back to local search below
      }

      // Local fallback search
      const q = searchQuery.toLowerCase();
      const matched = products.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      ).slice(0, 5);
      setInstantResults({
        products: matched,
        categories: departments.map(d => d.name).filter(c => c.toLowerCase().includes(q)),
        brands: ['ApexAuto', 'VoltForge', 'ProTorq', 'Sidchrome Style'].filter(b => b.toLowerCase().includes(q))
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [searchQuery, products, departments]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      setCurrentView('catalog');
    }
  };

  const handleSelectAiSearch = () => {
    setIsAiSearchActive(true);
    setIsSearchFocused(false);
    setCurrentView('catalog');
  };

  const activeDepartmentData = departments.find(d => d.id === activeDeptHover) || departments[0];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-[#14161A] text-[#E6E8EB] shadow-xl border-b-2 border-[#B8E62E] box-border">
      {/* 1. Top Rotating Promotional Announcement Bar (Scrolls naturally or stays lean) */}
      <div className="bg-[#202329] border-b border-[#2A2E37] px-3 py-1 text-xs text-[#B8E62E] font-bold tracking-wide w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
            <span className="bg-[#B8E62E] text-[#14161A] px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] uppercase font-black tracking-wider flex-shrink-0">
              HOT
            </span>
            <p className="truncate font-sans font-bold tracking-tight text-[11px] sm:text-xs text-[#E6E8EB]">
              {PROMO_MESSAGES[promoIndex]}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[#AEB3BA] font-medium text-xs flex-shrink-0 ml-3">
            <button 
              onClick={() => setCurrentView('admin')} 
              className="hover:text-yellow-300 transition-colors flex items-center gap-1.5 text-[#FFD400] font-black bg-neutral-900 px-2 py-0.5 rounded border border-[#FFD400]/40 shadow"
              title="Open Products & Bulk Editor"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFD400]" /> 
              <span>⚡ Bulk Edit & Inventory</span>
            </button>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => setCurrentView('sheets')} 
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400 font-bold"
              title="Google Sheets & Drive Sync Hub"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F9D58]" /> Sheets
            </button>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => setCurrentView('calendar')} 
              className="hover:text-[#4285F4] transition-colors flex items-center gap-1.5 text-sky-400 font-bold"
              title="Google Calendar Warehouse & Pickup Hub"
            >
              <Calendar className="w-3.5 h-3.5 text-[#4285F4]" /> Calendar
            </button>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => setCurrentView('tracking')} 
              className="hover:text-[#B8E62E] transition-colors flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5 text-[#B8E62E]" /> Track Order
            </button>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => setCurrentView('sell-stuff')} 
              className="hover:text-[#B8E62E] transition-colors text-white font-bold bg-[#2C3038] px-2 py-0.5 rounded"
            >
              Sell Your Stuff
            </button>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => setCurrentView('admin')} 
              className="hover:text-[#B8E62E] transition-colors flex items-center gap-1 text-[#B8E62E] font-bold"
            >
              <Store className="w-3.5 h-3.5" /> Staff Admin
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Header: Logo, Dominant Search, Vehicle Selector, Account & Cart */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 w-full max-w-full box-border">
        {/* CheapLoot Logo */}
        <button 
          onClick={() => setCurrentView('home')} 
          className="flex-shrink-0 text-left group focus:outline-none"
          id="cheaploot-main-logo"
        >
          <div className="bg-[#B8E62E] text-[#14161A] px-2 sm:px-3 py-1 rounded font-black tracking-tighter text-xl sm:text-2xl md:text-3xl leading-none flex items-baseline gap-1 group-hover:opacity-95 transition-opacity">
            <span>CHEAP</span>
            <span className="bg-[#14161A] text-[#B8E62E] px-1 py-0.5 rounded text-base sm:text-xl md:text-2xl tracking-normal">LOOT</span>
          </div>
          <span className="text-[10px] text-[#AEB3BA] font-semibold tracking-tight hidden lg:block mt-0.5">
            Thousands of products. Seriously cheap.
          </span>
        </button>

        {/* Dominant Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-0 max-w-3xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full min-w-0">
            <div className="relative w-full min-w-0">
              <input
                type="text"
                id="main-search-input"
                placeholder="Search products, brands, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-[#202329] text-[#FFFFFF] placeholder-[#AEB3BA] border border-[#2C3038] pl-3 pr-20 sm:pr-28 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-[#B8E62E] focus:ring-1 focus:ring-[#B8E62E] shadow-inner transition-colors box-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-16 sm:right-24 top-1/2 -translate-y-1/2 text-[#AEB3BA] hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Submit Search Button */}
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338] px-2.5 sm:px-3.5 py-1 rounded font-black text-xs flex items-center gap-1 transition-colors shadow flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">SEARCH</span>
            </button>
          </form>

          {/* AI Search Quick Trigger Chip (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 mt-1 absolute -bottom-5 left-1 text-[10px] text-[#AEB3BA]">
            <span className="text-[#B8E62E] font-bold">AI Query:</span>
            <button 
              onClick={() => { setSearchQuery('130A alternator for 2012 Hilux'); setIsAiSearchActive(true); setCurrentView('catalog'); }}
              className="hover:underline hover:text-white truncate max-w-[150px]"
            >
              "130A alternator for Hilux"
            </button>
            <span>•</span>
            <button 
              onClick={() => { setSearchQuery('Socket set under $100'); setIsAiSearchActive(true); setCurrentView('catalog'); }}
              className="hover:underline hover:text-white truncate max-w-[140px]"
            >
              "Socket set under $100"
            </button>
          </div>

          {/* Instant Search Dropdown Results */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#202329] text-[#FFFFFF] rounded-lg shadow-2xl border border-[#B8E62E] overflow-hidden z-50 animate-in fade-in-50 duration-150 max-w-full">
              {/* CheapLoot AI Natural Language Assistant Banner */}
              <div 
                onClick={handleSelectAiSearch}
                className="bg-[#14161A] text-white p-2.5 flex items-center justify-between cursor-pointer hover:bg-black transition-colors border-b border-[#2C3038]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[#B8E62E] flex items-center gap-1.5 truncate">
                      CheapLoot AI Smart Search
                      <span className="bg-[#E21C21] text-white text-[8px] px-1 py-0.2 rounded font-black">PRO</span>
                    </div>
                    <div className="text-[11px] text-[#AEB3BA] truncate">
                      Search using natural language or vehicle specs
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#B8E62E] flex-shrink-0 ml-2" />
              </div>

              <div className="p-2.5 sm:p-3 grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {/* Matched Products */}
                <div className="md:col-span-2">
                  <div className="text-[10px] font-black uppercase text-[#AEB3BA] tracking-wider mb-2">
                    Matching Products
                  </div>
                  <div className="space-y-1.5">
                    {instantResults.products && instantResults.products.length > 0 ? (
                      instantResults.products.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigateToProduct(p.id);
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center gap-2.5 p-1.5 hover:bg-[#2C3038] rounded cursor-pointer transition-colors group min-w-0"
                        >
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=100&auto=format&fit=crop&q=80'}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded border border-[#2C3038] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-[#AEB3BA] font-semibold truncate">{p.brand}</div>
                            <div className="text-xs font-bold text-white group-hover:text-[#B8E62E] line-clamp-1 truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-[#AEB3BA] flex items-center gap-2">
                              <span className="font-mono bg-[#14161A] px-1 rounded">{p.sku}</span>
                              <span className="text-[#B8E62E] font-semibold">{p.condition}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs sm:text-sm font-black text-[#B8E62E]">
                              ${p.price.toFixed(2)}
                            </div>
                            {p.wasPrice && (
                              <div className="text-[10px] text-gray-500 line-through">
                                ${p.wasPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#AEB3BA] py-2 italic">
                        No direct match found. Hit Enter to search all catalogue.
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories & Popular Brands */}
                <div className="border-t md:border-t-0 md:border-l border-[#2C3038] md:pl-3 pt-2 md:pt-0">
                  <div className="text-[10px] font-black uppercase text-[#AEB3BA] tracking-wider mb-1.5">
                    Categories
                  </div>
                  <div className="space-y-1 mb-2.5">
                    {departments.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          navigateToDepartment(d.slug);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left text-xs font-bold text-[#E6E8EB] hover:text-[#B8E62E] hover:bg-[#2C3038] p-1 rounded flex items-center justify-between"
                      >
                        <span className="truncate">{d.name}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 text-[#AEB3BA] flex-shrink-0" />
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-black uppercase text-[#AEB3BA] tracking-wider mb-1">
                    Popular Brands
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Sidchrome', 'ApexAuto', 'VoltForge', 'Apple', 'Brembo', 'Sony'].map(b => (
                      <button
                        key={b}
                        onClick={() => {
                          setSearchQuery(b);
                          setCurrentView('catalog');
                          setIsSearchFocused(false);
                        }}
                        className="text-[10px] bg-[#14161A] hover:bg-[#B8E62E] hover:text-[#14161A] text-[#AEB3BA] px-1.5 py-0.5 rounded font-semibold transition-colors"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Fitment Switcher Pill (Desktop) */}
        <button
          onClick={() => setIsVehicleModalOpen(true)}
          className="hidden xl:flex items-center gap-2 bg-[#202329] hover:bg-[#2C3038] border border-[#2C3038] hover:border-[#B8E62E] px-2.5 py-1.5 rounded-lg transition-all group text-left max-w-[180px] flex-shrink-0"
          title="Filter car parts and accessories for your vehicle"
        >
          <div className="w-6 h-6 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center flex-shrink-0">
            <Car className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="truncate min-w-0">
            <div className="text-[9px] uppercase font-black text-[#B8E62E] tracking-wider truncate">
              {userVehicle ? 'MY VEHICLE' : 'SELECT VEHICLE'}
            </div>
            <div className="text-[11px] font-bold text-white truncate">
              {userVehicle ? `${userVehicle.year} ${userVehicle.model}` : 'Check Fitment'}
            </div>
          </div>
        </button>

        {/* Action Icons: Wishlist, Mobile Vehicle, Cart */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile Quick Vehicle Trigger */}
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="xl:hidden p-1.5 text-[#AEB3BA] hover:text-[#B8E62E] relative rounded-lg hover:bg-[#202329] transition-colors flex items-center"
            title="Set vehicle fitment"
            id="header-mobile-vehicle-btn"
          >
            <Car className={`w-5 h-5 ${userVehicle ? 'text-[#B8E62E]' : 'text-[#AEB3BA]'}`} />
            {userVehicle && (
              <span className="w-2 h-2 bg-[#B8E62E] rounded-full absolute top-1 right-1" />
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={() => setCurrentView('catalog')}
            className="p-1.5 text-[#AEB3BA] hover:text-[#B8E62E] relative rounded-lg hover:bg-[#202329] transition-colors"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E21C21] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart with Live AUD Badge */}
          <button
            onClick={() => setCurrentView('cart')}
            id="header-cart-button"
            className="bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 font-black transition-transform active:scale-95 shadow flex-shrink-0"
          >
            <div className="relative flex items-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              {totalCartQty > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#14161A] text-[#B8E62E] text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#B8E62E]">
                  {totalCartQty}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] leading-none uppercase tracking-wider font-extrabold text-[#14161A]">
                CART
              </div>
              <div className="text-xs leading-tight font-black">
                ${cartSubtotal.toFixed(0)}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Category Navigation Bar & Mega Menu Toggle */}
      <nav className="bg-[#202329] border-t border-[#2A2E37] text-xs font-bold w-full max-w-full box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between overflow-x-auto no-scrollbar min-w-0 w-full">
          <div className="flex items-center gap-1 py-1 flex-shrink-0 min-w-0">
            {/* Mega Menu Button */}
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors flex-shrink-0 ${
                isMegaMenuOpen ? 'bg-[#B8E62E] text-[#14161A]' : 'bg-[#14161A] text-white hover:bg-[#2C3038]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-black tracking-wide uppercase text-[11px] sm:text-xs whitespace-nowrap">DEPARTMENTS</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Department Links */}
            {departments.slice(0, 5).map((dept) => {
              const Icon = DEPARTMENT_ICONS[dept.name] || Tag;
              return (
                <button
                  key={dept.id}
                  onClick={() => navigateToDepartment(dept.slug)}
                  className="hidden md:flex items-center gap-1 px-2 py-1 text-[#E6E8EB] hover:text-[#B8E62E] hover:bg-[#2C3038] rounded transition-colors whitespace-nowrap text-xs"
                >
                  <Icon className="w-3.5 h-3.5 text-[#B8E62E]" />
                  <span>{dept.name.split('&')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Promotional Hot Links */}
          <div className="flex items-center gap-1.5 flex-shrink-0 py-1 min-w-0">
            <button
              onClick={() => {
                navigateToDepartment('clearance');
              }}
              className="bg-[#E21C21] hover:bg-red-700 text-white font-black text-[11px] sm:text-xs px-2.5 py-1 rounded flex items-center gap-1 uppercase tracking-wider whitespace-nowrap flex-shrink-0"
            >
              <Flame className="w-3.5 h-3.5 fill-white" /> CLEARANCE
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                navigateToDepartment(null);
              }}
              className="text-[#B8E62E] hover:underline font-bold text-[11px] sm:text-xs px-1.5 py-1 flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> TODAY'S LOOT
            </button>

            <button
              onClick={() => setCurrentView('sell-stuff')}
              className="bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338] font-black text-[11px] sm:text-xs px-2 py-1 rounded transition-colors hidden sm:inline-block whitespace-nowrap flex-shrink-0"
            >
              SELL TO US
            </button>
          </div>
        </div>

        {/* 4. Desktop Mega Menu Dropdown */}
        {isMegaMenuOpen && (
          <div className="bg-[#14161A] border-t border-[#B8E62E] shadow-2xl p-4 sm:p-6 text-white animate-in slide-in-from-top-2 duration-150 max-w-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {/* Department Selector Column */}
              <div className="border-r border-[#2C3038] pr-4 space-y-1">
                <div className="text-xs uppercase font-black text-[#B8E62E] tracking-wider mb-2">
                  CheapLoot Departments
                </div>
                {departments.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.name] || Tag;
                  const isActive = dept.id === activeDeptHover;
                  return (
                    <button
                      key={dept.id}
                      onMouseEnter={() => setActiveDeptHover(dept.id)}
                      onClick={() => {
                        navigateToDepartment(dept.slug);
                        setIsMegaMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                        isActive ? 'bg-[#B8E62E] text-[#14161A]' : 'text-gray-300 hover:text-white hover:bg-[#202329]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{dept.name}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 -rotate-90 ${isActive ? 'text-[#14161A]' : 'text-gray-500'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Subcategories Grid */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeDepartmentData?.subcategories?.map((sub) => (
                  <div key={sub.id} className="space-y-2">
                    <button
                      onClick={() => {
                        navigateToDepartment(activeDepartmentData.slug, sub.slug);
                        setIsMegaMenuOpen(false);
                      }}
                      className="text-sm font-extrabold text-[#B8E62E] hover:underline block text-left"
                    >
                      {sub.name}
                    </button>
                    <ul className="space-y-1 text-xs text-gray-300">
                      {sub.items.map((item, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => {
                              setSearchQuery(item);
                              setCurrentView('catalog');
                              setIsMegaMenuOpen(false);
                            }}
                            className="hover:text-white hover:underline text-left"
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Department Featured Deal / Promo Banner */}
              <div className="hidden lg:block bg-[#202329] p-4 rounded-lg border border-[#2C3038] text-center space-y-3">
                <div className="text-xs uppercase font-black text-[#B8E62E] tracking-wider">
                  DEPARTMENT SPECIAL
                </div>
                <img
                  src={activeDepartmentData?.promoImage || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80'}
                  alt={activeDepartmentData?.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded border border-gray-700"
                />
                <div className="text-sm font-black text-white">
                  {activeDepartmentData?.featuredDeals}
                </div>
                <button
                  onClick={() => {
                    navigateToDepartment(activeDepartmentData.slug);
                    setIsMegaMenuOpen(false);
                  }}
                  className="w-full bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs py-2 rounded uppercase"
                >
                  SHOP {activeDepartmentData?.name.split('&')[0]}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Vehicle Fitment Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#202329] border-2 border-[#B8E62E] text-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2C3038] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black">
                  <Car className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Add Your Vehicle</h3>
                  <p className="text-xs text-[#AEB3BA]">Lock in exact fitment for car parts & tools</p>
                </div>
              </div>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Year</label>
                <select
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                  className="w-full bg-[#14161A] border border-[#2C3038] rounded p-2 text-white font-bold"
                >
                  {[2024, 2023, 2022, 2021, 2020, 2018, 2016, 2015, 2014, 2012, 2010, 2008, 2005, 2000, 1995].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Make</label>
                <select
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  className="w-full bg-[#14161A] border border-[#2C3038] rounded p-2 text-white font-bold"
                >
                  {['Toyota', 'Ford', 'Holden', 'Nissan', 'Mitsubishi', 'Isuzu', 'Mazda', 'Subaru', 'Volkswagen', 'Hyundai'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="e.g. Hilux, Ranger, Commodore, Patrol, D-Max"
                  className="w-full bg-[#14161A] border border-[#2C3038] rounded p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Engine / Series (Optional)</label>
                <input
                  type="text"
                  value={vehicleForm.engine}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, engine: e.target.value })}
                  placeholder="e.g. 1KD-FTV 3.0L Turbo Diesel, 3.2L Wildtrak"
                  className="w-full bg-[#14161A] border border-[#2C3038] rounded p-2 text-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setUserVehicle({
                    id: `veh-${Date.now()}`,
                    year: vehicleForm.year,
                    make: vehicleForm.make,
                    model: vehicleForm.model,
                    engine: vehicleForm.engine
                  });
                  setIsVehicleModalOpen(false);
                }}
                className="flex-1 bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black py-2 rounded text-sm uppercase"
              >
                Save Vehicle
              </button>
              {userVehicle && (
                <button
                  onClick={() => {
                    setUserVehicle(null);
                    setIsVehicleModalOpen(false);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-3 py-2 rounded text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
