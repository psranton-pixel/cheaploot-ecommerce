import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, Grid, LayoutGrid, List, ChevronRight, X, 
  Sparkles, Check, Flame, Car, ArrowRight, RotateCcw, Filter, AlertCircle 
} from 'lucide-react';
import { ProductCard } from '../ProductCard/ProductCard';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

export const CatalogPage: React.FC = () => {
  const { 
    products, 
    departments, 
    selectedDepartment, 
    selectedCategory, 
    searchQuery, 
    setSearchQuery, 
    isAiSearchActive, 
    setIsAiSearchActive, 
    userVehicle, 
    navigateToDepartment,
    activeFilters,
    updateFilters
  } = useStore();

  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>('grid');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>(activeFilters.maxPrice ? String(activeFilters.maxPrice) : '');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyClearance, setOnlyClearance] = useState(activeFilters.isClearance || false);
  const [onlySale, setOnlySale] = useState(activeFilters.isSale || false);
  const [onlyVehicleFits, setOnlyVehicleFits] = useState(false);
  const [sortBy, setSortBy] = useState<string>(activeFilters.sort || 'popular');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync with activeFilters changes from header
  useEffect(() => {
    if (activeFilters.maxPrice) setMaxPrice(String(activeFilters.maxPrice));
    if (activeFilters.isClearance !== undefined) setOnlyClearance(activeFilters.isClearance);
    if (activeFilters.isSale !== undefined) setOnlySale(activeFilters.isSale);
    if (activeFilters.sort) setSortBy(activeFilters.sort);
  }, [activeFilters]);

  // Handle AI Search Query
  useEffect(() => {
    if (isAiSearchActive && searchQuery.trim()) {
      setIsAiLoading(true);
      fetch('/api/gemini/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && data.success && data.aiAnalysis) {
            setAiAnalysis(data.aiAnalysis);
            if (data.aiAnalysis.maxPrice) setMaxPrice(String(data.aiAnalysis.maxPrice));
          }
        })
        .catch(() => {
          // Graceful fallback
        })
        .finally(() => setIsAiLoading(false));
    } else {
      setAiAnalysis(null);
    }
  }, [isAiSearchActive, searchQuery]);

  // Extract available brands
  const brandsList = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  // Find department meta
  const currentDept = departments.find(d => d.slug === selectedDepartment);

  // Filter & Sort Products
  const filteredProducts = products.filter(product => {
    const prodDept = String(product.department || '').toLowerCase();
    const prodCat = String(product.category || '').toLowerCase();
    const prodSubCat = String(product.subCategory || '').toLowerCase();

    // Department Filter
    if (selectedDepartment && selectedDepartment !== 'all') {
      const selDept = String(selectedDepartment).toLowerCase();
      const currentDeptName = currentDept ? String(currentDept.name).toLowerCase() : '';
      const matchDept = prodDept.includes(selDept) || (currentDeptName && prodDept === currentDeptName);
      if (!matchDept && selectedDepartment !== 'clearance') return false;
      if (selectedDepartment === 'clearance' && !product.isClearance && !product.isUsedOrRefurb) return false;
    }

    // Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      const selCat = String(selectedCategory).toLowerCase();
      const matchCat = prodCat.includes(selCat) || prodSubCat.includes(selCat);
      if (!matchCat) return false;
    }

    // Search Query Filter
    if (searchQuery.trim() && !isAiSearchActive) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/);
      const tagsStr = Array.isArray(product.tags) ? product.tags.join(' ') : '';
      const text = `${product.title || ''} ${product.brand || ''} ${product.sku || ''} ${product.barcode || ''} ${product.mpn || ''} ${prodCat} ${prodDept} ${product.description || ''} ${tagsStr}`.toLowerCase();
      const matchesAll = terms.every(t => text.includes(t));
      if (!matchesAll) return false;
    }

    // Condition Filter
    if (selectedConditions.length > 0) {
      if (!selectedConditions.includes(product.condition)) return false;
    }

    // Price Range Filter
    if (minPrice && product.price < parseFloat(minPrice)) return false;
    if (maxPrice && product.price > parseFloat(maxPrice)) return false;

    // In Stock Filter
    if (onlyInStock && product.stock <= 0) return false;

    // Clearance Filter
    if (onlyClearance && !product.isClearance) return false;

    // Sale Filter
    if (onlySale && !product.isSale && (!product.wasPrice || product.wasPrice <= product.price)) return false;

    // Brand Filter
    if (selectedBrand !== 'all' && product.brand !== selectedBrand) return false;

    // Vehicle Fitment Filter
    if (onlyVehicleFits && userVehicle) {
      if (!product.fitment || product.fitment.length === 0) return false;
      const matchesVehicle = product.fitment.some(f => 
        f.make.toLowerCase() === userVehicle.make.toLowerCase() &&
        userVehicle.year >= f.yearFrom &&
        userVehicle.year <= f.yearTo &&
        (!f.model || product.title.toLowerCase().includes(userVehicle.model.toLowerCase()) || f.model.toLowerCase().includes(userVehicle.model.toLowerCase()))
      );
      if (!matchesVehicle) return false;
    }

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'saving_desc') {
      const saveA = (a.wasPrice || a.price) - a.price;
      const saveB = (b.wasPrice || b.price) - b.price;
      return saveB - saveA;
    }
    if (sortBy === 'newest') return new Date(b.dateListed).getTime() - new Date(a.dateListed).getTime();
    if (sortBy === 'rating') return b.rating - a.rating;
    // Default popular
    return (b.salesCount || 0) - (a.salesCount || 0);
  });

  const resetAllFilters = () => {
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
    setOnlyClearance(false);
    setOnlySale(false);
    setOnlyVehicleFits(false);
    setSelectedBrand('all');
    setSortBy('popular');
    setIsAiSearchActive(false);
    setSearchQuery('');
  };

  const activeFilterCount = 
    selectedConditions.length + 
    (minPrice ? 1 : 0) + 
    (maxPrice ? 1 : 0) + 
    (onlyInStock ? 1 : 0) + 
    (onlyClearance ? 1 : 0) + 
    (onlySale ? 1 : 0) + 
    (onlyVehicleFits ? 1 : 0) + 
    (selectedBrand !== 'all' ? 1 : 0);

  return (
    <div className="py-4 sm:py-6 bg-[#14161A] min-h-screen w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4 w-full max-w-full min-w-0">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-[#AEB3BA] font-semibold overflow-x-auto no-scrollbar min-w-0">
          <button onClick={() => navigateToDepartment(null)} className="hover:text-white flex-shrink-0">
            CheapLoot
          </button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <button 
            onClick={() => navigateToDepartment(selectedDepartment)}
            className={`capitalize flex-shrink-0 ${!selectedCategory ? 'text-[#B8E62E] font-bold' : 'hover:text-white'}`}
          >
            {selectedDepartment ? selectedDepartment.replace('-', ' ') : 'All Products'}
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-[#B8E62E] font-bold capitalize flex-shrink-0">
                {selectedCategory.replace('-', ' ')}
              </span>
            </>
          )}
        </div>

        {/* AI Natural Language Analysis Alert Banner */}
        {isAiSearchActive && (
          <div className="bg-[#202329] text-white p-3 sm:p-4 rounded-xl border border-[#B8E62E] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase text-[#B8E62E]">CheapLoot AI Query Engine</span>
                  <span className="text-[10px] bg-[#E21C21] text-white font-black px-1.5 py-0.5 rounded">NATURAL LANGUAGE</span>
                </div>
                <div className="text-sm font-bold text-gray-100 truncate">
                  {isAiLoading ? 'Analyzing warehouse catalogue & fitment database...' : (aiAnalysis?.explanation || `Searching catalogue for: "${searchQuery}"`)}
                </div>
              </div>
            </div>

            <button
              onClick={() => { setIsAiSearchActive(false); setSearchQuery(''); }}
              className="text-xs bg-[#14161A] hover:bg-black text-[#AEB3BA] hover:text-white px-3 py-1.5 rounded-lg font-bold border border-[#2C3038] flex-shrink-0"
            >
              Clear AI Search
            </button>
          </div>
        )}

        {/* Department / Category Title Banner */}
        <div className="bg-[#202329] p-4 sm:p-6 rounded-xl border border-[#2C3038] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#B8E62E] text-[#14161A] text-xs font-black uppercase px-2 py-0.5 rounded">
                DEPARTMENT
              </span>
              <span className="text-xs font-bold text-[#AEB3BA]">
                Showing {sortedProducts.length} loot items
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1 truncate">
              {searchQuery ? `Search Results: "${searchQuery}"` : (currentDept ? currentDept.name : 'All CheapLoot Catalogue')}
            </h1>
            <p className="text-xs text-[#AEB3BA] font-medium mt-0.5">
              Direct from Geelong and Werribee distribution centres with Australia-wide delivery.
            </p>
          </div>

          {/* Quick Subcategory Pills */}
          {currentDept && (
            <div className="flex flex-wrap gap-1.5 max-w-md justify-start sm:justify-end min-w-0">
              {currentDept.subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => navigateToDepartment(currentDept.slug, sub.slug)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    selectedCategory === sub.slug 
                      ? 'bg-[#B8E62E] text-[#14161A]' 
                      : 'bg-[#14161A] text-[#AEB3BA] hover:text-white border border-[#2C3038] hover:border-[#B8E62E]'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
          {/* Desktop Left Faceted Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="bg-[#202329] rounded-xl border border-[#2C3038] p-4 shadow-sm space-y-5">
              {/* Filter Header */}
              <div className="flex items-center justify-between border-b border-[#2C3038] pb-3">
                <div className="flex items-center gap-2 font-black text-sm uppercase text-white">
                  <SlidersHorizontal className="w-4 h-4 text-[#B8E62E]" />
                  <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] font-bold text-[#E21C21] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset All
                  </button>
                )}
              </div>

              {/* Vehicle Compatibility Filter Toggle */}
              {userVehicle && (
                <div className="bg-[#14161A] border border-[#B8E62E]/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B8E62E] flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      Fits My {userVehicle.model}
                    </span>
                    <input
                      type="checkbox"
                      checked={onlyVehicleFits}
                      onChange={(e) => setOnlyVehicleFits(e.target.checked)}
                      className="w-4 h-4 text-[#B8E62E] rounded accent-[#B8E62E]"
                    />
                  </div>
                  <p className="text-[11px] text-[#AEB3BA] font-medium">
                    Filter parts verified to fit your {userVehicle.year} {userVehicle.make} {userVehicle.model}
                  </p>
                </div>
              )}

              {/* Price Range Slider & Inputs */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                  Price (AUD)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-[#14161A] border border-[#2C3038] text-white rounded-lg p-1.5 text-xs font-bold focus:border-[#B8E62E] outline-none"
                  />
                  <span className="text-[#AEB3BA] font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-[#14161A] border border-[#2C3038] text-white rounded-lg p-1.5 text-xs font-bold focus:border-[#B8E62E] outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {[10, 20, 50, 100, 200].map(p => (
                    <button
                      key={p}
                      onClick={() => setMaxPrice(String(p))}
                      className="text-[10px] bg-[#14161A] hover:bg-[#B8E62E] text-[#AEB3BA] hover:text-[#14161A] border border-[#2C3038] px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      &le; ${p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Filters */}
              <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                <label className="block text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                  Condition
                </label>
                {['Brand New', 'Open Box', 'Refurbished', 'Excellent Used'].map(cond => (
                  <label key={cond} className="flex items-center gap-2 text-xs font-semibold text-[#AEB3BA] cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedConditions([...selectedConditions, cond]);
                        else setSelectedConditions(selectedConditions.filter(c => c !== cond));
                      }}
                      className="w-4 h-4 rounded accent-[#B8E62E]"
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>

              {/* Special Promotion Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                <label className="block text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                  Promotions
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#AEB3BA] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={onlyClearance}
                    onChange={(e) => setOnlyClearance(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#E21C21]"
                  />
                  <span className="text-[#E21C21] font-bold">Clearance Items Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#AEB3BA] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#B8E62E]"
                  />
                  <span>On Sale / Discounted</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#AEB3BA] cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#B8E62E]"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              {/* Brand Selector */}
              <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                <label className="block text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-[#14161A] border border-[#2C3038] text-white rounded-lg p-1.5 text-xs font-bold focus:border-[#B8E62E] outline-none"
                >
                  <option value="all">All Brands ({brandsList.length})</option>
                  {brandsList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Right Product Grid & Controls */}
          <main className="lg:col-span-9 space-y-4 min-w-0">
            {/* Top Toolbar: View Switcher, Sort & Mobile Filter Button */}
            <div className="bg-[#202329] p-3 rounded-xl border border-[#2C3038] shadow-sm flex flex-wrap items-center justify-between gap-3 min-w-0">
              {/* Mobile Filter Trigger */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-[#B8E62E] text-[#14161A] font-black text-xs px-3 py-2 rounded-lg shadow active:scale-95 transition-transform"
              >
                <Filter className="w-4 h-4" />
                <span>FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>

              {/* Active Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
                {activeFilterCount > 0 && (
                  <span className="text-[#AEB3BA] font-bold hidden sm:inline">Active:</span>
                )}
                {onlyClearance && (
                  <span className="bg-[#14161A] text-[#E21C21] border border-[#E21C21] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Clearance <button onClick={() => setOnlyClearance(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {maxPrice && (
                  <span className="bg-[#14161A] text-[#B8E62E] border border-[#B8E62E] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    &le; ${maxPrice} <button onClick={() => setMaxPrice('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedConditions.map(c => (
                  <span key={c} className="bg-[#14161A] text-[#AEB3BA] border border-[#2C3038] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    {c} <button onClick={() => setSelectedConditions(selectedConditions.filter(x => x !== c))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>

              {/* Sort & Grid Mode Switcher */}
              <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#AEB3BA] hidden sm:inline">SORT:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#14161A] text-white text-xs font-black p-1.5 rounded-lg border border-[#2C3038] focus:border-[#B8E62E] outline-none"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="saving_desc">Biggest $ Savings</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest Loot</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>

                {/* View Switchers */}
                <div className="hidden sm:flex items-center gap-1 bg-[#14161A] p-1 rounded-lg border border-[#2C3038]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#B8E62E] text-[#14161A]' : 'text-[#AEB3BA] hover:text-white'}`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`p-1 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-[#B8E62E] text-[#14161A]' : 'text-[#AEB3BA] hover:text-white'}`}
                    title="Compact Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#B8E62E] text-[#14161A]' : 'text-[#AEB3BA] hover:text-white'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid Output */}
            {sortedProducts.length > 0 ? (
              <div className={
                viewMode === 'compact'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 min-w-0'
                  : viewMode === 'list'
                  ? 'space-y-3 min-w-0'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 min-w-0'
              }>
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    compact={viewMode === 'compact'}
                  />
                ))}
              </div>
            ) : (
              /* No-Result Search State */
              <div className="bg-[#202329] p-6 sm:p-8 rounded-xl border border-[#2C3038] text-center space-y-4 shadow-sm min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#14161A] text-[#B8E62E] border border-[#2C3038] flex items-center justify-center font-black mx-auto">
                  <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#E21C21]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white">
                    We Couldn’t Find That Loot!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#AEB3BA] font-medium max-w-md mx-auto mt-1">
                    This shelf is looking a bit bare. Try clearing your filters, checking spelling, or browsing our hot deals below.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={resetAllFilters}
                    className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-4 py-2 rounded-lg uppercase shadow"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigateToDepartment(null)}
                    className="bg-[#14161A] hover:bg-black text-white border border-[#2C3038] font-bold text-xs px-4 py-2 rounded-lg uppercase"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-end animate-in fade-in duration-200">
          <div className="bg-[#202329] border-l border-[#2C3038] w-full max-w-xs sm:max-w-sm h-full p-4 overflow-y-auto space-y-5 flex flex-col justify-between shadow-2xl safe-area-pb">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#2C3038] pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#B8E62E]" />
                  <span className="font-black text-base uppercase text-white">Filter CheapLoot</span>
                </div>
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)} 
                  className="p-1 text-[#AEB3BA] hover:text-white rounded-lg hover:bg-[#14161A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price Filters */}
              <div className="space-y-2">
                <label className="font-black uppercase text-xs text-[#AEB3BA] block">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Under $20', val: '20' },
                    { label: 'Under $50', val: '50' },
                    { label: 'Under $100', val: '100' },
                    { label: 'All Prices', val: '' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setMaxPrice(preset.val)}
                      className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                        maxPrice === preset.val
                          ? 'bg-[#B8E62E] text-[#14161A] border-[#B8E62E]'
                          : 'bg-[#14161A] text-[#AEB3BA] border-[#2C3038]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Custom Max Price ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#14161A] border border-[#2C3038] text-white p-2 rounded-lg text-xs font-bold focus:border-[#B8E62E] outline-none"
                />
              </div>

              {/* Quick Deal Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                <label className="font-black uppercase text-xs text-[#AEB3BA] block">Deals & Stock</label>
                <div className="space-y-1.5 text-xs font-bold text-[#E6E8EB]">
                  <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#14161A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyClearance}
                      onChange={(e) => setOnlyClearance(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E21C21]"
                    />
                    <span>🔥 Clearance & Price Smash Only</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#14161A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#B8E62E]"
                    />
                    <span>📦 In Stock Items Only</span>
                  </label>
                </div>
              </div>

              {/* Vehicle Compatibility Toggle */}
              {userVehicle && (
                <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                  <label className="font-black uppercase text-xs text-[#AEB3BA] block">Vehicle Compatibility</label>
                  <button
                    onClick={() => setOnlyVehicleFits(!onlyVehicleFits)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-bold flex items-center justify-between transition-colors ${
                      onlyVehicleFits
                        ? 'bg-[#14161A] border-[#B8E62E] text-[#B8E62E]'
                        : 'bg-[#14161A] border-[#2C3038] text-[#AEB3BA]'
                    }`}
                  >
                    <div className="text-left">
                      <div>Fits {userVehicle.year} {userVehicle.model} Only</div>
                      <div className="text-[10px] text-[#AEB3BA] font-normal">Strict compatibility filter</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${onlyVehicleFits ? 'bg-[#B8E62E] text-[#14161A]' : 'border-gray-500'}`}>
                      {onlyVehicleFits && '✓'}
                    </div>
                  </button>
                </div>
              )}

              {/* Conditions */}
              <div className="space-y-2 pt-2 border-t border-[#2C3038]">
                <label className="font-black uppercase text-xs text-[#AEB3BA] block">Condition</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  {['Brand New', 'Open Box', 'Refurbished', 'Excellent Used'].map(cond => (
                    <label key={cond} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#14161A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(cond)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedConditions([...selectedConditions, cond]);
                          else setSelectedConditions(selectedConditions.filter(c => c !== cond));
                        }}
                        className="rounded accent-[#B8E62E]"
                      />
                      <span className="text-[#AEB3BA] font-medium">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#2C3038] space-y-2">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black py-3 rounded-lg uppercase tracking-wide text-xs shadow active:scale-95 transition-transform"
              >
                Show {sortedProducts.length} Results
              </button>
              <button
                onClick={() => {
                  resetAllFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full py-2 text-xs font-bold text-[#AEB3BA] hover:text-[#E21C21] underline"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
