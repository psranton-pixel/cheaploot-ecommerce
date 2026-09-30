import React, { useState } from 'react';
import { 
  Plus, Sparkles, Upload, Image as ImageIcon, Trash2, ArrowLeft,
  CheckCircle2, AlertTriangle, RefreshCw, Layers, DollarSign, Package,
  MapPin, ShieldCheck, Tag, Car, Sliders, Check, Eye, ExternalLink,
  Wand2, FileText, Barcode, HelpCircle, Box
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Product, ProductCondition, VehicleFitment } from '../../../types';
import { INITIAL_DEPARTMENTS } from '../../../data/mockData';

interface Props {
  onBack?: () => void;
  onProductCreated?: (product: Product) => void;
}

export const CreateProductPage: React.FC<Props> = ({ onBack, onProductCreated }) => {
  const { addNewProduct, refreshProducts, navigateToProduct, setCurrentView } = useStore();

  // Basic Details
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [mpn, setMpn] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  
  // Categorisation
  const [department, setDepartment] = useState('Tools & Hardware');
  const [category, setCategory] = useState('Power Tools');
  const [subCategory, setSubCategory] = useState('');

  // Pricing & Margins
  const [price, setPrice] = useState('49.00');
  const [wasPrice, setWasPrice] = useState('89.00');
  const [costPrice, setCostPrice] = useState('20.00');
  const [isClearance, setIsClearance] = useState(false);
  const [isSale, setIsSale] = useState(true);
  const [isHotDeal, setIsHotDeal] = useState(false);

  // Inventory & Warehouse
  const [stock, setStock] = useState('1');
  const [isOneOff, setIsOneOff] = useState(true);
  const [warehouseLocation, setWarehouseLocation] = useState('Geelong (W1-A-01)');
  const [weightKg, setWeightKg] = useState('1.2');
  const [lengthCm, setLengthCm] = useState('20');
  const [widthCm, setWidthCm] = useState('15');
  const [heightCm, setHeightCm] = useState('10');
  const [shippingClass, setShippingClass] = useState<'standard' | 'express' | 'bulky' | 'free'>('standard');

  // Condition
  const [condition, setCondition] = useState<ProductCondition>('Good Used');
  const [conditionDescription, setConditionDescription] = useState('Tested and verified working. Clean condition with light cosmetic wear.');
  const [warranty, setWarranty] = useState('30-Day CheapLoot Return Guarantee');
  
  // Media & Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Rich Content
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Genuine Australian liquidation stock',
    'Tested and inspected for optimal performance',
    'Backed by CheapLoot Australian warranty'
  ]);
  const [newFeature, setNewFeature] = useState('');
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(['1x Main Unit']);
  const [newIncludedItem, setNewIncludedItem] = useState('');

  // Specifications Key-Value
  const [specs, setSpecs] = useState<Array<{ key: string; val: string }>>([
    { key: 'Brand', val: 'Makita' },
    { key: 'Condition', val: 'Good Used' },
    { key: 'Warranty', val: '30 Days' }
  ]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');

  // Automotive Fitment
  const [fitments, setFitments] = useState<VehicleFitment[]>([]);
  const [fitMake, setFitMake] = useState('');
  const [fitModel, setFitModel] = useState('');
  const [fitYearFrom, setFitYearFrom] = useState('2015');
  const [fitYearTo, setFitYearTo] = useState('2023');

  // AI Assist State
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; createdProdId?: string } | null>(null);
  const [isDragOverPhoto, setIsDragOverPhoto] = useState(false);

  // Auto Generate SKU
  const handleGenerateSku = () => {
    const prefix = department.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSku = `CL-${prefix || 'LOOT'}-${rand}`;
    setSku(newSku);
  };

  // Profit Calculation
  const priceNum = parseFloat(price) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const wasPriceNum = parseFloat(wasPrice) || 0;
  const grossProfit = priceNum - costNum;
  const grossMarginPct = priceNum > 0 ? Math.round((grossProfit / priceNum) * 100) : 0;
  const savingsPct = wasPriceNum > priceNum ? Math.round(((wasPriceNum - priceNum) / wasPriceNum) * 100) : 0;

  // AI Auto-Fill
  const handleAiAutoFill = async () => {
    const query = aiPromptInput.trim() || title.trim() || mpn.trim() || barcode.trim();
    if (!query) {
      setNotification({
        type: 'error',
        message: 'Please enter a product title, model number (MPN), or barcode in the AI Assist bar.'
      });
      return;
    }

    setIsAiGenerating(true);
    setNotification(null);

    try {
      const res = await fetch('/api/import/ai-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: query,
          brandHint: brand,
          conditionHint: condition,
          categoryHint: department,
          costPrice: costNum || 20,
          images: images.length > 0 ? images : []
        })
      });

      const data = await res.json();
      if (!data.success || !data.draft) {
        throw new Error(data.message || 'AI Auto-Fill could not find high confidence matches.');
      }

      const d = data.draft;
      if (d.title) setTitle(d.title);
      if (d.brand) setBrand(d.brand);
      if (d.mpn) setMpn(d.mpn);
      if (d.barcode && !barcode) setBarcode(d.barcode);
      if (d.price && d.price > 0) setPrice(d.price.toFixed(2));
      if (d.condition) setCondition(d.condition);
      if (d.department) setDepartment(d.department);
      if (d.category) setCategory(d.category);
      if (d.description) setDescription(d.description);
      if (d.conditionDescription) setConditionDescription(d.conditionDescription);
      if (d.features && d.features.length > 0) setFeatures(d.features);
      if (d.whatsIncluded && d.whatsIncluded.length > 0) setWhatsIncluded(d.whatsIncluded);
      if (d.specs && typeof d.specs === 'object') {
        const specArr = Object.entries(d.specs).map(([k, v]) => ({ key: k, val: String(v) }));
        setSpecs(specArr);
      }
      if (d.vehicleFitment && Array.isArray(d.vehicleFitment) && d.vehicleFitment.length > 0) {
        setFitments(d.vehicleFitment);
      }

      setNotification({
        type: 'success',
        message: `✨ AI Auto-Filled listing for "${d.title}" with Australian pricing and specs!`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'AI Auto-Fill encountered an issue. You can still fill fields manually.'
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Image Drag & Drop Handler
  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPhoto(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (dataUrl) {
          setImages(prev => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Image URL
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  // Remove Image
  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Set Primary Image
  const handleSetPrimaryImage = (idx: number) => {
    setImages(prev => {
      const copy = [...prev];
      const [chosen] = copy.splice(idx, 1);
      return [chosen, ...copy];
    });
  };

  // Add Feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  // Add Included Item
  const handleAddIncluded = () => {
    if (newIncludedItem.trim()) {
      setWhatsIncluded(prev => [...prev, newIncludedItem.trim()]);
      setNewIncludedItem('');
    }
  };

  // Add Spec
  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecVal.trim()) {
      setSpecs(prev => [...prev, { key: newSpecKey.trim(), val: newSpecVal.trim() }]);
      setNewSpecKey('');
      setNewSpecVal('');
    }
  };

  // Add Vehicle Fitment
  const handleAddFitment = () => {
    if (fitMake.trim() && fitModel.trim()) {
      const yFrom = parseInt(fitYearFrom, 10) || 2010;
      const yTo = parseInt(fitYearTo, 10) || 2024;
      setFitments(prev => [
        ...prev,
        { make: fitMake.trim(), model: fitModel.trim(), yearFrom: yFrom, yearTo: yTo }
      ]);
      setFitMake('');
      setFitModel('');
    }
  };

  // Handle Submit (Create Product)
  const handleSubmitProduct = async (andAddAnother = false) => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Product Title is required.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      // Build spec map
      const specObj: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.val.trim()) specObj[s.key.trim()] = s.val.trim();
      });

      const finalSku = sku.trim() || `CL-${department.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload: Partial<Product> = {
        title: title.trim(),
        brand: (brand.trim() || 'CheapLoot'),
        sku: finalSku,
        barcode: barcode.trim(),
        mpn: mpn.trim(),
        oemNumber: oemNumber.trim() || undefined,
        price: priceNum || 19.95,
        wasPrice: wasPriceNum > priceNum ? wasPriceNum : undefined,
        costPrice: costNum || 0,
        condition,
        conditionDescription: conditionDescription.trim() || `${condition} condition.`,
        department,
        category: category || department,
        subCategory: subCategory.trim() || undefined,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80'],
        stock: parseInt(stock, 10) || 1,
        isOneOff,
        warehouseLocation: warehouseLocation.trim() || 'Geelong (W1-A-01)',
        weightKg: parseFloat(weightKg) || 1.0,
        dimensionsCm: {
          length: parseFloat(lengthCm) || 20,
          width: parseFloat(widthCm) || 15,
          height: parseFloat(heightCm) || 10
        },
        shippingClass,
        warranty: warranty.trim() || '30-Day CheapLoot Return Guarantee',
        description: description.trim() || `### Overview\n${title}\n\n### Condition\n${conditionDescription}`,
        features: features.filter(f => f.trim()),
        whatsIncluded: whatsIncluded.filter(w => w.trim()),
        specs: specObj,
        fitment: fitments,
        isClearance,
        isSale,
        isHotDeal,
        tags: [brand.toLowerCase(), department.toLowerCase(), 'cheaploot'].filter(Boolean)
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success || !data.product) {
        throw new Error(data.message || 'Failed to create product.');
      }

      const createdProduct = data.product;
      addNewProduct(createdProduct);
      refreshProducts();

      if (onProductCreated) {
        onProductCreated(createdProduct);
      }

      if (andAddAnother) {
        // Reset form for rapid entry
        setTitle('');
        setMpn('');
        setBarcode('');
        setOemNumber('');
        setPrice('49.00');
        setCostPrice('20.00');
        setDescription('');
        handleGenerateSku();
        setNotification({
          type: 'success',
          message: `Product "${createdProduct.title}" created successfully! Ready for next product.`
        });
      } else {
        setNotification({
          type: 'success',
          message: `Product "${createdProduct.title}" is now LIVE in the CheapLoot store!`,
          createdProdId: createdProduct.id
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error saving product. Please verify fields and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111111] p-5 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 hover:text-white rounded-xl transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#FFD400] text-black px-2 py-0.5 rounded">
                Product Master
              </span>
              <h1 className="text-xl font-black uppercase text-white tracking-tight">
                Create New Product
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Add individual inventory items with instant Australian pricing, warehouse bin allocation, and AI auto-fill.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleGenerateSku()}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-[#FFD400]" />
            Generate SKU
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-200'
              : 'bg-red-950/90 border border-red-700 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>

          <div className="flex items-center gap-2">
            {notification.createdProdId && (
              <button
                type="button"
                onClick={() => navigateToProduct(notification.createdProdId!)}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View in Store
              </button>
            )}
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-white text-xs font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. AI SPEED ASSIST BAR */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-900 p-5 rounded-2xl border border-[#FFD400]/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFD400]" />
            <h2 className="text-sm font-black uppercase text-white tracking-wide">
              AI Speed Auto-Fill & Australian Market Valuation
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Powered by Gemini AI Vision & Product Graph</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={aiPromptInput}
              onChange={(e) => setAiPromptInput(e.target.value)}
              placeholder="e.g. 'Makita DTD154Z 18V Impact Driver' or 'Philips H11 LED Bulbs' or barcode..."
              className="w-full bg-[#111111] border border-neutral-700 focus:border-[#FFD400] text-white text-xs px-3.5 py-2.5 rounded-xl outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAiAutoFill()}
            />
          </div>
          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isAiGenerating}
            className="px-5 py-2.5 bg-[#FFD400] hover:bg-[#FFE033] disabled:opacity-50 text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer flex-shrink-0"
          >
            {isAiGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Researching Australian Value...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto-Fill Product
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Media & Product Details (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos & Media Dropzone */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FFD400]" />
                Product Photos & Media ({images.length})
              </h3>
              <span className="text-[11px] text-gray-400">First image is cover photo</span>
            </div>

            {/* Drag & Drop Photo Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOverPhoto(true); }}
              onDragLeave={() => setIsDragOverPhoto(false)}
              onDrop={handleDropFiles}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragOverPhoto 
                  ? 'border-[#FFD400] bg-[#FFD400]/10' 
                  : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/40'
              }`}
            >
              <Upload className="w-8 h-8 text-[#FFD400] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-white">Drag & drop product photos here</p>
              <p className="text-[11px] text-gray-400 mt-0.5 mb-3">Supports JPG, PNG, WEBP from inspection cameras</p>
              
              <label className="inline-block px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-neutral-700">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) setImages(prev => [...prev, evt.target!.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste external image URL (Unsplash, supplier, eBay)..."
                className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-[#FFD400]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Add URL
              </button>
            </div>

            {/* Gallery Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 aspect-square">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#FFD400] text-black text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="p-1 bg-[#FFD400] text-black rounded text-[10px] font-bold"
                          title="Set as Cover"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Identification Fields */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#FFD400]" />
              Core Identification
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-300 font-bold mb-1">
                  <span>Product Title / Name *</span>
                  <span className="text-[11px] text-gray-500">{title.length} characters</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Makita 18V Brushless Impact Driver DTD154Z Bare Tool"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-xs px-3.5 py-2.5 rounded-xl outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Makita, Bosch, Philips, Dell"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-xs px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">MPN / Manufacturer Part Number</label>
                  <input
                    type="text"
                    value={mpn}
                    onChange={(e) => setMpn(e.target.value)}
                    placeholder="e.g. DTD154Z, HA65NM130"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-xs px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">SKU (Inventory Identifier)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      placeholder="e.g. CL-TOOL-8921"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-xs px-3 py-2 rounded-xl outline-none font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-300 rounded-xl"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Barcode / UPC / EAN</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 088381826457"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-xs px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categorisation & Hierarchy */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FFD400]" />
              Department & Categorisation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    const deptObj = INITIAL_DEPARTMENTS.find(d => d.name === e.target.value);
                    if (deptObj && deptObj.subcategories.length > 0) {
                      setCategory(deptObj.subcategories[0].name);
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-[#FFD400]"
                >
                  {INITIAL_DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Power Tools, Headlights"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-[#FFD400]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Sub-Category</label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. 18V Cordless, LED Upgrades"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-[#FFD400]"
                />
              </div>
            </div>
          </div>

          {/* Description & Features */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFD400]" />
              Description, Features & What's in the Box
            </h3>

            <div>
              <label className="block text-xs text-gray-300 font-bold mb-1">Customer-Facing Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description, key benefits, and customer information..."
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs p-3 rounded-xl outline-none focus:border-[#FFD400]"
              />
            </div>

            {/* Key Bullet Features */}
            <div>
              <label className="block text-xs text-gray-300 font-bold mb-1">Key Feature Bullet Points</label>
              <div className="space-y-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-[#FFD400] font-black">•</span>
                    <span className="flex-1 text-gray-300">{feat}</span>
                    <button
                      type="button"
                      onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a new feature bullet point..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-200 rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div>
              <label className="block text-xs text-gray-300 font-bold mb-1">What's in the Box</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {whatsIncluded.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 text-xs text-white px-2.5 py-1 rounded-lg"
                  >
                    <Box className="w-3 h-3 text-[#FFD400]" />
                    {item}
                    <button
                      type="button"
                      onClick={() => setWhatsIncluded(whatsIncluded.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIncludedItem}
                  onChange={(e) => setNewIncludedItem(e.target.value)}
                  placeholder="e.g. 1x Bare Tool, 1x Belt Clip..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIncluded()}
                />
                <button
                  type="button"
                  onClick={handleAddIncluded}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-200 rounded-xl"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Technical Specifications Key-Value */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#FFD400]" />
              Technical Specifications ({specs.length})
            </h3>

            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800 text-xs">
                  <span className="font-bold text-gray-400 w-1/3">{spec.key}:</span>
                  <span className="font-semibold text-white flex-1">{spec.val}</span>
                  <button
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  placeholder="Spec name (e.g. Voltage, Socket Size)"
                  className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecVal}
                    onChange={(e) => setNewSpecVal(e.target.value)}
                    placeholder="Spec value (e.g. 18V, 1/4 Inch)"
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-200 rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Automotive Vehicle Fitment (Optional) */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-[#FFD400]" />
              Vehicle Compatibility / Fitment (Optional)
            </h3>

            {fitments.length > 0 ? (
              <div className="space-y-2">
                {fitments.map((fit, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-xs">
                    <div>
                      <span className="font-black text-white">{fit.make} {fit.model}</span>
                      <span className="text-gray-400 ml-2">({fit.yearFrom} - {fit.yearTo})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFitments(fitments.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No vehicle fitments added. Leave empty if universal or non-automotive.</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <input
                type="text"
                value={fitMake}
                onChange={(e) => setFitMake(e.target.value)}
                placeholder="Make (e.g. Toyota)"
                className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
              />
              <input
                type="text"
                value={fitModel}
                onChange={(e) => setFitModel(e.target.value)}
                placeholder="Model (e.g. Hilux)"
                className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-[#FFD400]"
              />
              <input
                type="text"
                value={fitYearFrom}
                onChange={(e) => setFitYearFrom(e.target.value)}
                placeholder="Year From"
                className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fitYearTo}
                  onChange={(e) => setFitYearTo(e.target.value)}
                  placeholder="Year To"
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFitment()}
                />
                <button
                  type="button"
                  onClick={handleAddFitment}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-200 rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pricing, Inventory, Condition & Publish Box */}
        <div className="space-y-6">
          {/* Pricing & Profit Calculator */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#FFD400]" />
              Pricing & Margin Calculator
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Retail Selling Price (AUD $) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FFD400] text-white text-sm font-black pl-8 pr-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Was / RRP (AUD $)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={wasPrice}
                      onChange={(e) => setWasPrice(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs pl-7 pr-2 py-2 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Cost Price (AUD $)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs pl-7 pr-2 py-2 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Profit & Margin Metrics Box */}
              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gross Margin:</span>
                  <span className={`font-black ${grossMarginPct >= 40 ? 'text-emerald-400' : 'text-[#FFD400]'}`}>
                    {grossMarginPct}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Profit Per Unit:</span>
                  <span className="font-bold text-white font-mono">${grossProfit.toFixed(2)} AUD</span>
                </div>
                {savingsPct > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Customer Savings:</span>
                    <span className="font-bold text-[#E21C21]">{savingsPct}% OFF</span>
                  </div>
                )}
              </div>

              {/* Promotional Flags */}
              <div className="space-y-2 pt-1 border-t border-neutral-800">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSale}
                    onChange={(e) => setIsSale(e.target.checked)}
                    className="rounded border-neutral-700 text-[#FFD400] focus:ring-0"
                  />
                  <span>Show "Price Smash / Sale" badge</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClearance}
                    onChange={(e) => setIsClearance(e.target.checked)}
                    className="rounded border-neutral-700 text-[#FFD400] focus:ring-0"
                  />
                  <span>Clearance Liquidation Bargain</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHotDeal}
                    onChange={(e) => setIsHotDeal(e.target.checked)}
                    className="rounded border-neutral-700 text-[#FFD400] focus:ring-0"
                  />
                  <span>Highlight on Homepage Hot Deals</span>
                </label>
              </div>
            </div>
          </div>

          {/* Condition & Quality Rating */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFD400]" />
              Condition & Warranty
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Condition Grade *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-[#FFD400]"
                >
                  <option value="Brand New">Brand New (Factory Sealed)</option>
                  <option value="New Other">New Other (Never Used, Opened)</option>
                  <option value="Open Box">Open Box (Inspected, Complete)</option>
                  <option value="Refurbished">Refurbished (Certified Working)</option>
                  <option value="Excellent Used">Excellent Used (Near Mint)</option>
                  <option value="Good Used">Good Used (Tested, Normal Wear)</option>
                  <option value="Fair Used">Fair Used (Heavily Used, Working)</option>
                  <option value="For Parts / Not Working">For Parts / Not Working (Salvage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Condition Description / Notes</label>
                <textarea
                  rows={2}
                  value={conditionDescription}
                  onChange={(e) => setConditionDescription(e.target.value)}
                  placeholder="e.g. Fully functional, minor scratches on casing..."
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-[#FFD400]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Warranty Term</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. 30-Day CheapLoot Return Guarantee"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stock, Location & Logistics */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FFD400]" />
              Stock & Warehouse Logistics
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => {
                      setStock(e.target.value);
                      setIsOneOff(parseInt(e.target.value, 10) === 1);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Warehouse Bin *</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    placeholder="e.g. Geelong (W1-A-01)"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOneOff}
                  onChange={(e) => {
                    setIsOneOff(e.target.checked);
                    if (e.target.checked) setStock('1');
                  }}
                  className="rounded border-neutral-700 text-[#FFD400] focus:ring-0"
                />
                <span>Unique 1-of-1 Item (Automatically marks sold out upon purchase)</span>
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-1">Shipping Tier</label>
                  <select
                    value={shippingClass}
                    onChange={(e) => setShippingClass(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-1.5 rounded-xl outline-none"
                  >
                    <option value="standard">Standard ($9.95 / Free over $99)</option>
                    <option value="express">Express Courier ($14.95)</option>
                    <option value="bulky">Bulky Freight</option>
                    <option value="free">Free Australia Wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 font-bold mb-1">Dimensions (L x W x H cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="L"
                    className="bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-1.5 rounded-xl outline-none font-mono text-center"
                  />
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    placeholder="W"
                    className="bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-1.5 rounded-xl outline-none font-mono text-center"
                  />
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="H"
                    className="bg-neutral-900 border border-neutral-800 text-white text-xs px-2 py-1.5 rounded-xl outline-none font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-3 sticky top-4 shadow-2xl">
            <button
              type="button"
              onClick={() => handleSubmitProduct(false)}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#FFD400] hover:bg-[#FFE033] disabled:opacity-50 text-black font-black uppercase text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xl cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Publishing to Store...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Publish to CheapLoot Store
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSubmitProduct(true)}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-neutral-700"
            >
              <Plus className="w-4 h-4" />
              Save & Add Another Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
