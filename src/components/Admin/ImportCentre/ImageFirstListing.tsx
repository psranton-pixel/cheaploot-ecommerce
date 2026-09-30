import React, { useState } from 'react';
import { 
  Camera, Image as ImageIcon, Sparkles, AlertTriangle, Check, 
  Trash2, Plus, ArrowRight, Eye, RefreshCw, Copy, CheckCheck,
  Layers, Tag, DollarSign, ShieldAlert, CheckCircle2, Wand2,
  HelpCircle, FileCheck, Search, Sliders, ShieldCheck, ChevronRight,
  ExternalLink, TrendingUp, PackageCheck, AlertCircle
} from 'lucide-react';
import { 
  ImportDraftProduct, 
  PhotoGroup, 
  StructuredProductIdentification, 
  ReAnalysisFocusMode,
  ProductIdentificationBenchmarkItem 
} from '../../../types';
import { IdentificationBenchmarkModal } from './IdentificationBenchmarkModal';

interface Props {
  onDraftGenerated: (draft: ImportDraftProduct) => void;
}

export const ImageFirstListing: React.FC<Props> = ({ onDraftGenerated }) => {
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Pipeline State
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'identifying' | 'identified' | 'generating_listing' | 'ready'>('idle');
  const [stage1Result, setStage1Result] = useState<StructuredProductIdentification | null>(null);
  const [previewDraft, setPreviewDraft] = useState<ImportDraftProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Operator Inputs & Hints
  const [manualHint, setManualHint] = useState('');
  const [brandHint, setBrandHint] = useState('');
  const [conditionHint, setConditionHint] = useState('Good Used');
  const [costPriceInput, setCostPriceInput] = useState<string>('15');
  const [rawTextInput, setRawTextInput] = useState('');
  const [selectedFocusMode, setSelectedFocusMode] = useState<ReAnalysisFocusMode>('ALL_IMAGES');

  // Benchmark Modal State
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  // Copy helper
  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // 10 Standard Sample Batches for Rapid QA
  const samplePhotoBatches = [
    {
      title: 'Ozito 18V Cordless Drill Driver (With Model Plate PXDDS-201)',
      photos: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
        'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80'
      ],
      brand: 'Ozito',
      condition: 'Good Used',
      hint: 'Ozito 18V cordless drill with model sticker PXDDS-201',
      cost: '12'
    },
    {
      title: 'Dell 65W Laptop Power Adapter HA65NM130 (19.5V 3.34A)',
      photos: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80'
      ],
      brand: 'Dell',
      condition: 'Good Used',
      hint: 'Dell 65W AC Adapter 19.5V HA65NM130 barrel connector',
      cost: '8'
    },
    {
      title: 'Inception (2010) Special Edition DVD Region 4 Australia',
      photos: [
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80'
      ],
      brand: 'Warner Bros',
      condition: 'Good Used',
      hint: 'Inception DVD Region 4 rating M',
      cost: '2'
    },
    {
      title: 'Toyota Hilux Right Rear Tail Light Assembly OEM 81551-0K010',
      photos: [
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&q=80'
      ],
      brand: 'Toyota',
      condition: 'Excellent Used',
      hint: 'Toyota Hilux N70 tail light OEM 81551-0K010 rear right',
      cost: '35'
    },
    {
      title: 'High Speed HDMI 2.0 Cable 2 Metre Generic Black',
      photos: [
        'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&q=80'
      ],
      brand: 'Generic / Unbranded',
      condition: 'Brand New',
      hint: 'Generic 2m HDMI cable gold connectors',
      cost: '3'
    }
  ];

  // Helper to read and compress file to high-efficiency Base64 Data URL (max 1600px, 0.85 quality)
  const readFileAsDataUrl = (file: File, maxDim = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = typeof reader.result === 'string' ? reader.result : '';
        if (!rawResult.startsWith('data:image/')) {
          resolve(rawResult);
          return;
        }

        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
            return;
          }
          resolve(rawResult);
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Upload handler with base64 conversion
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newPhotos.push(dataUrl);
      } catch (err: any) {
        console.error('Error reading photo file:', err);
      }
    }

    if (newPhotos.length === 0) return;

    const newGroup: PhotoGroup = {
      id: `group-${Date.now()}`,
      images: newPhotos,
      primaryImageIndex: 0,
      status: 'pending'
    };

    setPhotoGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    setStage1Result(null);
    setPreviewDraft(null);
    setPipelineStage('idle');
  };

  const handleLoadSample = (sample: typeof samplePhotoBatches[0]) => {
    const newGroup: PhotoGroup = {
      id: `group-${Date.now()}`,
      images: sample.photos,
      primaryImageIndex: 0,
      status: 'pending'
    };

    setPhotoGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    setBrandHint(sample.brand !== 'Generic / Unbranded' ? sample.brand : '');
    setConditionHint(sample.condition);
    setManualHint(sample.hint);
    setCostPriceInput(sample.cost);
    setStage1Result(null);
    setPreviewDraft(null);
    setPipelineStage('idle');
  };

  // STAGE 1: Execute Dedicated Identification Stage
  const handleRunIdentificationStage1 = async (focusMode: ReAnalysisFocusMode = 'ALL_IMAGES') => {
    const activeGroup = photoGroups.find(g => g.id === activeGroupId);
    if (!activeGroup) return;

    setPipelineStage('identifying');
    setErrorMessage(null);
    setPreviewDraft(null);

    try {
      const res = await fetch('/api/import/ai-identify-stage1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: activeGroup.images,
          rawText: rawTextInput,
          brandHint,
          conditionHint,
          costPrice: parseFloat(costPriceInput) || 15,
          focusMode,
          manualHint
        })
      });

      const data = await res.json();
      if (!data.success || !data.identification) {
        throw new Error(data.message || 'AI Identification Stage 1 failed');
      }

      setStage1Result(data.identification);
      activeGroup.structuredIdentification = data.identification;
      setPipelineStage('identified');
      setPhotoGroups([...photoGroups]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Identification failed');
      setPipelineStage('idle');
    }
  };

  // STAGE 2: Generate Listing strictly from Stage 1 identification
  const handleGenerateListingStage2 = async () => {
    if (!stage1Result) return;
    const activeGroup = photoGroups.find(g => g.id === activeGroupId);
    if (!activeGroup) return;

    setPipelineStage('generating_listing');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/ai-generate-stage2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identification: stage1Result,
          costPrice: parseFloat(costPriceInput) || 15,
          conditionHint,
          rawText: rawTextInput,
          images: activeGroup.images
        })
      });

      const data = await res.json();
      if (!data.success || !data.draft) {
        throw new Error(data.message || 'Listing generation failed');
      }

      setPreviewDraft(data.draft);
      activeGroup.draftProduct = data.draft;
      activeGroup.status = 'identified';
      setPipelineStage('ready');
      setPhotoGroups([...photoGroups]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Listing generation failed');
      setPipelineStage('identified');
    }
  };

  // 1-Click Complete Pipeline (Stage 1 -> Auto Stage 2)
  const handleRunFullPipeline = async () => {
    const activeGroup = photoGroups.find(g => g.id === activeGroupId);
    if (!activeGroup) return;

    setPipelineStage('identifying');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/ai-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: activeGroup.images,
          rawText: rawTextInput,
          brandHint,
          conditionHint,
          costPrice: parseFloat(costPriceInput) || 15,
          focusMode: selectedFocusMode,
          manualHint
        })
      });

      const data = await res.json();
      if (!data.success || !data.draft) {
        throw new Error(data.message || 'Pipeline failed');
      }

      setStage1Result(data.identification || data.draft.structuredIdentification);
      setPreviewDraft(data.draft);
      activeGroup.structuredIdentification = data.identification || data.draft.structuredIdentification;
      activeGroup.draftProduct = data.draft;
      activeGroup.status = 'identified';
      setPipelineStage('ready');
      setPhotoGroups([...photoGroups]);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI pipeline failed');
      setPipelineStage('idle');
    }
  };

  const handleApproveDraft = () => {
    if (previewDraft) {
      onDraftGenerated(previewDraft);
      setPreviewDraft(null);
      setStage1Result(null);
      setPhotoGroups(prev => prev.filter(g => g.id !== activeGroupId));
      setActiveGroupId(null);
      setPipelineStage('idle');
    }
  };

  const activeGroup = photoGroups.find(g => g.id === activeGroupId);

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase bg-[#FFD400] text-black px-2 py-0.5 rounded">
              Two-Stage AI Pipeline
            </span>
            <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#FFD400]" />
              AI Product Identification & Listing Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            <strong>Stage 1:</strong> Physical object recognition, brand/model extraction, label OCR & evidence synthesis. &bull; <strong>Stage 2:</strong> Commercial description, specifications, and liquidation pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBenchmarkOpen(true)}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#FFD400] text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            10-Product Test Benchmark
          </button>

          <label className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg">
            <Plus className="w-4 h-4" />
            Add Warehouse Photos
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Quick Test Demo Batches */}
      {photoGroups.length === 0 && (
        <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD400]" />
              Rapid QA: Load Real Test Photos Across Categories
            </div>
            <span className="text-[11px] font-mono text-gray-500">Click any card to test Stage 1 identification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {samplePhotoBatches.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="p-3 bg-[#181818] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors flex items-center gap-3 group"
              >
                <img src={sample.photos[0]} alt={sample.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate group-hover:text-[#FFD400] transition-colors">{sample.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{sample.photos.length} Photos &bull; {sample.brand}</div>
                  <div className="text-[10px] text-[#FFD400] font-mono font-bold mt-1">Load & Identify &rarr;</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Groups Workflow Grid */}
      {photoGroups.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Groups List & Uploads */}
          <div className="lg:col-span-4 space-y-4">
            <div className="text-xs font-bold uppercase text-gray-400 flex items-center justify-between">
              <span>Photo Batches ({photoGroups.length})</span>
              <span className="text-[10px] text-gray-500 font-mono">1 Item per Group</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {photoGroups.map(group => {
                const isActive = group.id === activeGroupId;
                const ident = group.structuredIdentification;
                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setStage1Result(group.structuredIdentification || null);
                      setPreviewDraft(group.draftProduct || null);
                      setPipelineStage(group.draftProduct ? 'ready' : (group.structuredIdentification ? 'identified' : 'idle'));
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-3 ${
                      isActive ? 'bg-[#1a1a1a] border-[#FFD400]' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#FFD400]" />
                        Group ({group.images.length} Photos)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoGroups(prev => prev.filter(g => g.id !== group.id));
                        }}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image Thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {group.images.map((url, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-700 flex-shrink-0 relative">
                          <img src={url} alt="Uploaded item" className="w-full h-full object-cover" />
                          {i === group.primaryImageIndex && (
                            <span className="absolute top-0 left-0 bg-black/80 text-[8px] text-[#FFD400] font-black px-1 rounded-br">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {ident && (
                      <div className="p-2 bg-neutral-800/80 rounded-lg text-xs space-y-0.5 border border-neutral-700/60">
                        <div className="font-bold text-white truncate">{ident.brand} {ident.model || ident.item_type}</div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>{ident.item_type}</span>
                          <span className={ident.confidence >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                            {ident.confidence}% ({ident.confidence_tier})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Two-Stage Identification & Listing Panel */}
          <div className="lg:col-span-8 space-y-4">
            {activeGroup ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
                {/* Pipeline Step Breadcrumb Indicator */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`flex items-center gap-1.5 font-bold ${stage1Result ? 'text-emerald-400' : (pipelineStage === 'identifying' ? 'text-[#FFD400]' : 'text-white')}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${stage1Result ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-[#FFD400] text-black'}`}>
                        1
                      </span>
                      <span>STAGE 1: IDENTIFICATION</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-600" />

                    <div className={`flex items-center gap-1.5 font-bold ${previewDraft ? 'text-emerald-400' : (pipelineStage === 'generating_listing' ? 'text-[#FFD400]' : 'text-gray-500')}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${previewDraft ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-gray-400'}`}>
                        2
                      </span>
                      <span>STAGE 2: LISTING GENERATION</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-gray-400">{activeGroup.images.length} Photos in Group</span>
                </div>

                {/* Input Fields & Context Hints */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-400 block mb-1 font-bold">Give AI a Hint (Optional Context):</label>
                      <input
                        type="text"
                        value={manualHint}
                        onChange={e => setManualHint(e.target.value)}
                        placeholder="e.g. I think this is an Ozito mower, or Came from 2016 Navara D23"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 block mb-1 font-bold">Brand Hint (Optional):</label>
                      <input
                        type="text"
                        value={brandHint}
                        onChange={e => setBrandHint(e.target.value)}
                        placeholder="e.g. Milwaukee, Ozito, Dell, Samsung"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 block mb-1 font-bold">Item Condition:</label>
                      <select
                        value={conditionHint}
                        onChange={e => setConditionHint(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FFD400]"
                      >
                        <option value="Good Used">Good Used (Warehouse Tested)</option>
                        <option value="Brand New">Brand New (Retail Box / Sealed)</option>
                        <option value="New Other">New Other (Open Packaging)</option>
                        <option value="Open Box">Open Box</option>
                        <option value="Refurbished">Refurbished</option>
                        <option value="Fair Used">Fair Used (Heavier Wear)</option>
                        <option value="For Parts / Not Working">For Parts or Not Working</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 block mb-1 font-bold">Acquisition Cost (AUD $):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={costPriceInput}
                        onChange={e => setCostPriceInput(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#FFD400]"
                      />
                    </div>
                  </div>

                  {/* Re-analysis Focus Mode Selector */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
                    <span className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-[#FFD400]" />
                      Re-Analyse Mode:
                    </span>
                    {(['ALL_IMAGES', 'FOCUS_LABELS', 'FOCUS_BARCODE', 'IDENTIFY_MODEL', 'IDENTIFY_AUTO'] as ReAnalysisFocusMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSelectedFocusMode(mode);
                          if (stage1Result) {
                            handleRunIdentificationStage1(mode);
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                          selectedFocusMode === mode 
                            ? 'bg-[#FFD400] text-black border-[#FFD400]' 
                            : 'bg-neutral-800 text-gray-300 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        {mode === 'ALL_IMAGES' && 'Use All Images'}
                        {mode === 'FOCUS_LABELS' && 'Focus Labels & OCR'}
                        {mode === 'FOCUS_BARCODE' && 'Focus Barcode'}
                        {mode === 'IDENTIFY_MODEL' && 'Identify Model / MPN'}
                        {mode === 'IDENTIFY_AUTO' && 'Automotive OEM / Fitment'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Execute Pipeline Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pipelineStage === 'identifying' || pipelineStage === 'generating_listing'}
                    onClick={() => handleRunIdentificationStage1(selectedFocusMode)}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition-colors disabled:opacity-50"
                  >
                    {pipelineStage === 'identifying' ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#FFD400]" />
                    ) : (
                      <Search className="w-4 h-4 text-[#FFD400]" />
                    )}
                    {pipelineStage === 'identifying' ? 'Analyzing Images & Labels...' : (stage1Result ? 'Re-Analyse Stage 1' : 'Run Stage 1: Identification')}
                  </button>

                  <button
                    type="button"
                    disabled={pipelineStage === 'identifying' || pipelineStage === 'generating_listing'}
                    onClick={handleRunFullPipeline}
                    className="flex-1 py-3 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    Run Full 2-Stage Pipeline
                  </button>
                </div>

                {/* STAGE 1: Structured Identification Card & Evidence Display */}
                {stage1Result && (
                  <div className="p-4 bg-[#161616] border border-neutral-800 rounded-xl space-y-4">
                    {/* Header with Confidence badge */}
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400">Stage 1 Verified Result</span>
                        <div className="text-sm font-black text-white flex items-center gap-2">
                          <span>{stage1Result.brand}</span>
                          <span className="text-emerald-400">{stage1Result.model || stage1Result.item_type}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-black uppercase rounded-lg border font-mono ${
                          stage1Result.confidence_tier === 'HIGH'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : (stage1Result.confidence_tier === 'LIKELY'
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                              : 'bg-red-950/80 border-red-800 text-red-300')
                        }`}>
                          {stage1Result.confidence_tier}: {stage1Result.confidence}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Core Identifiers Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">ITEM TYPE:</span>
                        <strong className="text-white">{stage1Result.item_type}</strong>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">BRAND:</span>
                        <strong className="text-[#FFD400]">{stage1Result.brand}</strong>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">MODEL / MPN:</span>
                        <strong className="text-emerald-400">{stage1Result.model || stage1Result.manufacturer_part_number || 'Unconfirmed'}</strong>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">CATEGORY:</span>
                        <strong className="text-gray-300 truncate block">{stage1Result.category}</strong>
                      </div>
                    </div>

                    {/* Confirmed Attributes vs Unconfirmed Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed Attributes
                        </div>
                        <div className="space-y-1 text-[11px] text-gray-300 font-mono">
                          {Object.entries(stage1Result.confirmed_attributes).length > 0 ? (
                            Object.entries(stage1Result.confirmed_attributes).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between">
                                <span className="text-gray-400">{k}:</span>
                                <span className="font-bold text-white">{v}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 italic">None logged</div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Unconfirmed / Missing Detail
                        </div>
                        <div className="space-y-1 text-[11px] text-gray-300 font-mono">
                          {stage1Result.not_confirmed_attributes && stage1Result.not_confirmed_attributes.length > 0 ? (
                            stage1Result.not_confirmed_attributes.map((u, i) => (
                              <div key={i} className="text-amber-200/80">&bull; {u}</div>
                            ))
                          ) : (
                            <div className="text-emerald-400 font-bold">All Key Specifications Confirmed &check;</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Evidence Trail */}
                    <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2 text-xs">
                      <div className="text-[10px] font-black uppercase text-[#FFD400] flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        AI Evidence & OCR Trail
                      </div>
                      <ul className="space-y-1 text-[11px] text-gray-300">
                        {stage1Result.evidence?.map((ev, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#FFD400] mt-0.5">&bull;</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Valuation Breakdown if available */}
                    {stage1Result.valuation && (
                      <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <div className="text-[10px] font-black uppercase text-[#FFD400] flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Australian Market Valuation (AUD)
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">Currency: AUD</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono">
                          <div className="p-2 bg-neutral-800/80 rounded-lg border border-neutral-700/60">
                            <span className="text-[9px] text-gray-400 uppercase block">Low Value</span>
                            <strong className="text-gray-300 text-xs">${stage1Result.valuation.lowValue.toFixed(2)}</strong>
                          </div>
                          <div className="p-2 bg-neutral-800/80 rounded-lg border border-neutral-700/60">
                            <span className="text-[9px] text-gray-400 uppercase block">Typical Value</span>
                            <strong className="text-white text-xs font-bold">${stage1Result.valuation.typicalValue.toFixed(2)}</strong>
                          </div>
                          <div className="p-2 bg-neutral-800/80 rounded-lg border border-neutral-700/60">
                            <span className="text-[9px] text-gray-400 uppercase block">High Value</span>
                            <strong className="text-gray-300 text-xs">${stage1Result.valuation.highValue.toFixed(2)}</strong>
                          </div>
                          <div className="p-2 bg-neutral-800/80 rounded-lg border border-neutral-700/60">
                            <span className="text-[9px] text-gray-400 uppercase block">Expected Range</span>
                            <strong className="text-cyan-400 text-xs">{stage1Result.valuation.expectedSaleRange}</strong>
                          </div>
                          <div className="p-2 bg-emerald-950/80 rounded-lg border border-emerald-800/80">
                            <span className="text-[9px] text-emerald-400 uppercase font-black block">Rec. eBay</span>
                            <strong className="text-emerald-300 text-xs font-black">${stage1Result.valuation.recommendedEbayPrice.toFixed(2)}</strong>
                          </div>
                          <div className="p-2 bg-amber-950/80 rounded-lg border border-amber-800/80">
                            <span className="text-[9px] text-amber-400 uppercase font-black block">Quick Sale</span>
                            <strong className="text-amber-300 text-xs font-black">${stage1Result.valuation.quickSalePrice.toFixed(2)}</strong>
                          </div>
                        </div>

                        {stage1Result.valuation.marketResearchComps && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 text-gray-300">
                            <div className="p-2 bg-neutral-950/50 rounded-lg border border-neutral-800">
                              <span className="text-gray-500 text-[10px] block">RECENT SOLD COMPS (AU):</span>
                              <span className="text-emerald-400 font-bold">{stage1Result.valuation.marketResearchComps.recentSoldRange || 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-neutral-950/50 rounded-lg border border-neutral-800">
                              <span className="text-gray-500 text-[10px] block">CURRENT ASKING RANGE:</span>
                              <span className="text-amber-400 font-bold">{stage1Result.valuation.marketResearchComps.currentAskingRange || 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Advisory Banner if needed */}
                    {stage1Result.confidence < 80 && (
                      <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                        <span><strong>Operator Guidance:</strong> {stage1Result.requested_photo_or_action}</span>
                      </div>
                    )}

                    {/* Trigger Stage 2 */}
                    {!previewDraft && (
                      <button
                        type="button"
                        disabled={pipelineStage === 'generating_listing'}
                        onClick={handleGenerateListingStage2}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {pipelineStage === 'generating_listing' ? 'Writing Australian Market Listing & eBay Specs...' : 'Proceed to Stage 2: Generate eBay-Ready Listing'}
                      </button>
                    )}
                  </div>
                )}

                {/* STAGE 2: Resulting Commercial & eBay Listing Preview */}
                {previewDraft && (
                  <div className="mt-4 p-5 bg-[#181818] border border-emerald-500/50 rounded-xl space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Stage 2: eBay-Ready Listing Generated
                        </span>
                        {previewDraft.identificationStatus && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-neutral-800 text-[#FFD400] border border-neutral-700 font-mono">
                            {previewDraft.identificationStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {previewDraft.formattedListingText && (
                          <button
                            type="button"
                            onClick={() => handleCopy(previewDraft.formattedListingText || '', 'full')}
                            className="px-2.5 py-1 text-xs font-bold text-gray-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1 transition-colors"
                          >
                            {copiedSection === 'full' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedSection === 'full' ? 'Copied' : 'Copy Full Report'}
                          </button>
                        )}
                        <span className="text-xs font-mono font-bold text-white bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                          Rec. eBay: ${previewDraft.price.toFixed(2)} AUD
                        </span>
                      </div>
                    </div>

                    {/* eBay Title with 80 character counter */}
                    <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                        <span className="text-[#FFD400]">eBay Listing Title (Search-Optimised):</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400">{(previewDraft.ebayTitle || previewDraft.title).length}/80 chars</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(previewDraft.ebayTitle || previewDraft.title, 'title')}
                            className="text-gray-400 hover:text-white p-0.5"
                            title="Copy Title"
                          >
                            {copiedSection === 'title' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-white font-mono">{previewDraft.ebayTitle || previewDraft.title}</div>
                    </div>

                    {/* Pricing & Valuation Quick Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">COST PRICE:</span>
                        <strong className="text-white">${previewDraft.costPrice.toFixed(2)} AUD</strong>
                      </div>
                      <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-gray-500 block">TYPICAL VALUATION:</span>
                        <strong className="text-cyan-300">${(previewDraft.typicalValue || previewDraft.price).toFixed(2)} AUD</strong>
                      </div>
                      <div className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/60">
                        <span className="text-[10px] text-emerald-400 block font-bold">RECOMMENDED EBAY:</span>
                        <strong className="text-emerald-300 font-black">${previewDraft.price.toFixed(2)} AUD</strong>
                      </div>
                      <div className="p-2.5 bg-amber-950/40 rounded-lg border border-amber-800/60">
                        <span className="text-[10px] text-amber-400 block font-bold">QUICK SALE PRICE:</span>
                        <strong className="text-amber-300 font-black">${(previewDraft.quickSalePrice || previewDraft.price * 0.85).toFixed(2)} AUD</strong>
                      </div>
                    </div>

                    {/* eBay Item Specifics Grid */}
                    {previewDraft.ebayItemSpecifics && Object.keys(previewDraft.ebayItemSpecifics).length > 0 && (
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                          <span>eBay Item Specifics</span>
                          <span className="text-[#FFD400] font-mono">{Object.keys(previewDraft.ebayItemSpecifics).length} Verified Specifics</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                          {Object.entries(previewDraft.ebayItemSpecifics).map(([k, v]) => (
                            <div key={k} className="p-2 bg-neutral-800/70 rounded-lg border border-neutral-700/50">
                              <span className="text-gray-400 block text-[9px] uppercase">{k}</span>
                              <span className="font-bold text-white truncate block">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Included vs Missing Components */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <PackageCheck className="w-3.5 h-3.5" />
                          Included Components
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-gray-300 font-mono">
                          {(previewDraft.whatsIncluded || ['1x Inspected unit as pictured']).map((item, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-emerald-400">&check;</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Missing / Not Confirmed
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-gray-300 font-mono">
                          {(previewDraft.warnings || stage1Result?.not_confirmed_attributes || ['Original retail packaging not included']).slice(0, 3).map((w, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400 mt-0.5">&bull;</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Description preview */}
                    <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
                        <span>Customer-Facing eBay Description</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(previewDraft.description, 'desc')}
                          className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px]"
                        >
                          {copiedSection === 'desc' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedSection === 'desc' ? 'Copied' : 'Copy Description'}
                        </button>
                      </div>
                      <div className="p-3 bg-neutral-950 rounded-lg text-gray-300 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {previewDraft.description}
                      </div>
                    </div>

                    {/* Warnings banner */}
                    {previewDraft.warnings && previewDraft.warnings.length > 0 && (
                      <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Seller Verification Warnings:
                        </div>
                        <ul className="space-y-0.5 text-[11px] list-disc list-inside text-amber-200/90 font-mono">
                          {previewDraft.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={handleApproveDraft}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow-lg"
                      >
                        <Check className="w-4 h-4" />
                        Approve & Add to Review Queue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 bg-neutral-900 rounded-xl border border-neutral-800 text-xs space-y-3">
                <Camera className="w-8 h-8 text-gray-600 mx-auto" />
                <div>Select a photo group on the left or upload new product images to begin two-stage AI identification.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benchmark Quality Assurance Modal */}
      <IdentificationBenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </div>
  );
};
