import React from 'react';
import { Heart, ShoppingCart, Check, Zap, Flame, ShieldAlert, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { navigateToProduct, addToCart, wishlist, toggleWishlist, userVehicle } = useStore();

  const currentPrice = Number(product.price) || 0;
  const wasPriceNum = product.wasPrice ? Number(product.wasPrice) : 0;
  const isWishlisted = wishlist.includes(product.id);
  const dollarSaving = wasPriceNum > currentPrice ? wasPriceNum - currentPrice : 0;
  const percentageSaving = wasPriceNum > 0 ? Math.round((dollarSaving / wasPriceNum) * 100) : 0;

  // Vehicle Fitment Check
  let fitmentStatus: 'fits' | 'no_match' | 'universal' | null = null;
  if (userVehicle) {
    if (!product.fitment || product.fitment.length === 0) {
      fitmentStatus = 'universal';
    } else {
      const match = product.fitment.some(f => 
        f.make.toLowerCase() === userVehicle.make.toLowerCase() &&
        userVehicle.year >= f.yearFrom &&
        userVehicle.year <= f.yearTo &&
        (!f.model || product.title.toLowerCase().includes(userVehicle.model.toLowerCase()) || f.model.toLowerCase().includes(userVehicle.model.toLowerCase()))
      );
      fitmentStatus = match ? 'fits' : 'no_match';
    }
  }

  const getConditionStyle = (cond: string) => {
    switch (cond) {
      case 'Brand New':
        return 'bg-[#14161A] text-[#B8E62E] border-[#B8E62E]';
      case 'Refurbished':
        return 'bg-[#14161A] text-purple-300 border-purple-800';
      case 'Open Box':
        return 'bg-[#14161A] text-amber-300 border-amber-800';
      case 'Excellent Used':
      case 'Good Used':
        return 'bg-[#14161A] text-blue-300 border-blue-800';
      default:
        return 'bg-[#14161A] text-[#AEB3BA] border-[#2C3038]';
    }
  };

  return (
    <div className={`group bg-[#202329] rounded-xl border border-[#2C3038] hover:border-[#B8E62E] hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden relative min-w-0 w-full ${
      compact ? 'p-2.5' : 'p-3 sm:p-3.5'
    }`}>
      {/* Top Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {product.isClearance && (
          <span className="bg-[#E21C21] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3" /> CLEARANCE
          </span>
        )}
        {dollarSaving > 0 && !product.isClearance && (
          <span className="bg-[#B8E62E] text-[#14161A] text-[10px] font-black uppercase px-2 py-0.5 rounded shadow tracking-wider">
            SAVE ${dollarSaving.toFixed(0)}
          </span>
        )}
        {product.isOneOff && (
          <span className="bg-[#14161A] text-[#B8E62E] text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow border border-[#B8E62E]">
            1-OF-1 UNIQUE
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-[#14161A]/90 hover:bg-[#14161A] text-[#AEB3BA] hover:text-[#E21C21] border border-[#2C3038] shadow transition-colors"
        title="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#E21C21] text-[#E21C21]' : ''}`} />
      </button>

      {/* 1. Main Product Image */}
      <div 
        onClick={() => navigateToProduct(product.id)}
        className="cursor-pointer overflow-hidden rounded-lg bg-[#14161A] flex items-center justify-center relative aspect-square mb-2.5"
      >
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80'}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.stock <= 3 && product.stock > 0 && (
          <div className="absolute bottom-1 right-1 bg-[#14161A]/90 text-[#B8E62E] text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#2C3038]">
            Only {product.stock} left!
          </div>
        )}
      </div>

      {/* Product Information Body */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="min-w-0">
          {/* 2. Small Brand */}
          <div className="flex items-center justify-between text-[11px] text-[#AEB3BA] font-semibold mb-0.5">
            <span className="uppercase tracking-wider truncate max-w-[140px]">{product.brand}</span>
            <span className="font-mono text-[10px] text-[#AEB3BA]">SKU: {product.sku}</span>
          </div>

          {/* 3. Product Title */}
          <h3 
            onClick={() => navigateToProduct(product.id)}
            className="font-bold text-xs sm:text-sm text-white group-hover:text-[#B8E62E] line-clamp-2 cursor-pointer leading-snug mb-1.5 break-words"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* 4. Condition Badge */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getConditionStyle(product.condition)}`}>
              {product.condition}
            </span>
            {product.shippingClass === 'free' && (
              <span className="text-[10px] font-extrabold text-[#B8E62E] bg-[#14161A] border border-[#B8E62E] px-1.5 py-0.5 rounded">
                FREE POST
              </span>
            )}
          </div>

          {/* Vehicle Fitment Indicator (if relevant) */}
          {userVehicle && fitmentStatus && (
            <div className="mb-2">
              {fitmentStatus === 'fits' && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#B8E62E] bg-[#14161A] px-1.5 py-0.5 rounded border border-[#B8E62E]">
                  <CheckCircle2 className="w-3 h-3 text-[#B8E62E] flex-shrink-0" />
                  <span className="truncate">Fits your {userVehicle.year} {userVehicle.model}</span>
                </div>
              )}
              {fitmentStatus === 'no_match' && product.department.includes('Auto') && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-[#14161A] px-1.5 py-0.5 rounded border border-amber-800">
                  <XCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">Check fitment for your car</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Pricing & Savings Priority */}
        <div className="pt-2 border-t border-[#2C3038] mt-1 min-w-0">
          {/* Was Price */}
          {wasPriceNum > currentPrice ? (
            <div className="flex items-baseline gap-1 text-xs text-[#AEB3BA] font-medium leading-none">
              <span>WAS</span>
              <span className="line-through">${wasPriceNum.toFixed(2)}</span>
            </div>
          ) : (
            <div className="text-[10px] sm:text-[11px] text-[#AEB3BA] font-medium">CHEAPLOOT PRICE</div>
          )}

          {/* Large Current Price */}
          <div className="flex items-baseline justify-between gap-1 my-1">
            <div className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
              ${currentPrice.toFixed(2)}
            </div>
            {dollarSaving > 0 && (
              <div className="text-[10px] sm:text-[11px] font-black text-white bg-[#E21C21] px-1.5 py-0.5 rounded">
                SAVE ${dollarSaving.toFixed(2)} ({percentageSaving}%)
              </div>
            )}
          </div>

          {/* Stock & Pickup Availability */}
          <div className="text-[10px] sm:text-[11px] text-[#AEB3BA] font-semibold mb-2 flex items-center justify-between">
            <span className={product.stock > 0 ? 'text-[#B8E62E] font-bold' : 'text-red-400 font-bold'}>
              {product.stock > 0 ? 'In Stock (AU Hub)' : 'Sold Out'}
            </span>
            <span className="text-[#AEB3BA] text-[10px]">Pick-up available</span>
          </div>

          {/* 6. Action Button: Quick Add to Cart */}
          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stock <= 0}
            className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              product.stock > 0
                ? 'bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] active:scale-95'
                : 'bg-[#2C3038] text-[#AEB3BA] cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            <span>{product.stock > 0 ? 'ADD TO CART' : 'SOLD OUT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
