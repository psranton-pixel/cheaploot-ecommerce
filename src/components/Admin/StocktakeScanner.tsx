import React, { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, Camera, CameraOff, Sparkles, RefreshCw, Barcode } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const StocktakeScanner: React.FC = () => {
  const { products } = useStore();
  const [scanInput, setScanInput] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<any>(null);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [auditLog, setAuditLog] = useState<any[]>([]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser or preview environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access prevented or not allowed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied by browser or iframe sandbox permissions. You can use the Quick Sample Barcodes or enter SKU manually below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No active camera hardware detected on this device.');
      } else {
        setCameraError('Camera unavailable in preview sandbox mode. Please use manual SKU input or quick scan buttons.');
      }
      setIsCameraActive(false);
    }
  };

  const processBarcodeValue = (code: string) => {
    const q = code.trim().toLowerCase();
    const prod = products.find(
      p => p.sku.toLowerCase() === q || p.barcode.toLowerCase() === q || p.id.toLowerCase() === q || p.mpn?.toLowerCase() === q
    );

    if (prod) {
      setMatchedProduct(prod);
      setCountedQty(prod.stock);
      setScanInput(prod.barcode);
    } else {
      alert(`No product found in Geelong inventory matching: ${code}`);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    processBarcodeValue(scanInput);
  };

  const handleSaveStockCount = () => {
    if (matchedProduct) {
      setAuditLog(prev => [
        {
          sku: matchedProduct.sku,
          name: matchedProduct.title,
          expected: matchedProduct.stock,
          counted: countedQty,
          user: 'Staff Scanner (Geelong)',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
      setMatchedProduct(null);
      setScanInput('');
    }
  };

  // Sample quick barcodes from current catalog
  const sampleProducts = products.slice(0, 5);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Scanner Main Box */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="font-black text-base uppercase text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#FFD400]" />
              <span>Mobile Stocktake & Barcode Scanner</span>
            </h2>
            <p className="text-xs text-gray-400">
              Scan product barcodes or shelf tags to reconcile physical Geelong depot inventory
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 hover:text-white font-bold text-xs px-3 py-2 rounded flex items-center gap-1.5 border border-neutral-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-[#FFD400]" />
                <span>Open Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="bg-red-950/70 hover:bg-red-900 text-red-300 font-bold text-xs px-3 py-2 rounded flex items-center gap-1.5 border border-red-800 transition-colors"
              >
                <CameraOff className="w-4 h-4" />
                <span>Close Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Camera Error / Sandbox Notice */}
        {cameraError && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-300">Camera Notice:</div>
              <div>{cameraError}</div>
            </div>
            <button
              onClick={() => setCameraError(null)}
              className="text-amber-400 hover:text-amber-200 font-bold text-xs underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Camera View (when active) */}
        {isCameraActive && (
          <div className="relative rounded-lg overflow-hidden border-2 border-[#FFD400] bg-black aspect-video max-w-md mx-auto flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Overlay Target Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-36 border-2 border-dashed border-[#FFD400] rounded-lg relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse" />
                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-[#FFD400] text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  ALIGN BARCODE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Manual Barcode & SKU Search Form */}
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Enter barcode or SKU (e.g. 9312345000018 or CL-ALT-130A-TY01)"
              className="w-full pl-9 pr-3 bg-neutral-900 border border-neutral-700 rounded p-2 text-xs font-mono font-bold text-white placeholder-gray-500 focus:border-[#FFD400] outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs px-5 py-2 rounded uppercase flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Item</span>
          </button>
        </form>

        {/* Quick Sample Barcodes for 1-click Testing */}
        {sampleProducts.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD400]" />
              <span>Quick Test Sample Barcodes (Click to simulate scan):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => processBarcodeValue(p.barcode)}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-[#FFD400] text-left p-2 rounded text-xs transition-colors group flex items-center gap-2"
                >
                  <img src={p.images[0]} alt="" referrerPolicy="no-referrer" className="w-8 h-8 object-cover rounded border border-neutral-800" />
                  <div>
                    <div className="font-bold text-white group-hover:text-[#FFD400] line-clamp-1">{p.title}</div>
                    <div className="font-mono text-[10px] text-gray-400">Barcode: {p.barcode}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matched Product Scan Result Box */}
        {matchedProduct && (
          <div className="p-4 bg-neutral-900 border-2 border-[#FFD400] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <img src={matchedProduct.images[0]} alt="" referrerPolicy="no-referrer" className="w-16 h-16 object-cover rounded border border-neutral-700" />
              <div>
                <div className="font-bold text-sm text-white">{matchedProduct.title}</div>
                <div className="text-xs text-gray-400 font-mono">
                  SKU: <span className="text-[#FFD400] font-bold">{matchedProduct.sku}</span> | Bin: {matchedProduct.warehouseLocation}
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-0.5">
                  System Recorded Stock: {matchedProduct.stock} units
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="text-xs">
                <label className="block text-gray-400 font-bold mb-1">Physical Count:</label>
                <input
                  type="number"
                  min="0"
                  value={countedQty}
                  onChange={(e) => setCountedQty(Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-black border border-neutral-700 rounded p-1.5 text-sm font-black text-[#FFD400] text-center"
                />
              </div>

              <button
                onClick={handleSaveStockCount}
                className="bg-[#FFD400] hover:bg-yellow-400 text-[#111111] font-black text-xs px-4 py-3 rounded uppercase self-end flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Count</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Trail Log Table */}
      <div className="bg-[#111111] p-5 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm uppercase text-white">Stocktake Audit Log</h3>
          <span className="text-xs text-gray-400">{auditLog.length} reconciliations recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-800 text-gray-400 uppercase font-black">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">SKU</th>
                <th className="p-2.5">Product</th>
                <th className="p-2.5">Expected</th>
                <th className="p-2.5">Counted</th>
                <th className="p-2.5">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-gray-300">
              {auditLog.map((log, i) => (
                <tr key={i} className="hover:bg-neutral-900/50">
                  <td className="p-2.5 font-mono text-gray-400">{log.time}</td>
                  <td className="p-2.5 font-mono font-bold text-white">{log.sku}</td>
                  <td className="p-2.5 font-bold line-clamp-1">{log.name}</td>
                  <td className="p-2.5">{log.expected}</td>
                  <td className="p-2.5 font-black text-[#FFD400]">{log.counted}</td>
                  <td className="p-2.5 text-gray-400">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
