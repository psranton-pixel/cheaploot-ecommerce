import React, { useState } from 'react';
import { 
  Heart, ShoppingCart, CheckCircle2, XCircle, ShieldCheck, 
  Truck, Store, Star, ArrowRight, Share2, HelpCircle, Flame, 
  Sparkles, Check, ChevronRight, AlertTriangle, MapPin, Package, MessageSquarePlus 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

export const ProductDetailPage: React.FC = () => {
  const { 
    products, 
    selectedProductId, 
    addToCart, 
    wishlist, 
    toggleWishlist, 
    userVehicle, 
    setUserVehicle, 
    setCurrentView,
    navigateToDepartment,
    navigateToProduct
  } = useStore();

  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'fitment' | 'shipping' | 'reviews' | 'qa'>('desc');
  const [postcode, setPostcode] = useState('2000');
  const [estimatedDelivery, setEstimatedDelivery] = useState<any>(null);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionSubmitted, setQuestionSubmitted] = useState(false);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const dollarSaving = product.wasPrice ? product.wasPrice - product.price : 0;
  const percentageSaving = product.wasPrice ? Math.round((dollarSaving / product.wasPrice) * 100) : 0;

  // Fitment verification
  let fitsVehicle = false;
  if (userVehicle && product.fitment) {
    fitsVehicle = product.fitment.some(f => 
      f.make.toLowerCase() === userVehicle.make.toLowerCase() &&
      userVehicle.year >= f.yearFrom &&
      userVehicle.year <= f.yearTo &&
      (!f.model || product.title.toLowerCase().includes(userVehicle.model.toLowerCase()) || f.model.toLowerCase().includes(userVehicle.model.toLowerCase()))
    );
  }

  const handleAddToCart = (directCheckout = false) => {
    addToCart(product, quantity);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 2500);
    if (directCheckout) {
      setCurrentView('cart');
    }
  };

  const handleEstimateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.length >= 4) {
      setEstimatedDelivery({
        standard: product.shippingClass === 'free' ? 'FREE' : '$9.95 (2-4 business days)',
        express: '$16.95 (1-2 business days)',
        clickAndCollect: 'FREE (Ready in 2 hours at Geelong & Werribee depots)'
      });
    }
  };

  // Related products
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.department === product.department || p.category === product.category))
    .slice(0, 4);

  return (
    <div className="py-4 sm:py-6 bg-[#14161A] min-h-screen text-white w-full max-w-full box-border pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4 w-full max-w-full min-w-0">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-[#AEB3BA] font-semibold overflow-x-auto no-scrollbar min-w-0">
          <button onClick={() => navigateToDepartment(null)} className="hover:text-white flex-shrink-0">
            CheapLoot
          </button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <button onClick={() => navigateToDepartment(product.department.toLowerCase())} className="hover:text-white flex-shrink-0">
            {product.department}
          </button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <button onClick={() => navigateToDepartment(product.department.toLowerCase(), product.category.toLowerCase())} className="hover:text-white flex-shrink-0">
            {product.category}
          </button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-[#B8E62E] font-bold truncate max-w-[200px] sm:max-w-none flex-shrink-0">
            {product.title}
          </span>
        </div>

        {/* Main Product Hero Box */}
        <div className="bg-[#202329] rounded-xl border border-[#2C3038] shadow-sm p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-5 space-y-3 min-w-0">
            {/* Primary Featured Image */}
            <div className="relative aspect-square rounded-xl border border-[#2C3038] overflow-hidden bg-[#14161A] flex items-center justify-center">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Promotional Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.isClearance && (
                  <span className="bg-[#E21C21] text-white text-xs font-black uppercase px-2.5 py-0.5 rounded shadow flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-white" /> CLEARANCE
                  </span>
                )}
                {product.isOneOff && (
                  <span className="bg-[#14161A] text-[#B8E62E] border border-[#B8E62E] text-xs font-black uppercase px-2 py-0.5 rounded shadow">
                    1-OF-1 UNIQUE ITEM
                  </span>
                )}
              </div>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-2 right-2 p-2 rounded-full bg-[#202329]/90 hover:bg-[#202329] text-[#AEB3BA] hover:text-[#E21C21] shadow border border-[#2C3038] transition-colors"
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#E21C21] text-[#E21C21]' : ''}`} />
              </button>
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 bg-[#14161A] ${
                      activeImageIndex === idx ? 'border-[#B8E62E]' : 'border-[#2C3038] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.title} - view ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Warehouse Bin Location Tag */}
            <div className="bg-[#14161A] border border-[#2C3038] rounded-lg p-2.5 text-xs text-[#AEB3BA] flex items-center justify-between">
              <span className="font-semibold">Warehouse Bin Location:</span>
              <span className="font-mono font-bold text-white bg-[#202329] px-2 py-0.5 rounded border border-[#2C3038]">
                {product.warehouseLocation || (product as any).locationBin || 'Bay A1'}
              </span>
            </div>
          </div>

          {/* Right Column: Title, Fitment, Price & Buy Actions */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div>
              <div className="flex items-center justify-between text-xs text-[#AEB3BA] font-bold mb-1 flex-wrap gap-2">
                <span className="text-[#B8E62E] uppercase tracking-wider text-sm font-black">{product.brand}</span>
                <span className="font-mono text-[11px]">SKU: {product.sku} | Barcode: {product.barcode}</span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase leading-tight tracking-tight">
                {product.title}
              </h1>

              {/* Rating & Review Counter */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex text-[#B8E62E]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'fill-[#B8E62E] text-[#B8E62E]' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-200">{product.rating} ({product.reviewCount} customer reviews)</span>
                <span className="text-[#2C3038]">|</span>
                <span className="text-xs font-bold text-[#B8E62E]">Verified Australian Stock</span>
              </div>
            </div>

            {/* Condition Banner */}
            <div className="bg-[#14161A] border border-[#2C3038] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#B8E62E] text-[#14161A] text-xs font-black px-2 py-0.5 rounded uppercase">
                  CONDITION: {product.condition}
                </span>
                <span className="text-xs font-bold text-[#AEB3BA]">{(product as any).conditionRating || 10}/10 Quality Grade</span>
              </div>
              <p className="text-xs text-[#AEB3BA] font-medium">
                {product.conditionDescription || (product as any).conditionNotes || 'Inspected and certified ready for immediate use.'}
              </p>
            </div>

            {/* Vehicle Fitment Box */}
            <div className="bg-[#14161A] border border-[#2C3038] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black text-xs">
                    🚗
                  </div>
                  <span className="text-xs font-black uppercase text-white">
                    Vehicle Fitment Verification
                  </span>
                </div>
                {userVehicle && (
                  <span className="text-[11px] font-bold text-[#AEB3BA]">
                    Active: {userVehicle.year} {userVehicle.make} {userVehicle.model}
                  </span>
                )}
              </div>

              {userVehicle ? (
                fitsVehicle ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B8E62E] flex-shrink-0" />
                    <span>GUARANTEED FIT: This part is 100% compatible with your {userVehicle.year} {userVehicle.model}</span>
                  </div>
                ) : (
                  <div className="bg-amber-950/60 border border-amber-500/50 text-amber-300 p-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Check fitment: This part may not match your {userVehicle.year} {userVehicle.model}. Verify engine series in specs below.</span>
                  </div>
                )
              ) : (
                <div className="text-xs text-[#AEB3BA] flex items-center justify-between">
                  <span>Enter your vehicle in header to verify 100% plug & play fitment.</span>
                </div>
              )}
            </div>

            {/* Price Box with Dollar Savings & GST Included */}
            <div className="bg-[#14161A] text-white p-4 rounded-xl space-y-2 border border-[#B8E62E]">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  {product.wasPrice && (
                    <div className="text-xs text-[#AEB3BA] font-bold">
                      WAS RRP: <span className="line-through">${product.wasPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-3xl sm:text-4xl font-black text-[#B8E62E] tracking-tight">
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#AEB3BA] font-medium">
                    Price includes 10% Australian GST • Official Tax Invoice Provided
                  </div>
                </div>

                {dollarSaving > 0 && (
                  <div className="bg-[#E21C21] text-white px-3 py-1.5 rounded-lg font-black text-sm uppercase text-center shadow">
                    <div>SAVE ${dollarSaving.toFixed(2)}</div>
                    <div className="text-[10px] font-bold">{percentageSaving}% OFF RRP</div>
                  </div>
                )}
              </div>

              {/* Stock Status & Warehouse Click & Collect */}
              <div className="pt-2 border-t border-[#2C3038] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#B8E62E] font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{product.stock > 0 ? `${product.stock} Units In Stock` : 'Sold Out'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#AEB3BA] font-medium">
                  <Store className="w-4 h-4 text-[#B8E62E] flex-shrink-0" />
                  <span>Click & Collect (Geelong / Werribee)</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#2C3038] rounded-lg bg-[#14161A]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 font-black text-[#AEB3BA] hover:text-white hover:bg-[#202329] rounded-l-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-black text-sm text-white w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 font-black text-[#AEB3BA] hover:text-white hover:bg-[#202329] rounded-r-lg transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={product.stock <= 0}
                  className={`flex-1 py-3 px-4 rounded-lg font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                    product.stock > 0
                      ? 'bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A]'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                  <span>{product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
                </button>

                {/* Buy Now Button */}
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={product.stock <= 0}
                  className="bg-[#202329] hover:bg-black text-white border border-[#2C3038] hover:border-[#B8E62E] font-black text-sm py-3 px-5 rounded-lg uppercase shadow transition-colors hidden sm:block"
                >
                  BUY NOW
                </button>
              </div>

              {isAddedFeedback && (
                <div className="bg-[#B8E62E]/20 border border-[#B8E62E] text-[#B8E62E] text-xs font-bold p-2.5 rounded-lg text-center animate-in fade-in flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#B8E62E]" />
                  <span>Successfully added to your CheapLoot cart!</span>
                </div>
              )}
            </div>

            {/* Quick Guarantees Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2C3038] text-center text-[11px] font-bold text-[#AEB3BA]">
              <div className="p-2 bg-[#14161A] rounded-lg border border-[#2C3038]">🦘 Australian Stock</div>
              <div className="p-2 bg-[#14161A] rounded-lg border border-[#2C3038]">🛡️ 30-Day Free Returns</div>
              <div className="p-2 bg-[#14161A] rounded-lg border border-[#2C3038]">⚡ 24hr Fast Dispatch</div>
            </div>
          </div>
        </div>

        {/* Tabbed Product Information Section */}
        <div className="bg-[#202329] rounded-xl border border-[#2C3038] shadow-sm overflow-hidden min-w-0">
          {/* Tab Headers */}
          <div className="flex border-b border-[#2C3038] bg-[#14161A] overflow-x-auto no-scrollbar">
            {[
              { key: 'desc', label: 'Full Description' },
              { key: 'specs', label: 'Technical Specs' },
              { key: 'fitment', label: 'Vehicle Compatibility' },
              { key: 'shipping', label: 'Shipping Estimator' },
              { key: 'reviews', label: `Reviews (${product.reviewCount})` },
              { key: 'qa', label: 'Product Q&A' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-black uppercase whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#B8E62E] bg-[#202329] text-[#B8E62E]'
                    : 'border-transparent text-[#AEB3BA] hover:text-white hover:bg-[#202329]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="p-4 sm:p-6 text-sm">
            {/* Description Tab */}
            {activeTab === 'desc' && (
              <div className="space-y-4 max-w-4xl">
                <p className="text-[#E6E8EB] leading-relaxed font-medium">
                  {product.description}
                </p>

                <div>
                  <h4 className="font-black text-sm uppercase text-white mb-2">Key Features & Highlights</h4>
                  <ul className="space-y-1.5">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#AEB3BA]">
                        <div className="w-4 h-4 rounded-full bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-[10px] mt-0.5">
                          ✓
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(product.whatsIncluded || (product as any).whatIncluded) && (product.whatsIncluded || (product as any).whatIncluded).length > 0 && (
                  <div>
                    <h4 className="font-black text-sm uppercase text-white mb-2">What's in the Box</h4>
                    <div className="bg-[#14161A] p-3 rounded-lg border border-[#2C3038]">
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#AEB3BA] font-semibold">
                        {(product.whatsIncluded || (product as any).whatIncluded).map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="max-w-3xl">
                <h4 className="font-black text-sm uppercase text-white mb-3">Technical Specifications</h4>
                <div className="border border-[#2C3038] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {Object.entries(product.specs || {}).map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-[#14161A]' : 'bg-[#202329]'}>
                          <td className="p-2.5 font-bold text-[#AEB3BA] border-r border-[#2C3038] w-1/3">{key}</td>
                          <td className="p-2.5 font-black text-white">{String(val)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#14161A]">
                        <td className="p-2.5 font-bold text-[#AEB3BA] border-r border-[#2C3038]">Weight</td>
                        <td className="p-2.5 font-black text-white">{product.weightKg || 1} kg</td>
                      </tr>
                      <tr className="bg-[#202329]">
                        <td className="p-2.5 font-bold text-[#AEB3BA] border-r border-[#2C3038]">Dimensions</td>
                        <td className="p-2.5 font-black text-white">
                          {(product.dimensionsCm as any)?.length || (product.dimensionsCm as any)?.l || 20} x {(product.dimensionsCm as any)?.width || (product.dimensionsCm as any)?.w || 15} x {(product.dimensionsCm as any)?.height || (product.dimensionsCm as any)?.h || 10} cm
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fitment Tab */}
            {activeTab === 'fitment' && (
              <div className="space-y-4 max-w-3xl">
                <h4 className="font-black text-sm uppercase text-white">Verified Vehicle Compatibility Guide</h4>
                {product.fitment && product.fitment.length > 0 ? (
                  <div className="border border-[#2C3038] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#14161A] font-black uppercase text-[#AEB3BA]">
                        <tr>
                          <th className="p-2.5">Make</th>
                          <th className="p-2.5">Model</th>
                          <th className="p-2.5">Years</th>
                          <th className="p-2.5">Engine / Series Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C3038]">
                        {product.fitment.map((f, i) => (
                          <tr key={i} className="hover:bg-[#14161A]/50">
                            <td className="p-2.5 font-bold text-white">{f.make}</td>
                            <td className="p-2.5 font-bold text-white">{f.model}</td>
                            <td className="p-2.5 font-mono text-[#B8E62E]">{f.yearFrom} - {f.yearTo}</td>
                            <td className="p-2.5 text-[#AEB3BA]">{f.engine || f.series || 'All Series'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#14161A] p-4 rounded-xl border border-[#2C3038] text-xs text-[#AEB3BA]">
                    This item is universally compatible or does not require vehicle-specific fitment verification.
                  </div>
                )}
              </div>
            )}

            {/* Shipping Estimator Tab */}
            {activeTab === 'shipping' && (
              <div className="space-y-4 max-w-xl">
                <h4 className="font-black text-sm uppercase text-white">Calculate Australian Delivery Rates</h4>
                <form onSubmit={handleEstimateShipping} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Postcode (e.g. 2000, 3000, 4000)"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="flex-1 bg-[#14161A] border border-[#2C3038] text-white rounded-lg p-2 text-xs font-bold focus:border-[#B8E62E] outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-4 py-2 rounded-lg uppercase"
                  >
                    Calculate Rates
                  </button>
                </form>

                {estimatedDelivery && (
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="p-3 bg-[#14161A] rounded-lg border border-[#2C3038] flex justify-between">
                      <span className="font-bold text-[#AEB3BA]">Australia Post Standard Parcel:</span>
                      <span className="font-black text-white">{estimatedDelivery.standard}</span>
                    </div>
                    <div className="p-3 bg-[#14161A] rounded-lg border border-[#2C3038] flex justify-between">
                      <span className="font-bold text-[#AEB3BA]">Australia Post Express:</span>
                      <span className="font-black text-white">{estimatedDelivery.express}</span>
                    </div>
                    <div className="p-3 bg-[#14161A] rounded-lg border border-[#B8E62E] flex justify-between">
                      <span className="font-bold text-[#B8E62E]">Warehouse Click & Collect:</span>
                      <span className="font-black text-[#B8E62E]">{estimatedDelivery.clickAndCollect}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase text-white">Verified Customer Reviews</h4>
                  <span className="text-xs font-bold text-[#B8E62E]">{product.rating} Out of 5 Stars</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#14161A] rounded-xl border border-[#2C3038] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-black text-white">Mick T. (Tradie, Dubbo NSW)</div>
                      <div className="text-[#AEB3BA]">3 days ago</div>
                    </div>
                    <div className="flex text-[#B8E62E] text-xs">★★★★★</div>
                    <p className="text-xs text-[#AEB3BA] font-medium">
                      "Arrived within 2 days in regional NSW. Solid quality, exactly as described in the specs. Saved over $140 compared to Supercheap or Repco."
                    </p>
                    <span className="text-[10px] text-[#B8E62E] font-bold bg-[#202329] border border-[#2C3038] px-1.5 py-0.5 rounded inline-block">
                      Verified Buyer
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#14161A] rounded-xl border border-[#2C3038] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-black text-white">Dave W. (Geelong VIC)</div>
                      <div className="text-[#AEB3BA]">1 week ago</div>
                    </div>
                    <div className="flex text-[#B8E62E] text-xs">★★★★★</div>
                    <p className="text-xs text-[#AEB3BA] font-medium">
                      "Picked up directly from Geelong warehouse 2 hours after ordering online. Friendly staff, packaging was mint."
                    </p>
                    <span className="text-[10px] text-[#B8E62E] font-bold bg-[#202329] border border-[#2C3038] px-1.5 py-0.5 rounded inline-block">
                      Verified Buyer
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qa' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase text-white">Product Questions & Answers</h4>
                  <button
                    onClick={() => setIsQuestionModalOpen(true)}
                    className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-3 py-1.5 rounded-lg uppercase flex items-center gap-1"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" /> Ask a Question
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#14161A] rounded-xl border border-[#2C3038] space-y-1.5">
                    <div className="font-bold text-white">Q: Does this come with a genuine Australian plug/adapter?</div>
                    <div className="text-[#AEB3BA] pl-3 border-l-2 border-[#B8E62E]">
                      <strong className="text-white">CheapLoot Support:</strong> Yes! All electrical products dispatched by CheapLoot meet Australian electrical safety standards (RCM/SAA compliance) with standard AU plugs.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Product Shelf */}
        <div className="pt-4 min-w-0">
          <div className="flex items-center justify-between mb-3 border-b border-[#2C3038] pb-2">
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              Customers Who Bought This Also Snagged
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
            {relatedProducts.map(p => (
              <div
                key={p.id}
                onClick={() => navigateToProduct(p.id)}
                className="bg-[#202329] p-3 rounded-xl border border-[#2C3038] hover:border-[#B8E62E] cursor-pointer shadow-sm group min-w-0"
              >
                <img src={p.images[0]} alt={p.title} referrerPolicy="no-referrer" className="w-full aspect-square object-cover rounded-lg mb-2" />
                <div className="text-[11px] font-bold text-[#AEB3BA] uppercase truncate">{p.brand}</div>
                <div className="text-xs font-bold text-white group-hover:text-[#B8E62E] line-clamp-2 leading-snug">
                  {p.title}
                </div>
                <div className="text-sm font-black text-[#B8E62E] mt-1">${p.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#202329] border border-[#2C3038] rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-base font-black uppercase text-white">Ask a Question About This Loot</h3>
            {questionSubmitted ? (
              <div className="bg-[#B8E62E]/20 border border-[#B8E62E] text-[#B8E62E] p-3 rounded-lg text-xs font-bold">
                Thank you! Our technical specialists will answer your question and publish it on this page.
              </div>
            ) : (
              <>
                <textarea
                  rows={3}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Does this fit a 2018 Hilux with a dual battery tray?"
                  className="w-full bg-[#14161A] border border-[#2C3038] text-white rounded-lg p-2.5 text-xs font-medium focus:border-[#B8E62E] outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#AEB3BA] hover:bg-[#14161A]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setQuestionSubmitted(true);
                      setTimeout(() => {
                        setQuestionSubmitted(false);
                        setIsQuestionModalOpen(false);
                        setNewQuestion('');
                      }, 1800);
                    }}
                    className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-4 py-1.5 rounded-lg uppercase"
                  >
                    Submit Question
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Mobile Purchase Action Bar */}
      <div 
        id="product-mobile-sticky-bar"
        className="fixed bottom-16 left-0 right-0 z-30 bg-[#202329] border-t border-[#2C3038] p-3 text-white md:hidden shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-[#B8E62E] leading-none">
              ${product.price.toFixed(2)}
            </span>
            {dollarSaving > 0 && (
              <span className="bg-[#E21C21] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                SAVE ${dollarSaving.toFixed(0)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#AEB3BA] font-semibold truncate mt-0.5">
            {product.stock > 0 ? (
              <span className="text-[#B8E62E] font-bold">✓ In Stock (Aus Dispatch)</span>
            ) : (
              <span className="text-red-400 font-bold">Sold Out</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add to Cart button */}
          <button
            onClick={() => handleAddToCart(false)}
            disabled={product.stock <= 0}
            className={`py-2.5 px-4 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform ${
              product.stock > 0
                ? 'bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            <span>ADD TO CART</span>
          </button>
        </div>
      </div>
    </div>
  );
};
