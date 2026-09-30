import React, { useState } from 'react';
import { Package, Check, QrCode, CheckCircle2, AlertTriangle, Printer, ArrowRight, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const WarehousePicker: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [scannedItems, setScannedItems] = useState<Record<string, boolean>>({});
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-[#111111] p-8 rounded-xl border border-neutral-800 text-center space-y-2">
        <h3 className="text-lg font-black text-white uppercase">No Pending Orders</h3>
        <p className="text-xs text-gray-400">All customer orders have been packed and dispatched.</p>
      </div>
    );
  }

  const toggleItemScanned = (idx: number) => {
    setScannedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const allItemsPicked = activeOrder?.items.every((_, idx) => scannedItems[idx]);

  const handleMarkPacked = () => {
    if (activeOrder) {
      updateOrderStatus(activeOrder.id, 'packed', 'All items picked and packed into standard satchel.');
      setIsPackingModalOpen(false);
      setScannedItems({});
    }
  };

  const handleMarkShipped = () => {
    if (activeOrder) {
      updateOrderStatus(activeOrder.id, 'shipped', 'Handed over to Australia Post eParcel collection driver.');
    }
  };

  const customerName = activeOrder?.customer?.name || (activeOrder as any)?.customerName || 'Customer';
  const customerAddress = activeOrder?.customer?.address || {
    street: (activeOrder as any)?.shippingAddress?.line1 || '110 Corio Quay Rd',
    suburb: (activeOrder as any)?.shippingAddress?.suburb || 'North Geelong',
    state: (activeOrder as any)?.shippingAddress?.state || 'VIC',
    postcode: (activeOrder as any)?.shippingAddress?.postcode || '3215'
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Pick Queue Header */}
      <div className="bg-[#111111] p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-base uppercase text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FFD400]" />
            <span>Warehouse Pick & Pack Station (Geelong Depot)</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Scan barcode or verify bin coordinates before boxing
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold">SELECT ORDER:</span>
          <select
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              setScannedItems({});
            }}
            className="bg-neutral-800 border border-neutral-700 text-xs font-bold text-white p-2 rounded"
          >
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} ({o.status.toUpperCase()}) - {o.customer?.name || (o as any).customerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pick Checklist */}
          <div className="lg:col-span-8 bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs text-gray-400 font-mono">Order: {activeOrder.orderNumber}</span>
                <h3 className="font-black text-lg text-white">{customerName}</h3>
              </div>
              <div className="text-right">
                <span className="bg-[#FFD400] text-[#111111] text-xs font-black px-2.5 py-0.5 rounded uppercase">
                  STATUS: {activeOrder.status}
                </span>
                <div className="text-[11px] text-gray-400 mt-1">
                  Method: {activeOrder.shippingMethod?.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Shelf Items with Location Bins */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Items to Pick ({activeOrder.items.length})
              </div>

              {activeOrder.items.map((item: any, idx: number) => {
                const isChecked = scannedItems[idx];
                const title = item.title || item.product?.title || 'Warehouse Item';
                const img = item.image || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=100&auto=format&fit=crop&q=80';
                const sku = item.sku || item.product?.sku || 'SKU-000';
                const bin = item.warehouseLocation || item.locationBin || item.product?.warehouseLocation || 'W1-A-01';

                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemScanned(idx)}
                    className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-950/40 text-gray-100'
                        : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs ${
                        isChecked ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-gray-400 border border-neutral-700'
                      }`}>
                        {isChecked ? '✓' : idx + 1}
                      </div>

                      <img
                        src={img}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded border border-neutral-800 flex-shrink-0"
                      />

                      <div>
                        <div className="font-bold text-sm text-white line-clamp-1">{title}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>SKU: {sku}</span>
                          <span className="text-[#FFD400] font-bold">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Warehouse Bin Tag */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">BIN LOCATION</div>
                      <div className="bg-[#FFD400] text-[#111111] font-mono font-black text-xs px-2 py-0.5 rounded">
                        {bin}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-400 font-semibold">
                {Object.values(scannedItems).filter(Boolean).length} of {activeOrder.items.length} items verified
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkPacked}
                  disabled={!allItemsPicked && activeOrder.status === 'paid'}
                  className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs px-4 py-2 rounded uppercase flex items-center gap-1.5 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Pick & Pack</span>
                </button>

                {activeOrder.status === 'packed' && (
                  <button
                    onClick={handleMarkShipped}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded uppercase flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch to Courier</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Delivery & Label Details Box */}
          <div className="lg:col-span-4 bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="font-black text-sm uppercase text-white border-b border-neutral-800 pb-2">
              Dispatch Label & Courier
            </h3>

            <div className="space-y-2 text-xs text-gray-300">
              <div>
                <span className="font-bold text-gray-400 block">Deliver To:</span>
                <span className="text-white font-bold">{customerName}</span>
                <div>{customerAddress.street}</div>
                <div>{customerAddress.suburb}, {customerAddress.state} {customerAddress.postcode}</div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="font-bold text-gray-400 block">Courier Barcode:</span>
                <span className="font-mono text-emerald-400 font-bold">{activeOrder.trackingNumber || 'Pending Label Gen'}</span>
              </div>
            </div>

            <button
              onClick={() => alert(`Generated standard 4x6 Australia Post eParcel label for order ${activeOrder.orderNumber}`)}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-bold text-xs py-2 rounded uppercase flex items-center justify-center gap-2 border border-neutral-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print 4x6 Shipping Label</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
