import React, { useState } from 'react';
import { 
  ShieldCheck, CreditCard, Lock, CheckCircle2, ArrowRight, 
  Store, Truck, ArrowLeft, Package, User, MapPin, Sparkles, Building 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart, setCurrentView, addNewOrder } = useStore();

  const [formData, setFormData] = useState({
    firstName: 'Jack',
    lastName: 'Thompson',
    email: 'jack.thompson@gmail.com',
    phone: '0412 345 678',
    addressLine1: '110 Corio Quay Road',
    suburb: 'North Geelong',
    state: 'VIC',
    postcode: '3215',
    deliveryMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '11/28',
    cardCvc: '•••',
    warehouseDepot: 'Geelong Hub (VIC)'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = formData.deliveryMethod === 'express' ? 16.95 : (subtotal >= 99 || formData.deliveryMethod === 'click_collect' ? 0 : 9.95);
  const gst = (subtotal + shippingCost) / 11;
  const total = subtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderNumber = `CL-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrderObj: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.addressLine1,
          suburb: formData.suburb,
          state: formData.state as any,
          postcode: formData.postcode,
          country: 'Australia'
        }
      },
      items: cart.map(item => ({
        productId: item.product.id,
        sku: item.product.sku,
        title: item.product.title,
        image: item.product.images[0],
        condition: item.product.condition,
        price: item.product.price,
        quantity: item.quantity,
        warehouseLocation: item.product.warehouseLocation || 'W1-A-01-R1',
        picked: false
      })),
      subtotal,
      shippingCost,
      gstAmount: gst,
      discountAmount: 0,
      total,
      status: 'paid',
      paymentMethod: formData.paymentMethod === 'card' ? 'credit_card' : formData.paymentMethod as any,
      shippingMethod: formData.deliveryMethod === 'express' ? 'express' : formData.deliveryMethod === 'click_collect' ? 'pickup' : 'standard',
      trackingNumber: `AP${Math.floor(100000000 + Math.random() * 900000000)}AU`,
      courier: 'Australia Post',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `act-1`,
          timestamp: new Date().toISOString(),
          status: 'paid',
          note: 'Payment captured securely via Australian Gateway',
          author: 'System'
        }
      ]
    };

    try {
      const payload = {
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.addressLine1}, ${formData.suburb}`,
          city: formData.suburb,
          state: formData.state,
          postcode: formData.postcode
        },
        deliveryMethod: formData.deliveryMethod === 'click_collect' ? 'click_and_collect' : 'shipping',
        pickupWarehouse: formData.warehouseDepot,
        items: cart.map(item => ({
          productId: item.product.id,
          sku: item.product.sku,
          title: item.product.title,
          price: item.product.price,
          costPrice: item.product.costPrice,
          quantity: item.quantity,
          image: item.product.images[0],
          warehouseLocation: item.product.warehouseLocation || 'W1-A-01'
        })),
        subtotal,
        shipping: shippingCost,
        discount: 0,
        gst,
        total,
        paymentMethod: formData.paymentMethod
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        addNewOrder(data.order);
        setCreatedOrder(data.order);
        clearCart();
      } else {
        throw new Error(data.message || 'Order placement failed');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      addNewOrder(newOrderObj);
      setCreatedOrder(newOrderObj);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Success Screen
  if (createdOrder) {
    return (
      <div className="py-10 bg-[#F4F4F4] min-h-screen">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-emerald-500 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-black uppercase px-3 py-1 rounded">
                ORDER CONFIRMED & PAID
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#111111] mt-2">
                Thank You For Your Loot Order!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">
                Order Reference: <span className="font-mono font-black text-gray-900">{createdOrder.orderNumber}</span>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-gray-600">Dispatched To:</span>
                <span className="text-gray-900">{createdOrder.customer.address.street}, {createdOrder.customer.address.suburb} {createdOrder.customer.address.state}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-600">Australia Post Tracking:</span>
                <span className="font-mono text-emerald-700 font-bold">{createdOrder.trackingNumber}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-600">Total Paid (AUD):</span>
                <span className="text-sm font-black text-[#111111]">${createdOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setCurrentView('tracking')}
                className="flex-1 bg-[#111111] hover:bg-black text-white font-black text-xs py-3 rounded uppercase flex items-center justify-center gap-1.5"
              >
                <Package className="w-4 h-4" /> Track Order Status
              </button>
              <button
                onClick={() => setCurrentView('catalog')}
                className="flex-1 bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs py-3 rounded uppercase"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-[#F4F4F4] min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-5">
        {/* Checkout Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('cart')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight">
              CheapLoot Express Checkout
            </h1>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Columns: Customer & Shipping Details */}
          <div className="lg:col-span-7 space-y-4">
            {/* Contact Details */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-black text-sm uppercase text-[#111111] border-b pb-2">
                <User className="w-4 h-4 text-[#FFD400]" />
                <span>1. Contact & Customer Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email (For Tax Invoice & Tracking)</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mobile Phone (For Courier Updates)</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-black text-sm uppercase text-[#111111] border-b pb-2">
                <MapPin className="w-4 h-4 text-[#FFD400]" />
                <span>2. Australian Delivery Address</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-bold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Suburb</label>
                    <input
                      type="text"
                      required
                      value={formData.suburb}
                      onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 font-bold"
                    >
                      {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-black text-sm uppercase text-[#111111] border-b pb-2">
                <CreditCard className="w-4 h-4 text-[#FFD400]" />
                <span>3. Payment Method</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'card', label: 'Credit Card', icon: '💳' },
                  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                  { id: 'afterpay', label: 'Afterpay', icon: '⚡' },
                  { id: 'zip', label: 'Zip Pay', icon: '📦' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                    className={`p-2.5 rounded border text-center transition-all ${
                      formData.paymentMethod === m.id
                        ? 'border-[#111111] bg-[#FFD400] text-[#111111] shadow'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-base">{m.icon}</div>
                    <div>{m.label}</div>
                  </button>
                ))}
              </div>

              {formData.paymentMethod === 'card' && (
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 font-mono font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={formData.cardExpiry}
                        onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">CVV / CVC</label>
                      <input
                        type="text"
                        value={formData.cardCvc}
                        onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Review & Place Order CTA */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-black uppercase text-[#111111] border-b pb-2">
                Order Review ({cart.length} items)
              </h2>

              {/* Items List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 text-xs">
                    <img src={item.product.images[0]} alt={item.product.title} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded border" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{item.product.title}</div>
                      <div className="text-[11px] text-gray-500 font-semibold">Qty: {item.quantity} × ${item.product.price.toFixed(2)}</div>
                    </div>
                    <div className="font-black text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-3 border-t border-gray-200 text-xs font-bold">
                <div className="flex justify-between text-gray-600">
                  <span>Goods Subtotal:</span>
                  <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Cost:</span>
                  <span className="text-gray-900">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Australian GST (10%):</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-[#111111] pt-2 border-t-2 border-gray-900">
                  <span>Total Amount (AUD):</span>
                  <span className="text-2xl text-[#E21C21]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-base py-3.5 rounded-lg shadow-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>AUTHORISING PAYMENT...</span>
                ) : (
                  <>
                    <span>PLACE ORDER & PAY ${total.toFixed(2)}</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-gray-500 text-center font-medium">
                By placing this order you agree to CheapLoot's terms of service and 30-day money-back guarantee.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
