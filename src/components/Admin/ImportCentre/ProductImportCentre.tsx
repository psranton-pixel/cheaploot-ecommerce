import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Camera, Scan, ShoppingBag, Zap, 
  Layers, CheckCircle2, AlertTriangle, ArrowRight, Download,
  RotateCcw, Sparkles, RefreshCw, Eye, Check, ShieldCheck, Plus, Upload
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImportJob, ImportTemplate, ImportDraftProduct, ImportMode, Product, ImportMetricsSummary } from '../../../types';
import { ImportMetricsOverview } from './ImportMetricsOverview';
import { CsvXlsxImportWizard } from './CsvXlsxImportWizard';
import { ImageFirstListing } from './ImageFirstListing';
import { BarcodeIntakeScanner } from './BarcodeIntakeScanner';
import { EbayImporter } from './EbayImporter';
import { QuickListIntake } from './QuickListIntake';
import { BulkReviewGrid } from './BulkReviewGrid';
import { CreateProductPage } from '../CreateProduct/CreateProductPage';
import { ExportToSheetButton } from '../../Sheets/ExportToSheetButton';

interface Props {
  allProducts: Product[];
  onProductsUpdated?: (updatedProducts: Product[]) => void;
}

export const ProductImportCentre: React.FC<Props> = ({ allProducts, onProductsUpdated }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'create_single' | 'csv_xlsx' | 'photos' | 'barcode' | 'quick_list' | 'ebay' | 'review_queue'
  >('overview');

  const [metrics, setMetrics] = useState<ImportMetricsSummary>({
    todayImported: 48,
    todayDraftsGenerated: 48,
    todayPublished: 48,
    todayDuplicatesPrevented: 3,
    todayErrors: 0,
    avgProcessingTimeSec: 3.8,
    queuePendingImages: 0,
    queueAiProcessing: 0,
    queueNeedsReview: 0,
    queueReadyToPublish: 0
  });

  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<ImportDraftProduct[]>([]);
  const [currentImportMode, setCurrentImportMode] = useState<ImportMode>('CREATE_AND_UPDATE');
  const [currentSourceName, setCurrentSourceName] = useState<string>('Intake Batch');
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUniversalDragOver, setIsUniversalDragOver] = useState(false);
  const [isUniversalProcessing, setIsUniversalProcessing] = useState(false);

  // Universal Drag & Drop File Intake (Handles both Spreadsheets and Images)
  const handleUniversalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsUniversalDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsUniversalProcessing(true);
    setNotification(null);

    try {
      const spreadsheetFile = files.find(f => 
        f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );

      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      if (spreadsheetFile) {
        // Handle Spreadsheet
        const fileName = spreadsheetFile.name;
        if (fileName.endsWith('.csv')) {
          Papa.parse(spreadsheetFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              if (results.data && results.data.length > 0) {
                const rows = results.data;
                const headers = Object.keys(rows[0] as object);
                // Call auto-detect & parse
                const mapRes = await fetch('/api/import/detect-mappings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ headers })
                });
                const mapData = await mapRes.json();
                const mappings = mapData.mappings || {};

                const parseRes = await fetch('/api/import/preview-parse', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    rows,
                    mappings,
                    mode: currentImportMode,
                    defaultCondition: 'Good Used',
                    defaultWarehouse: 'Geelong (W1-A-01)'
                  })
                });
                const parseData = await parseRes.json();
                if (parseData.success && parseData.drafts) {
                  handleParsedDrafts(parseData.drafts, fileName, currentImportMode);
                } else {
                  throw new Error(parseData.message || 'Failed to auto-parse dropped spreadsheet');
                }
              }
              setIsUniversalProcessing(false);
            },
            error: (err) => {
              setNotification({ type: 'error', message: `CSV parse error: ${err.message}` });
              setIsUniversalProcessing(false);
            }
          });
        } else {
          // XLSX
          const buffer = await spreadsheetFile.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);
          if (rows.length > 0) {
            const headers = Object.keys(rows[0] as object);
            const mapRes = await fetch('/api/import/detect-mappings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ headers })
            });
            const mapData = await mapRes.json();
            const mappings = mapData.mappings || {};

            const parseRes = await fetch('/api/import/preview-parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rows,
                mappings,
                mode: currentImportMode,
                defaultCondition: 'Good Used',
                defaultWarehouse: 'Geelong (W1-A-01)'
              })
            });
            const parseData = await parseRes.json();
            if (parseData.success && parseData.drafts) {
              handleParsedDrafts(parseData.drafts, fileName, currentImportMode);
            }
          }
          setIsUniversalProcessing(false);
        }
      } else if (imageFiles.length > 0) {
        // Handle Images -> Send to AI Identification
        const readImagePromises = imageFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target?.result as string);
            reader.readAsDataURL(file);
          });
        });

        const dataUrls = await Promise.all(readImagePromises);
        const validUrls = dataUrls.filter(Boolean);

        if (validUrls.length > 0) {
          const aiRes = await fetch('/api/import/ai-identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: validUrls,
              costPrice: 20
            })
          });
          const aiData = await aiRes.json();
          if (aiData.success && aiData.draft) {
            handleSingleDraft(aiData.draft);
          } else {
            throw new Error(aiData.message || 'AI Image analysis failed');
          }
        }
        setIsUniversalProcessing(false);
      } else {
        setIsUniversalProcessing(false);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to process dropped file.' });
      setIsUniversalProcessing(false);
    }
  };

  // Fetch initial templates, jobs, metrics
  const fetchImportState = async () => {
    try {
      const [tRes, jRes, mRes] = await Promise.all([
        fetch('/api/import/templates'),
        fetch('/api/import/jobs'),
        fetch('/api/import/metrics')
      ]);

      const tData = await tRes.json();
      const jData = await jRes.json();
      const mData = await mRes.json();

      if (tData.success) setTemplates(tData.templates || []);
      if (jData.success) setJobs(jData.jobs || []);
      if (mData.success) setMetrics(mData.metrics);
    } catch (err) {
      console.error('Failed to load import state', err);
    }
  };

  useEffect(() => {
    fetchImportState();
  }, []);

  // Save new mapping template
  const handleSaveTemplate = async (tmpl: Partial<ImportTemplate>) => {
    try {
      const res = await fetch('/api/import/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tmpl)
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => [data.template, ...prev.filter(t => t.id !== data.template.id)]);
        setNotification({ type: 'success', message: `Template "${data.template.name}" saved successfully.` });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to save template.' });
    }
  };

  // Rollback batch
  const handleRollbackJob = async (batchId: string) => {
    if (!confirm(`Are you sure you want to rollback batch ${batchId}? This will remove created products and revert updated stock.`)) {
      return;
    }

    try {
      const res = await fetch('/api/import/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        fetchImportState();
        // Refresh products list
        const pRes = await fetch('/api/products');
        const pData = await pRes.json();
        if (onProductsUpdated) onProductsUpdated(pData.products || []);
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Rollback failed.' });
    }
  };

  // Receive parsed drafts from wizards
  const handleParsedDrafts = (drafts: ImportDraftProduct[], sourceName: string, mode: ImportMode) => {
    setReviewDrafts(prev => [...drafts, ...prev]);
    setCurrentSourceName(sourceName);
    setCurrentImportMode(mode);
    setActiveTab('review_queue');
    setNotification({
      type: 'success',
      message: `Ingested ${drafts.length} drafts from ${sourceName}. Review and approve below.`
    });
  };

  // Receive single draft from Image/Barcode/QuickList
  const handleSingleDraft = (draft: ImportDraftProduct) => {
    setReviewDrafts(prev => [draft, ...prev]);
    setActiveTab('review_queue');
    setNotification({
      type: 'success',
      message: `Listing drafted: "${draft.title}". Ready in review queue.`
    });
  };

  // Update single draft in review queue
  const handleUpdateDraft = (index: number, updated: ImportDraftProduct) => {
    setReviewDrafts(prev => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  // Remove draft from review queue
  const handleRemoveDraft = (index: number) => {
    setReviewDrafts(prev => prev.filter((_, i) => i !== index));
  };

  // Commit and publish approved drafts to PostgreSQL master store
  const handleCommitBatch = async (approvedDrafts: ImportDraftProduct[]) => {
    if (approvedDrafts.length === 0) return;
    setIsPublishing(true);
    setNotification(null);

    try {
      const res = await fetch('/api/import/commit-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedDrafts,
          importMode: currentImportMode,
          sourceName: currentSourceName,
          sourceType: 'csv'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to commit batch');
      }

      setNotification({
        type: 'success',
        message: `Successfully published batch! Added ${data.createdCount} new products, updated ${data.updatedCount} existing records.`
      });

      // Clear published drafts from review queue
      const approvedIds = new Set(approvedDrafts.map(d => d.id));
      setReviewDrafts(prev => prev.filter(d => !approvedIds.has(d.id)));

      // Refresh master products & metrics
      fetchImportState();
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      if (onProductsUpdated) onProductsUpdated(pData.products || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Commit failed.' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Export full catalog
  const handleExportCatalog = (format: 'csv' | 'json') => {
    window.open(`/api/import/export-catalog?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Navigation Tabs */}
      <div className="bg-[#111111] p-5 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#FFD400] text-black px-2 py-0.5 rounded">
                Production Engine
              </span>
              <h1 className="text-xl font-black uppercase text-white tracking-tight">
                Product Import & AI Listing Centre
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              High-throughput ingestion from CSV/XLSX, photos, barcodes, and eBay with deterministic duplicate protection and human review.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <ExportToSheetButton
              type="inventory"
              data={allProducts}
              label="Sync Google Sheet"
            />
            <button
              onClick={() => handleExportCatalog('csv')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setActiveTab('review_queue')}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <Layers className="w-4 h-4" />
              Review Queue ({reviewDrafts.length})
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-red-950/80 border border-red-800 text-red-300'}`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white text-[11px] font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Intake Overview & Jobs
          </button>

          <button
            onClick={() => setActiveTab('create_single')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'create_single' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-[#FFD400] hover:text-white border border-[#FFD400]/40'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            + Create Single Product
          </button>

          <button
            onClick={() => setActiveTab('csv_xlsx')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'csv_xlsx' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Import CSV / XLSX
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'photos' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <Camera className="w-3.5 h-3.5" />
            Upload Photos (OCR & AI)
          </button>

          <button
            onClick={() => setActiveTab('barcode')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'barcode' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <Scan className="w-3.5 h-3.5" />
            Scan Barcode & Intake
          </button>

          <button
            onClick={() => setActiveTab('quick_list')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'quick_list' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <Zap className="w-3.5 h-3.5" />
            Quick List & Fast Grid
          </button>

          <button
            onClick={() => setActiveTab('ebay')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'ebay' ? 'bg-[#FFD400] text-black font-black' : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Import from eBay
          </button>

          <button
            onClick={() => setActiveTab('review_queue')}
            className={`px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'review_queue' ? 'bg-emerald-500 text-black font-black' : 'bg-neutral-900 text-emerald-400 hover:text-white border border-neutral-800'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review & Publish ({reviewDrafts.length})
          </button>
        </div>
      </div>

      {/* Universal Drag & Drop Dropzone Header Area (Available across overview and wizards) */}
      {activeTab === 'overview' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsUniversalDragOver(true); }}
          onDragLeave={() => setIsUniversalDragOver(false)}
          onDrop={handleUniversalDrop}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center relative overflow-hidden ${
            isUniversalDragOver
              ? 'border-[#FFD400] bg-[#FFD400]/15 scale-[1.005]'
              : 'border-neutral-700 hover:border-neutral-500 bg-[#111111]/80'
          }`}
        >
          {isUniversalProcessing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#FFD400] animate-spin" />
              <div className="font-black text-white text-sm uppercase">Processing Dropped Inventory...</div>
              <p className="text-xs text-gray-400">Parsing columns, validating duplicate SKU/barcodes, and preparing review drafts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#FFD400]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-white text-sm uppercase tracking-tight">
                    Instant Universal Drag & Drop Intake
                  </h3>
                  <p className="text-xs text-gray-400">
                    Drop any <strong className="text-gray-200">CSV, Excel file (.xlsx)</strong> or <strong className="text-gray-200">Product Photos</strong> anywhere here for instant auto-intake.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('create_single')}
                  className="px-4 py-2 bg-[#FFD400] hover:bg-[#FFE033] text-black font-black uppercase text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  + Create Single Product
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('csv_xlsx')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-neutral-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Browse Spreadsheets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-neutral-700"
                >
                  <Camera className="w-4 h-4 text-purple-400" />
                  Upload Photos (AI)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'create_single' && (
        <CreateProductPage
          onBack={() => setActiveTab('overview')}
          onProductCreated={() => {
            fetchImportState();
          }}
        />
      )}

      {activeTab === 'overview' && (
        <ImportMetricsOverview
          metrics={metrics}
          jobs={jobs}
          onRollbackJob={handleRollbackJob}
        />
      )}

      {activeTab === 'csv_xlsx' && (
        <CsvXlsxImportWizard
          templates={templates}
          onParsedDrafts={handleParsedDrafts}
          onSaveTemplate={handleSaveTemplate}
        />
      )}

      {activeTab === 'photos' && (
        <ImageFirstListing
          onDraftGenerated={handleSingleDraft}
        />
      )}

      {activeTab === 'barcode' && (
        <BarcodeIntakeScanner
          onDraftGenerated={handleSingleDraft}
          onStockAdjusted={(product) => {
            setNotification({
              type: 'success',
              message: `Stock updated for ${product.sku} (${product.title}) to ${product.stock} units.`
            });
            fetchImportState();
          }}
        />
      )}

      {activeTab === 'quick_list' && (
        <QuickListIntake
          onDraftGenerated={handleSingleDraft}
        />
      )}

      {activeTab === 'ebay' && (
        <EbayImporter
          onParsedDrafts={handleParsedDrafts}
        />
      )}

      {activeTab === 'review_queue' && (
        <div>
          {reviewDrafts.length === 0 ? (
            <div className="bg-[#111111] p-12 rounded-2xl border border-neutral-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-gray-500">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Review Queue is Empty</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Import a spreadsheet, take product photos, or scan barcodes to begin drafting listings for human review and publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('csv_xlsx')}
                className="px-5 py-2 bg-[#FFD400] text-black font-black text-xs uppercase rounded-lg shadow"
              >
                Start CSV / XLSX Import
              </button>
            </div>
          ) : (
            <BulkReviewGrid
              drafts={reviewDrafts}
              allProducts={allProducts}
              onUpdateDraft={handleUpdateDraft}
              onRemoveDraft={handleRemoveDraft}
              onCommitBatch={handleCommitBatch}
              isPublishing={isPublishing}
            />
          )}
        </div>
      )}
    </div>
  );
};
