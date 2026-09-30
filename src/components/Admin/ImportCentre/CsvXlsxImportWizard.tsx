import React, { useState, useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, Check, ArrowRight, RefreshCw, 
  Settings2, Save, Download, AlertTriangle, ShieldCheck,
  FolderOpen, Layers, CheckCircle2, FileText
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImportTemplate, ImportMode, ImportDraftProduct, ProductCondition } from '../../../types';

interface Props {
  templates: ImportTemplate[];
  onParsedDrafts: (drafts: ImportDraftProduct[], sourceName: string, mode: ImportMode) => void;
  onSaveTemplate: (template: Partial<ImportTemplate>) => void;
}

const SAMPLE_DATASETS = {
  master: [
    { SKU: 'TOOL-MAK-001', Title: 'Makita 18V Brushless Impact Driver DTD154Z', Brand: 'Makita', Barcode: '088381826457', MPN: 'DTD154Z', Cost: '85.00', Price: '169.00', Qty: '4', Condition: 'Good Used', Category: 'Tools & Hardware', 'Warehouse Location': 'W1-A-01' },
    { SKU: 'AUTO-H11-LED', Title: 'Philips X-tremeUltinon LED H11 Headlight Bulbs Pair', Brand: 'Philips', Barcode: '8719018060303', MPN: '11362XUX2', Cost: '42.50', Price: '99.00', Qty: '8', Condition: 'Brand New', Category: 'Automotive', 'Warehouse Location': 'W1-B-02' },
    { SKU: 'MEDIA-LOTR-4K', Title: 'The Lord of the Rings Extended Edition 4K UHD Boxset', Brand: 'Warner Bros', Barcode: '9398700044558', MPN: 'WB-LOTR4K', Cost: '28.00', Price: '69.00', Qty: '2', Condition: 'Open Box', Category: 'Media & Entertainment', 'Warehouse Location': 'W2-C-05' },
    { SKU: 'ELEC-SONY-WH', Title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones', Brand: 'Sony', Barcode: '4548736112216', MPN: 'WH1000XM4B', Cost: '110.00', Price: '249.00', Qty: '1', Condition: 'Refurbished', Category: 'Electronics', 'Warehouse Location': 'W1-A-03' }
  ],
  supplierA: [
    { ItemCode: 'BOS-GSB18V', Description: 'Bosch Professional GSB 18V-55 Hammer Drill Bare', Manufacturer: 'Bosch', Bar_Code: '3165140956895', UnitCost: '62.00', SuggestedRRP: '139.00', StockCount: '6', Grade: 'Open Box', Department: 'Tools & Hardware' },
    { ItemCode: 'DEW-DCD796', Description: 'DeWalt 18V XR Compact Brushless Combi Drill', Manufacturer: 'DeWalt', Bar_Code: '5035048644485', UnitCost: '75.00', SuggestedRRP: '155.00', StockCount: '3', Grade: 'Good Used', Department: 'Tools & Hardware' },
    { ItemCode: 'MIL-M18FID', Description: 'Milwaukee M18 Fuel 1/4 Hex Impact Driver M18FID2', Manufacturer: 'Milwaukee', Bar_Code: '4931466000000', UnitCost: '95.00', SuggestedRRP: '199.00', StockCount: '2', Grade: 'Brand New', Department: 'Tools & Hardware' }
  ],
  ebayStore: [
    { 'Custom Label': 'LIGHT-LED-BAR-42', 'Item Title': '42 Inch Curved Cree LED Light Bar Offroad 4WD Spot Flood', 'Available Quantity': '12', 'Buy It Now Price': '119.00', 'Item Number': '3849102941', 'UPC': '93481029381', 'Condition': 'Brand New', 'Item Location': 'W1-B-04' },
    { 'Custom Label': 'CAR-SOCKET-SET', 'Item Title': 'Kincrome 1/4 & 3/8 Drive Metric Imperial Socket Set 68pc', 'Available Quantity': '5', 'Buy It Now Price': '89.00', 'Item Number': '3849102942', 'UPC': '93127539012', 'Condition': 'Good Used', 'Item Location': 'W1-A-02' }
  ]
};

const TARGET_FIELDS = [
  { key: 'sku', label: 'SKU (Stock Keeping Unit)', required: false },
  { key: 'title', label: 'Product Title / Name', required: true },
  { key: 'brand', label: 'Brand / Manufacturer', required: true },
  { key: 'price', label: 'Retail Price (AUD $)', required: true },
  { key: 'costPrice', label: 'Cost Price (AUD $)', required: false },
  { key: 'stock', label: 'Stock Quantity', required: false },
  { key: 'condition', label: 'Condition Grade', required: false },
  { key: 'category', label: 'Category / Department', required: false },
  { key: 'barcode', label: 'Barcode / EAN / UPC', required: false },
  { key: 'mpn', label: 'Manufacturer Part Number (MPN)', required: false },
  { key: 'warehouseLocation', label: 'Warehouse Bin Location', required: false },
  { key: 'shortDescription', label: 'Short Description', required: false }
];

export const CsvXlsxImportWizard: React.FC<Props> = ({
  templates,
  onParsedDrafts,
  onSaveTemplate
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isFastMode, setIsFastMode] = useState(true);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Settings
  const [importMode, setImportMode] = useState<ImportMode>('CREATE_AND_UPDATE');
  const [defaultCondition, setDefaultCondition] = useState<ProductCondition>('Good Used');
  const [defaultWarehouse, setDefaultWarehouse] = useState('Geelong (W1-A-01)');
  const [allowBlankOverwrite, setAllowBlankOverwrite] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto detect mappings when headers change
  const autoDetectMappings = async (extractedHeaders: string[]) => {
    try {
      const res = await fetch('/api/import/detect-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: extractedHeaders })
      });
      const data = await res.json();
      if (data.success && data.mappings) {
        setMappings(data.mappings);
        return data.mappings;
      }
    } catch (err) {
      console.warn('Auto map failed, using fallback manual mapping');
    }
    return {};
  };

  // 1-Click Fast Ingest pipeline
  const executeFastIngest = async (rows: any[], extractedHeaders: string[], sourceName: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Step 1: Detect mappings
      const detectedMappings = await autoDetectMappings(extractedHeaders);

      // Step 2: Directly execute parse
      const res = await fetch('/api/import/preview-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          mappings: detectedMappings,
          mode: importMode,
          defaultCondition,
          defaultWarehouse
        })
      });

      const data = await res.json();
      if (!data.success || !data.drafts) {
        throw new Error(data.message || 'Failed to auto-parse import');
      }

      onParsedDrafts(data.drafts, sourceName, importMode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fast Auto-Ingest failed. Switching to step-by-step mapping.');
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load sample dataset
  const handleLoadSample = async (sampleKey: 'master' | 'supplierA' | 'ebayStore') => {
    const data = SAMPLE_DATASETS[sampleKey];
    const extractedHeaders = Object.keys(data[0]);
    const name = `sample_${sampleKey}_intake.csv`;
    setFileName(name);
    setHeaders(extractedHeaders);
    setRawRows(data);

    if (isFastMode) {
      await executeFastIngest(data, extractedHeaders, name);
    } else {
      await autoDetectMappings(extractedHeaders);
      setStep(2);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const isCsv = file.name.endsWith('.csv');
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data && results.data.length > 0) {
            const extractedHeaders = results.meta.fields || Object.keys(results.data[0] as any);
            setHeaders(extractedHeaders);
            setRawRows(results.data);
            if (isFastMode) {
              await executeFastIngest(results.data, extractedHeaders, file.name);
            } else {
              await autoDetectMappings(extractedHeaders);
              setStep(2);
            }
          } else {
            setErrorMessage('CSV file appears empty or unreadable.');
          }
        },
        error: (err) => {
          setErrorMessage(`CSV parse error: ${err.message}`);
        }
      });
    } else if (isXlsx) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (data && data.length > 0) {
            const extractedHeaders = Object.keys(data[0]);
            setHeaders(extractedHeaders);
            setRawRows(data);
            if (isFastMode) {
              await executeFastIngest(data, extractedHeaders, file.name);
            } else {
              await autoDetectMappings(extractedHeaders);
              setStep(2);
            }
          } else {
            setErrorMessage('Spreadsheet is empty.');
          }
        } catch (err: any) {
          setErrorMessage(`Spreadsheet error: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setErrorMessage('Please upload a .csv, .xlsx, or .xls file.');
    }
  };

  // Apply template
  const handleApplyTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) {
      setMappings(tmpl.mappings);
      if (tmpl.defaultCondition) setDefaultCondition(tmpl.defaultCondition);
      if (tmpl.defaultWarehouseLocation) setDefaultWarehouse(tmpl.defaultWarehouseLocation);
    }
  };

  // Save current mappings as template
  const handleSaveCurrentAsTemplate = () => {
    if (!templateNameInput.trim()) return;
    onSaveTemplate({
      name: templateNameInput.trim(),
      sourceFormat: fileName.endsWith('.xlsx') ? 'xlsx' : 'csv',
      mappings,
      defaultCondition,
      defaultWarehouseLocation: defaultWarehouse
    });
    setTemplateNameInput('');
  };

  // Run Preview Validation & Proceed to Review Grid
  const handleExecuteParse = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/import/preview-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rawRows,
          mappings,
          mode: importMode,
          defaultCondition,
          defaultWarehouse
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to process import rows');
      }

      onParsedDrafts(data.drafts, fileName || 'Spreadsheet Import', importMode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Import preview failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800 space-y-6">
      {/* Wizard Progress Steps & Fast Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#FFD400]" />
              CSV & XLSX Inventory Intake
            </h2>
            {isFastMode && (
              <span className="text-[10px] font-black uppercase bg-[#FFD400] text-black px-2 py-0.5 rounded">
                ⚡ 1-Click Fast Ingest Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Automatic column detection, Geelong & Werribee bin allocation, and instant review queue</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setIsFastMode(true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${isFastMode ? 'bg-[#FFD400] text-black font-black' : 'text-gray-400 hover:text-white'}`}
            >
              ⚡ 1-Click Auto
            </button>
            <button
              type="button"
              onClick={() => setIsFastMode(false)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${!isFastMode ? 'bg-[#FFD400] text-black font-black' : 'text-gray-400 hover:text-white'}`}
            >
              Step-by-Step
            </button>
          </div>

          {!isFastMode && (
            <div className="flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${step === 1 ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-800 text-gray-400'}`}>
                <span>1</span> Upload File
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${step === 2 ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-800 text-gray-400'}`}>
                <span>2</span> Column Mapping
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${step === 3 ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-800 text-gray-400'}`}>
                <span>3</span> Rules & Preview
              </div>
            </div>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="p-4 bg-[#FFD400]/10 border border-[#FFD400]/40 rounded-xl text-xs text-[#FFD400] flex items-center gap-3 font-bold">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Auto-detecting spreadsheet headers, calculating Geelong/Werribee margins, and populating review queue...</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* STEP 1: FILE UPLOAD OR SAMPLE SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-neutral-700 hover:border-[#FFD400] rounded-2xl p-10 text-center transition-colors bg-neutral-900/40">
            <Upload className="w-12 h-12 text-[#FFD400] mx-auto mb-3" />
            <h3 className="font-black text-white text-base">Select or Drop CSV / XLSX File</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Supports .csv, .xlsx, .xls spreadsheets up to 25MB</p>
            
            <label className="inline-block px-6 py-2.5 bg-[#FFD400] hover:bg-[#FFE033] text-black font-black text-xs uppercase rounded-xl cursor-pointer transition-colors shadow-lg">
              Browse Spreadsheet
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Sample Intake Templates */}
          <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="text-xs font-bold uppercase text-gray-300 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#FFD400]" />
              Or Test with Pre-Loaded Real Intake Feeds
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleLoadSample('master')}
                className="p-3 bg-[#181818] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors space-y-1"
              >
                <div className="font-bold text-xs text-white">CheapLoot Master Catalogue</div>
                <div className="text-[11px] text-gray-400">Standard template with SKUs, MPNs, Costs & Bin Locations</div>
                <div className="text-[10px] text-[#FFD400] font-mono font-bold pt-1">Load 4 Sample Items</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample('supplierA')}
                className="p-3 bg-[#181818] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors space-y-1"
              >
                <div className="font-bold text-xs text-white">Supplier A Liquidation Feed</div>
                <div className="text-[11px] text-gray-400">Tools & hardware with custom column names (ItemCode, SuggestedRRP)</div>
                <div className="text-[10px] text-blue-400 font-mono font-bold pt-1">Load 3 Sample Items</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample('ebayStore')}
                className="p-3 bg-[#181818] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors space-y-1"
              >
                <div className="font-bold text-xs text-white">eBay AU Store Export</div>
                <div className="text-[11px] text-gray-400">eBay formatted export with Custom Labels and Item Numbers</div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold pt-1">Load 2 Sample Items</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & TEMPLATES */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Header Info & Saved Templates */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <div>
              <span className="text-xs text-gray-400">Loaded File:</span>
              <div className="font-black text-sm text-white">{fileName} ({rawRows.length} Rows Detected)</div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 font-bold">Apply Saved Template:</label>
              <select
                value={selectedTemplateId}
                onChange={e => handleApplyTemplate(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#FFD400]"
              >
                <option value="">-- Choose Mapping Preset --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.sourceFormat.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase text-gray-300 flex items-center justify-between">
              <span>Map Spreadsheet Columns to CheapLoot Fields</span>
              <span className="text-gray-500 font-mono text-[11px]">{headers.length} Headers Found</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {headers.map(rawHeader => {
                const currentMappedField = mappings[rawHeader] || '';
                return (
                  <div key={rawHeader} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[#FFD400] truncate">{rawHeader}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        Sample: <span className="text-gray-200">{String(rawRows[0]?.[rawHeader] ?? '')}</span>
                      </div>
                    </div>

                    <select
                      value={currentMappedField}
                      onChange={e => setMappings({ ...mappings, [rawHeader]: e.target.value })}
                      className={`text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none ${currentMappedField ? 'bg-neutral-800 border-emerald-500/50 text-white font-bold' : 'bg-neutral-800 border-neutral-700 text-gray-400'}`}
                    >
                      <option value="">-- Do Not Import --</option>
                      {TARGET_FIELDS.map(f => (
                        <option key={f.key} value={f.key}>
                          {f.label} {f.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save as New Template */}
          <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3">
            <input
              type="text"
              placeholder="Template name (e.g. My Supplier Feed)..."
              value={templateNameInput}
              onChange={e => setTemplateNameInput(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFD400]"
            />
            <button
              type="button"
              onClick={handleSaveCurrentAsTemplate}
              disabled={!templateNameInput.trim()}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              Save Mapping Template
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
            >
              Back to Upload
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5"
            >
              Configure Safeguards & Rules
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SAFEGUARDS, DEFAULTS & VALIDATION EXECUTION */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Mode Selection */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase text-[#FFD400] flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" />
                Import Action Mode
              </label>
              
              <div className="space-y-2">
                <label className="p-3 bg-[#181818] border border-neutral-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-neutral-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="CREATE_AND_UPDATE"
                    checked={importMode === 'CREATE_AND_UPDATE'}
                    onChange={() => setImportMode('CREATE_AND_UPDATE')}
                    className="w-4 h-4 accent-[#FFD400]"
                  />
                  <div>
                    <div className="font-bold text-xs text-white">Create New & Update Existing (Recommended)</div>
                    <div className="text-[11px] text-gray-400">Adds new products and updates stock/pricing on matching SKUs</div>
                  </div>
                </label>

                <label className="p-3 bg-[#181818] border border-neutral-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-neutral-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="CREATE_ONLY"
                    checked={importMode === 'CREATE_ONLY'}
                    onChange={() => setImportMode('CREATE_ONLY')}
                    className="w-4 h-4 accent-[#FFD400]"
                  />
                  <div>
                    <div className="font-bold text-xs text-white">Create Only (Skip Duplicates)</div>
                    <div className="text-[11px] text-gray-400">Strictly adds new items; skips any item matching existing SKU or barcode</div>
                  </div>
                </label>

                <label className="p-3 bg-[#181818] border border-neutral-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-neutral-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="UPDATE_ONLY"
                    checked={importMode === 'UPDATE_ONLY'}
                    onChange={() => setImportMode('UPDATE_ONLY')}
                    className="w-4 h-4 accent-[#FFD400]"
                  />
                  <div>
                    <div className="font-bold text-xs text-white">Update Only (Stock / Price Feed)</div>
                    <div className="text-[11px] text-gray-400">Only updates quantities and prices for products already in your catalogue</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Default Fallbacks & Overwrite Safeguards */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
              <label className="text-xs font-bold uppercase text-[#FFD400] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Defaults & Overwrite Protection
              </label>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Fallback Condition Grade:</label>
                  <select
                    value={defaultCondition}
                    onChange={e => setDefaultCondition(e.target.value as any)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                  >
                    <option value="Good Used">Good Used (Standard Tested)</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="For Parts or Not Working">For Parts or Not Working</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Default Warehouse Bin Location:</label>
                  <input
                    type="text"
                    value={defaultWarehouse}
                    onChange={e => setDefaultWarehouse(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white font-mono rounded-lg p-2 focus:outline-none focus:border-[#FFD400]"
                    placeholder="W1-A-01"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={allowBlankOverwrite}
                      onChange={e => setAllowBlankOverwrite(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#FFD400]"
                    />
                    <span>Allow blank spreadsheet cells to overwrite existing product values (Default: Safe OFF)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Button */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
            >
              Back to Mapping
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteParse}
              className="px-6 py-2.5 bg-[#FFD400] hover:bg-[#FFE033] text-black text-xs font-black uppercase rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isProcessing ? 'Validating & Detecting Duplicates...' : `Generate & Validate ${rawRows.length} Draft Listings`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
