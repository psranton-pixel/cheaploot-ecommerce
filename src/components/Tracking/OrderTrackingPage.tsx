import React, { useState } from 'react';
import { Package, Search, CheckCircle2, Truck, Clock, Store, MapPin, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AddToCalendarButton } from '../Calendar/AddToCalendarButton';

export const OrderTrackingPage: React.FC = () => {
  const { orders } = useStore();
  const [query, setQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    const match = orders.find(
      o => o.orderNumber.toLowerCase() === query.trim().toLowerCase() ||
           o.customer?.email?.toLowerCase() === query.trim().toLowerCase() ||
           (o.trackingNumber && o.trackingNumber.toLowerCase() === query.trim().toLowerCase())
    );
    setFoundOrder(match || null);
  };

  const steps = [
    { key: 'paid', label: 'Order Paid & Confirmed', desc: 'Secure payment captured' },
    { key: 'picking', label: 'Warehouse Picking', desc: 'Picker routing shelf bins' },
    { key: 'packed', label: 'Packed & Barcoded', desc: 'Quality checked and boxed' },
    { key: 'shipped', label: 'Dispatched with Courier', desc: 'Handed to Australia Post' },
    { key: 'delivered', label: 'Delivered', desc: 'Safe drop or signed' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'paid': return 0;
      case 'picking': return 1;
      case 'packed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStepIdx = foundOrder ? getStepIndex(foundOrder.status) : 0;

  return (
    <div className="py-6 bg-[#14161A] min-h-screen text-white w-full max-w-full box-border">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 space-y-6">
        <div className="bg-[#202329] p-5 sm:p-6 rounded-xl border border-[#2C3038] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white">
                Track Your CheapLoot Order
              </h1>
              <p className="text-xs text-[#AEB3BA] font-medium">
                Enter your Order Reference (e.g. CL-1001) or Australia Post Tracking Number
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. CL-1001, AP948201948AU, or email"
              className="flex-1 bg-[#14161A] border border-[#2C3038] rounded-lg p-2.5 text-sm font-bold uppercase text-white placeholder:text-[#AEB3BA]/60 focus:border-[#B8E62E] outline-none"
            />
            <button
              type="submit"
              className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-6 py-2.5 rounded-lg uppercase tracking-wider transition-colors"
            >
              Track Order
            </button>
          </form>

          {orders.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#AEB3BA] flex-wrap pt-1">
              <span className="font-bold">Your Active Orders:</span>
              {orders.slice(0, 3).map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { setQuery(o.orderNumber); setFoundOrder(o); setHasSearched(true); }}
                  className="underline hover:text-[#B8E62E] font-mono"
                >
                  {o.orderNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {foundOrder ? (
          <div className="bg-[#202329] p-5 sm:p-6 rounded-xl border border-[#2C3038] shadow-sm space-y-6">
            {/* Order Details Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2C3038] pb-4">
              <div>
                <div className="text-xs text-[#AEB3BA] font-bold uppercase">Order Reference</div>
                <div className="text-xl font-black text-[#B8E62E] font-mono">{foundOrder.orderNumber}</div>
                <div className="text-xs text-[#AEB3BA]">Placed on {new Date(foundOrder.createdAt).toLocaleDateString('en-AU', { dateStyle: 'long' })}</div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <span className="bg-[#B8E62E] text-[#14161A] text-xs font-black uppercase px-3 py-1 rounded">
                  STATUS: {foundOrder.status.toUpperCase()}
                </span>
                {foundOrder.trackingNumber && (
                  <div className="text-xs text-[#AEB3BA] font-mono font-bold">
                    AusPost Tracking: {foundOrder.trackingNumber}
                  </div>
                )}
                <AddToCalendarButton
                  eventData={{
                    summary: `📦 CheapLoot Order Delivery / Pickup: #${foundOrder.orderNumber}`,
                    description: `CheapLoot Order: #${foundOrder.orderNumber}\nTotal: $${foundOrder.total.toFixed(2)} AUD\nCustomer: ${foundOrder.customer?.name || 'Customer'}\nItems: ${(foundOrder.items || []).map((i: any) => i.title || i.product?.title || 'Item').join(', ')}`,
                    location: 'Geelong Dispatch Hub, VIC',
                    startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                    scheduleType: 'pickup',
                    referenceId: foundOrder.orderNumber
                  }}
                  label="Add to Google Calendar"
                />
              </div>
            </div>

            {/* Stepper Visualizer */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                Dispatch Progress
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? 'border-[#B8E62E] bg-[#14161A] shadow'
                          : isCompleted
                          ? 'border-emerald-500/50 bg-[#14161A]'
                          : 'border-[#2C3038] bg-[#14161A]/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#2C3038] text-[#AEB3BA]'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className="text-[11px] font-black text-white leading-tight">
                          {step.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#AEB3BA] font-medium">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-[#2C3038] pt-4 space-y-3">
              <div className="text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                Items in This Shipment
              </div>
              <div className="space-y-2">
                {foundOrder.items.map((item: any, i: number) => {
                  const title = item.title || item.product?.title || 'Product Item';
                  const img = item.image || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=100&auto=format&fit=crop&q=80';
                  const bin = item.warehouseLocation || item.locationBin || item.product?.warehouseLocation || 'W1-A-01';
                  const price = item.price || item.unitPrice || item.product?.price || 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#14161A] rounded border border-[#2C3038] text-xs">
                      <div className="flex items-center gap-3">
                        <img src={img} alt="" referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded border border-[#2C3038]" />
                        <div>
                          <div className="font-bold text-white">{title}</div>
                          <div className="text-[#AEB3BA]">Qty: {item.quantity} | Bin: {bin}</div>
                        </div>
                      </div>
                      <div className="font-black text-[#B8E62E]">
                        ${(price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Audit Logs */}
            {foundOrder.timeline && foundOrder.timeline.length > 0 && (
              <div className="border-t border-[#2C3038] pt-4 space-y-2">
                <div className="text-xs font-black uppercase text-[#AEB3BA] tracking-wider">
                  Live Dispatch Log
                </div>
                <div className="space-y-1 text-xs">
                  {foundOrder.timeline.map((act: any) => (
                    <div key={act.id} className="p-2 bg-[#14161A] rounded border border-[#2C3038] text-[#AEB3BA] flex justify-between">
                      <span>• {act.note}</span>
                      <span className="text-[11px] text-[#AEB3BA]/60">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <div className="bg-[#202329] p-8 rounded-xl border border-[#2C3038] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#14161A] text-[#E21C21] border border-[#2C3038] flex items-center justify-center font-black mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-white uppercase">Order Not Found</h3>
            <p className="text-xs text-[#AEB3BA] max-w-sm mx-auto">
              We couldn't locate an order matching that query. Please double check the order reference or contact CheapLoot support.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
