import React, { useState } from 'react';
import { 
  Trash2, ShoppingCart, ArrowRight, ShieldCheck, Truck, 
  Store, Tag, Plus, Minus, ArrowLeft, CheckCircle2, Flame 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartPage: React.FC = () => {
  const { cart, updateCartQty, removeFromCart, clearCart, setCurrentView, navigateToProduct, navigateToDepartment } = useStore();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [postcode, setPostcode] = useState('2000');
  const [selectedShipping, setSelectedShipping] = useState<'standard' | 'express' | 'click_collect'>('standard');

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 99;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Apply Promo Code
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'LOOT10') {
      setDiscountPercent(10);
      setPromoError('');
    } else if (code === 'AUSSIE15') {
      setDiscountPercent(15);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try "LOOT10" for 10% off.');
      setDiscountPercent(0);
    }
  };

  // Shipping Cost Calculation
  let shippingCost = 0;
  if (selectedShipping === 'standard') {
    shippingCost = subtotal >= freeShippingThreshold ? 0 : 9.95;
  } else if (selectedShipping === 'express') {
    shippingCost = 16.95;
  } else if (selectedShipping === 'click_collect') {
    shippingCost = 0;
  }

  const discountAmount = (subtotal * discountPercent) / 100;
  const gstAmount = ((subtotal - discountAmount + shippingCost) / 11);
  const finalTotal = subtotal - discountAmount + shippingCost;

  if (cart.length === 0) {
    return (
      <div className="py-12 bg-[#F4F4F4] min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-[#111111] flex items-center justify-center font-black mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black uppercase text-[#111111]">
            Your CheapLoot Cart is Empty
          </h2>
          <p className="text-xs text-gray-600 font-medium">
            Looks like you haven't snagged any bargain auto parts, tools or tech loot yet.
          </p>
          <button
            onClick={() => navigateToDepartment(null)}
            className="w-full bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-sm py-3 rounded uppercase tracking-wider shadow"
          >
            Start Shopping Bargains
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-[#F4F4F4] min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-5">
        {/* Page Title & Back */}
        <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('catalog')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              CheapLoot Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
            </h1>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-bold text-gray-500 hover:text-[#E21C21] underline"
          >
            Clear Cart
          </button>
        </div>

        {/* Free Shipping Progress Alert */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-black uppercase">
            <span className="flex items-center gap-1.5 text-gray-900">
              <Truck className="w-4 h-4 text-[#E21C21]" />
              {amountToFreeShipping === 0 ? (
                <span className="text-emerald-700 font-black">🎉 You have unlocked FREE Australia Post Standard Delivery!</span>
              ) : (
                <span>Add ${amountToFreeShipping.toFixed(2)} more for FREE Standard Shipping</span>
              )}
            </span>
            <span className="text-gray-500 font-bold">${subtotal.toFixed(2)} / ${freeShippingThreshold}</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${amountToFreeShipping === 0 ? 'bg-emerald-500' : 'bg-[#FFD400]'}`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Two-Column Grid: Cart Items & Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-3">
            {cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Thumbnail & Product Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      onClick={() => navigateToProduct(item.product.id)}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-gray-200 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-gray-500 uppercase">{item.product.brand}</div>
                      <h3
                        onClick={() => navigateToProduct(item.product.id)}
                        className="font-bold text-xs sm:text-sm text-gray-900 hover:text-black line-clamp-2 cursor-pointer leading-snug"
                      >
                        {item.product.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="bg-gray-100 text-gray-800 font-bold px-1.5 py-0.5 rounded">
                          {item.product.condition}
                        </span>
                        <span className="font-mono text-gray-400">SKU: {item.product.sku}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing, Quantity Steppers & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* Stepper */}
                    <div className="flex items-center border border-gray-300 rounded bg-gray-50">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-gray-700 hover:bg-gray-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-black text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-gray-700 hover:bg-gray-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total for Item */}
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-[#111111]">
                        ${itemTotal.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        ${item.product.price.toFixed(2)} each
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-gray-400 hover:text-[#E21C21] transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black uppercase text-[#111111] border-b border-gray-200 pb-2">
                Order Summary
              </h2>

              {/* Delivery Method Options */}
              <div className="space-y-2 text-xs">
                <label className="font-black uppercase text-gray-700 block">Choose Delivery Method</label>
                
                <label className={`flex items-center justify-between p-2.5 rounded border cursor-pointer ${
                  selectedShipping === 'standard' ? 'border-[#FFD400] bg-yellow-50/50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'standard'}
                      onChange={() => setSelectedShipping('standard')}
                    />
                    <div>
                      <div className="font-bold text-gray-900">Standard Delivery (2-5 Days)</div>
                      <div className="text-[10px] text-gray-500">Australia Post Tracked</div>
                    </div>
                  </div>
                  <span className="font-black text-gray-900">
                    {subtotal >= freeShippingThreshold ? 'FREE' : '$9.95'}
                  </span>
                </label>

                <label className={`flex items-center justify-between p-2.5 rounded border cursor-pointer ${
                  selectedShipping === 'express' ? 'border-[#FFD400] bg-yellow-50/50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'express'}
                      onChange={() => setSelectedShipping('express')}
                    />
                    <div>
                      <div className="font-bold text-gray-900">Express Post (1-2 Days)</div>
                      <div className="text-[10px] text-gray-500">Priority Courier / AusPost</div>
                    </div>
                  </div>
                  <span className="font-black text-gray-900">$16.95</span>
                </label>

                <label className={`flex items-center justify-between p-2.5 rounded border cursor-pointer ${
                  selectedShipping === 'click_collect' ? 'border-[#FFD400] bg-yellow-50/50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === 'click_collect'}
                      onChange={() => setSelectedShipping('click_collect')}
                    />
                    <div>
                      <div className="font-bold text-gray-900">Warehouse Click & Collect</div>
                      <div className="text-[10px] text-gray-500">Geelong (VIC) or Werribee (VIC)</div>
                    </div>
                  </div>
                  <span className="font-black text-emerald-700">FREE</span>
                </label>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block">Have a Promo Code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter LOOT10"
                    className="flex-1 border border-gray-300 rounded p-1.5 text-xs font-bold uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-[#111111] hover:bg-black text-white font-black text-xs px-3 py-1.5 rounded uppercase"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <div className="text-[11px] text-red-600 font-bold">{promoError}</div>}
                {discountPercent > 0 && (
                  <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Promo code applied: {discountPercent}% discount
                  </div>
                )}
              </form>

              {/* Breakdown */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs font-bold">
                <div className="flex justify-between text-gray-600">
                  <span>Cart Items Subtotal:</span>
                  <span className="text-gray-900 font-black">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="text-gray-900 font-black">
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Includes Australian GST (10%):</span>
                  <span>${gstAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-lg font-black text-[#111111] pt-2 border-t-2 border-gray-900">
                  <span>Total (AUD):</span>
                  <span className="text-2xl text-[#E21C21]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => setCurrentView('checkout')}
                className="w-full bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-base py-3.5 rounded-lg shadow-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-Bit SSL Encrypted Australian Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
