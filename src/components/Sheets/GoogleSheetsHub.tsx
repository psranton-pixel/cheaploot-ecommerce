import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, RefreshCw, Plus, Download, Upload, ExternalLink, 
  Search, ShieldAlert, CheckCircle2, AlertTriangle, Table, ArrowRight,
  Database, User as UserIcon, LogOut, Check, Sparkles, Filter, ChevronRight,
  Layers, Package, DollarSign, Tag, ArrowUpRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleDriveFile, GoogleSpreadsheetMetadata, GoogleSheetValueRange } from '../../types/sheets';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../../lib/googleAuth';
import { 
  listUserSpreadsheets, 
  getSpreadsheetMetadata, 
  getSpreadsheetValues, 
  createSpreadsheet, 
  appendSheetValues, 
  updateSheetValues, 
  clearSheetValues,
  exportInventoryToGoogleSheet,
  exportSupplierLotsToGoogleSheet,
  exportOrdersToGoogleSheet
} from '../../lib/googleSheets';
import { GoogleSignInButton } from '../Calendar/GoogleSignInButton';

export const GoogleSheetsHub: React.FC = () => {
  const { products, orders, addNewProduct } = useStore();
  const supplierLots: any[] = [];

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Spreadsheets from Google Drive
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');

  // Selected Spreadsheet & Live Data Viewer
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [selectedTabName, setSelectedTabName] = useState<string>('');
  const [sheetValues, setSheetValues] = useState<GoogleSheetValueRange | null>(null);
  const [isLoadingSheetValues, setIsLoadingSheetValues] = useState(false);

  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);

  // New Sheet Modal
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);

  // Quick Append Row Form
  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);
  const [appendRowData, setAppendRowData] = useState({
    sku: `CL-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '',
    category: 'Hardware & Tools',
    condition: 'Brand New',
    cost: '25.00',
    rrp: '89.00',
    price: '49.00',
    qty: '5',
    location: 'Geelong Bay A1'
  });
  const [isAppending, setIsAppending] = useState(false);

  // Import from Sheet to CheapLoot State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRowsCount, setImportedRowsCount] = useState<number | null>(null);

  // Destructive Confirmation Dialog State (MANDATORY per Workspace Skill)
  const [clearConfirmationTarget, setClearConfirmationTarget] = useState<{ sheetId: string; range: string; title: string } | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch User's Spreadsheets from Google Drive
  const loadDriveFiles = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingDriveFiles(true);
    setErrorMessage(null);

    try {
      const files = await listUserSpreadsheets(driveSearchQuery);
      setDriveFiles(files);
      if (files.length > 0 && !selectedFile) {
        handleSelectFile(files[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Google Drive spreadsheets:', err);
      setErrorMessage(err.message || 'Failed to list spreadsheets from Google Drive');
    } finally {
      setIsLoadingDriveFiles(false);
    }
  }, [isAuthenticated, driveSearchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDriveFiles();
    }
  }, [isAuthenticated, loadDriveFiles]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setSuccessMessage('Successfully connected to Google Sheets & Drive!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Google Sign In failure:', err);
      setErrorMessage(err.message || 'Google Sign In failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDriveFiles([]);
    setSelectedFile(null);
    setSelectedMeta(null);
    setSheetValues(null);
  };

  // Select a Spreadsheet File and Load its metadata + first tab values
  const handleSelectFile = async (file: GoogleDriveFile) => {
    setSelectedFile(file);
    setIsLoadingSheetValues(true);
    setErrorMessage(null);

    try {
      const meta = await getSpreadsheetMetadata(file.id);
      setSelectedMeta(meta);

      const firstTab = meta.sheets?.[0]?.properties?.title || 'Sheet1';
      setSelectedTabName(firstTab);

      // Load first 100 rows
      const values = await getSpreadsheetValues(file.id, `${firstTab}!A1:Z100`);
      setSheetValues(values);
    } catch (err: any) {
      console.error('Failed to load spreadsheet details:', err);
      setErrorMessage(err.message || 'Failed to fetch spreadsheet contents from Google Sheets API');
    } finally {
      setIsLoadingSheetValues(false);
    }
  };

  // Switch Active Tab within Selected Spreadsheet
  const handleTabChange = async (tabTitle: string) => {
    if (!selectedFile) return;
    setSelectedTabName(tabTitle);
    setIsLoadingSheetValues(true);
    try {
      const values = await getSpreadsheetValues(selectedFile.id, `${tabTitle}!A1:Z100`);
      setSheetValues(values);
    } catch (err: any) {
      console.error('Failed to load sheet tab values:', err);
      setErrorMessage(err.message || 'Failed to switch sheet tab');
    } finally {
      setIsLoadingSheetValues(false);
    }
  };

  // Handle 1-Click Export Actions
  const handleExportInventory = async () => {
    setIsExporting('inventory');
    setErrorMessage(null);
    try {
      const res = await exportInventoryToGoogleSheet(products);
      setLastCreatedUrl(res.url);
      setSuccessMessage(`Exported ${res.rowCount} inventory products to new Google Sheet!`);
      await loadDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export inventory to Google Sheets');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportLots = async () => {
    setIsExporting('lots');
    setErrorMessage(null);
    try {
      const lotsData = supplierLots.length > 0 ? supplierLots : [
        { id: 'LOT-2026-08', supplier: 'Bunnings Liquidation Hub', category: 'Power Tools & Hardware', cost: 4200, estValue: 12800, pallets: 4, units: 140, condition: 'New & Box Damaged', bay: 'Bay B' },
        { id: 'LOT-2026-09', supplier: 'Repco Automotive Overstock', category: 'Auto Parts & Diagnostics', cost: 2800, estValue: 8400, pallets: 2, units: 85, condition: 'Brand New In Box', bay: 'Bay C' },
        { id: 'LOT-2026-10', supplier: 'JB Hi-Fi Audio Returns', category: 'Electronics & Gadgets', cost: 3500, estValue: 9900, pallets: 3, units: 110, condition: 'Customer Return / Tested', bay: 'Bay A' }
      ];
      const res = await exportSupplierLotsToGoogleSheet(lotsData);
      setLastCreatedUrl(res.url);
      setSuccessMessage(`Exported ${res.rowCount} supplier lots to new Google Sheet!`);
      await loadDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export lots to Google Sheets');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportOrders = async () => {
    setIsExporting('orders');
    setErrorMessage(null);
    try {
      const res = await exportOrdersToGoogleSheet(orders);
      setLastCreatedUrl(res.url);
      setSuccessMessage(`Exported ${res.rowCount} orders to new Google Sheet!`);
      await loadDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export orders to Google Sheets');
    } finally {
      setIsExporting(null);
    }
  };

  // Create Blank Spreadsheet
  const handleCreateBlankSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    setIsCreatingNewSheet(true);
    setErrorMessage(null);
    try {
      const newSheet = await createSpreadsheet(newSheetTitle, 'Master Sheet');
      setSuccessMessage(`Created Google Spreadsheet "${newSheetTitle}"!`);
      setIsNewSheetModalOpen(false);
      setNewSheetTitle('');
      await loadDriveFiles();
      if (newSheet.spreadsheetUrl) {
        setLastCreatedUrl(newSheet.spreadsheetUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create Google Spreadsheet');
    } finally {
      setIsCreatingNewSheet(false);
    }
  };

  // Append Single Row to Active Sheet
  const handleAppendRowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedTabName) return;

    setIsAppending(true);
    setErrorMessage(null);

    try {
      const rowValues = [
        appendRowData.sku,
        appendRowData.title,
        appendRowData.category,
        appendRowData.condition,
        parseFloat(appendRowData.cost) || 0,
        parseFloat(appendRowData.rrp) || 0,
        parseFloat(appendRowData.price) || 0,
        parseInt(appendRowData.qty) || 1,
        appendRowData.location,
        new Date().toISOString().split('T')[0]
      ];

      await appendSheetValues(selectedFile.id, `${selectedTabName}!A1`, [rowValues]);
      setSuccessMessage(`Added "${appendRowData.title}" to Google Sheet!`);
      setIsAppendModalOpen(false);

      // Refresh sheet values
      const updated = await getSpreadsheetValues(selectedFile.id, `${selectedTabName}!A1:Z100`);
      setSheetValues(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to append row to Google Sheet');
    } finally {
      setIsAppending(false);
    }
  };

  // Import Rows from Active Google Sheet into CheapLoot Inventory
  const handleImportSheetIntoInventory = async () => {
    if (!sheetValues || !sheetValues.values || sheetValues.values.length < 2) {
      setErrorMessage('No data rows found in this sheet tab to import.');
      return;
    }

    try {
      const rows = sheetValues.values;
      const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());

      // Identify column indexes
      const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('product') || h.includes('name') || h.includes('item'));
      const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('code') || h.includes('part'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('selling') || h.includes('cheaploot') || h.includes('aud'));
      const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('buy'));
      const rrpIdx = headers.findIndex(h => h.includes('rrp') || h.includes('retail') || h.includes('market'));
      const catIdx = headers.findIndex(h => h.includes('category') || h.includes('type'));
      const condIdx = headers.findIndex(h => h.includes('condition') || h.includes('grade'));
      const qtyIdx = headers.findIndex(h => h.includes('qty') || h.includes('stock') || h.includes('quantity') || h.includes('count'));
      const locIdx = headers.findIndex(h => h.includes('location') || h.includes('bin') || h.includes('bay') || h.includes('shelf'));

      let importedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const title = titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]) : `Imported Item #${i}`;
        if (!title.trim()) continue;

        const sku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]) : `GS-${Math.floor(1000 + Math.random() * 9000)}`;
        const price = priceIdx !== -1 ? (parseFloat(String(row[priceIdx]).replace(/[^0-9.]/g, '')) || 49.00) : 49.00;
        const costPrice = costIdx !== -1 ? (parseFloat(String(row[costIdx]).replace(/[^0-9.]/g, '')) || price * 0.4) : price * 0.4;
        const retailPrice = rrpIdx !== -1 ? (parseFloat(String(row[rrpIdx]).replace(/[^0-9.]/g, '')) || price * 1.6) : price * 1.6;
        const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]) : 'Hardware & Tools';
        const condition = condIdx !== -1 && row[condIdx] ? (String(row[condIdx]) as any) : 'Brand New';
        const stockQty = qtyIdx !== -1 ? (parseInt(String(row[qtyIdx])) || 1) : 1;
        const location = locIdx !== -1 && row[locIdx] ? String(row[locIdx]) : 'Geelong Warehouse Hub';

        const newProd: Product = {
          id: `prod-gs-${Date.now()}-${i}`,
          sku,
          barcode: `93${Math.floor(10000000000 + Math.random() * 90000000000)}`,
          mpn: sku,
          title,
          brand: 'CheapLoot Verified',
          description: `Imported directly from Google Sheet: "${selectedMeta?.properties?.title || 'Spreadsheet'}" (${selectedTabName})`,
          price,
          wasPrice: retailPrice,
          costPrice,
          department: 'Tools & Hardware',
          category,
          condition,
          stock: stockQty,
          warehouseLocation: location,
          weightKg: 1.2,
          dimensionsCm: { length: 20, width: 15, height: 10 },
          shippingClass: 'standard',
          rating: 4.8,
          reviewCount: 3,
          dateListed: new Date().toISOString(),
          viewsCount: 0,
          salesCount: 0,
          allowPickup: true,
          pickupLocations: ['Geelong Main Dock 3', 'Werribee Depot Hub'],
          specs: {
            'Source': 'Google Sheets Direct Sync',
            'Spreadsheet': selectedMeta?.properties?.title || 'Google Sheet',
            'Sheet Tab': selectedTabName
          },
          features: ['Google Sheets Verified', 'Warehouse Inspected', 'Australian Stock'],
          whatsIncluded: [title, 'Standard Packaging'],
          warranty: '90-Day CheapLoot Return Guarantee',
          returnsPolicy: '30-Day Money Back Returns',
          tags: ['google-sheets', 'imported', category.toLowerCase()],
          images: [
            'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800'
          ]
        };

        addNewProduct(newProd);
        importedCount++;
      }

      setImportedRowsCount(importedCount);
      setSuccessMessage(`Successfully imported ${importedCount} products from Google Sheet into CheapLoot inventory!`);
      setIsImportModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Import from Google Sheet failed:', err);
      setErrorMessage(err.message || 'Failed to import spreadsheet rows');
    }
  };

  // Handle Clear Sheet Values (Workspace Skill Compliant Destructive Dialog)
  const handleConfirmClear = async () => {
    if (!clearConfirmationTarget) return;

    setIsClearing(true);
    setErrorMessage(null);
    try {
      await clearSheetValues(clearConfirmationTarget.sheetId, clearConfirmationTarget.range);
      setSuccessMessage(`Cleared data in ${clearConfirmationTarget.range}`);
      setClearConfirmationTarget(null);

      if (selectedFile) {
        const updated = await getSpreadsheetValues(selectedFile.id, `${selectedTabName}!A1:Z100`);
        setSheetValues(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear sheet values');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#181a20] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#0F9D58] text-white px-2 py-0.5 rounded flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                Google Workspace Integration
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Google Sheets & Drive Synchronization Hub
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Export live inventory manifests, supplier lot shipments, and sales dispatch logs directly to Google Spreadsheets, or import product catalogs from Google Drive with two-way spreadsheet synchronization.
            </p>
          </div>

          {/* Auth Controls */}
          <div>
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Checking Google connection...
              </div>
            ) : isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-8 h-8 rounded-full border border-neutral-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white text-xs font-bold">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white truncate max-w-[140px]">
                      {currentUser.displayName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Google Sheets Connected
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <GoogleSignInButton
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  text={isSigningIn ? 'Connecting to Google...' : 'Connect Google Sheets'}
                />
                <span className="text-[10px] text-gray-400">
                  Authorizes Drive and Spreadsheets with user permission
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
            {lastCreatedUrl && (
              <a
                href={lastCreatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 px-2 py-0.5 bg-emerald-500 text-black font-black uppercase text-[10px] rounded flex items-center gap-1 hover:bg-emerald-400"
              >
                Open in Google Sheets <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* When Not Authenticated State */}
      {!isAuthenticated && !isAuthLoading && (
        <div className="bg-[#16181D] border border-neutral-800 rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#0F9D58] flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-black uppercase text-white">Connect Google Drive & Sheets</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sign in with your Google account to automatically export CheapLoot warehouse manifests, sync supplier auction lots, generate formatted financial spreadsheets, and import wholesale product sheets directly into your catalog.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              disabled={isSigningIn}
              text="Sign in with Google to Access Sheets"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 text-left border-t border-neutral-800/80">
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#B8E62E]" />
                1-Click Inventory Export
              </div>
              <p className="text-[11px] text-gray-400">
                Instantly export all active store items with SKUs, costs, RRPs, margins, and warehouse bin locations to Google Sheets.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Two-Way Catalog Sync
              </div>
              <p className="text-[11px] text-gray-400">
                Browse any spreadsheet from Google Drive, preview columns, and import bulk stock lines straight into CheapLoot.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-sky-400" />
                Financial & Lot Manifests
              </div>
              <p className="text-[11px] text-gray-400">
                Auto-generate supplier pallet manifests, projected profits, and dispatch logs formatted for Australian tax reporting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Authenticated Sheets Interface */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Quick 1-Click Export Cards Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Export Live Inventory */}
            <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#B8E62E] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Live Stock
                  </span>
                  <Package className="w-4 h-4 text-[#B8E62E]" />
                </div>
                <h3 className="text-xs font-black uppercase text-white">Inventory Manifest</h3>
                <p className="text-[11px] text-gray-400">
                  Export {products.length} products with SKUs, costs, RRPs, margins & bin locations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportInventory}
                disabled={isExporting !== null}
                className="w-full py-2 bg-[#B8E62E] hover:bg-[#a5d126] text-[#14161A] text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isExporting === 'inventory' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting === 'inventory' ? 'Exporting...' : 'Export to Sheets'}</span>
              </button>
            </div>

            {/* 2. Export Supplier Lots */}
            <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                    Inbound Lots
                  </span>
                  <Layers className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-xs font-black uppercase text-white">Supplier Lot Manifest</h3>
                <p className="text-[11px] text-gray-400">
                  Export pallet lots, buy costs, manifest estimates, and receiving bay allocations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportLots}
                disabled={isExporting !== null}
                className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isExporting === 'lots' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting === 'lots' ? 'Exporting...' : 'Export Lots Sheet'}</span>
              </button>
            </div>

            {/* 3. Export Orders & Dispatch */}
            <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    Sales & Dispatch
                  </span>
                  <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-xs font-black uppercase text-white">Orders & Pickups Log</h3>
                <p className="text-[11px] text-gray-400">
                  Export {orders.length} customer orders, Click & Collect pickups & tracking numbers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportOrders}
                disabled={isExporting !== null}
                className="w-full py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isExporting === 'orders' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting === 'orders' ? 'Exporting...' : 'Export Orders Sheet'}</span>
              </button>
            </div>

            {/* 4. Create Blank Spreadsheet */}
            <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    New Sheet
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-[#0F9D58]" />
                </div>
                <h3 className="text-xs font-black uppercase text-white">Create Blank Sheet</h3>
                <p className="text-[11px] text-gray-400">
                  Create an empty spreadsheet in your Google Drive linked to CheapLoot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewSheetTitle(`CheapLoot Custom Sheet (${new Date().toISOString().split('T')[0]})`);
                  setIsNewSheetModalOpen(true);
                }}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Sheet</span>
              </button>
            </div>
          </div>

          {/* Drive Spreadsheet Explorer & Viewer Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Google Drive Spreadsheets List (4 cols) */}
            <div className="lg:col-span-4 bg-[#181a20] border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#0F9D58]" />
                  <h2 className="text-xs font-black uppercase text-white">Your Google Spreadsheets</h2>
                </div>
                <button
                  type="button"
                  onClick={loadDriveFiles}
                  disabled={isLoadingDriveFiles}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Refresh Spreadsheets List"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDriveFiles ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Search drive input */}
              <div className="relative">
                <input
                  type="text"
                  value={driveSearchQuery}
                  onChange={e => setDriveSearchQuery(e.target.value)}
                  placeholder="Search files in Google Drive..."
                  className="w-full bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-2 pl-8 focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>

              {/* Files List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {isLoadingDriveFiles ? (
                  <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
                    <span>Loading files from Google Drive...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-neutral-800 rounded-lg space-y-2">
                    <FileSpreadsheet className="w-6 h-6 text-gray-600 mx-auto" />
                    <p>No spreadsheets found matching your query.</p>
                    <button
                      onClick={handleExportInventory}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      Export current inventory to create one!
                    </button>
                  </div>
                ) : (
                  driveFiles.map(file => {
                    const isSelected = selectedFile?.id === file.id;
                    const date = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectFile(file)}
                        className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 block ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-600/80 text-white'
                            : 'bg-neutral-900 hover:bg-neutral-800/80 border-neutral-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs line-clamp-1 flex items-center gap-1.5">
                            <FileSpreadsheet className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-[#0F9D58]'}`} />
                            <span className="truncate">{file.name}</span>
                          </div>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-gray-400 hover:text-white p-0.5 rounded"
                              title="Open in Google Sheets (New Tab)"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                          <span>Modified: {date}</span>
                          {isSelected && <span className="text-emerald-400 font-bold">Active</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Sheet Data Grid & Actions (8 cols) */}
            <div className="lg:col-span-8 bg-[#181a20] border border-neutral-800 rounded-xl p-5 space-y-4">
              {selectedFile ? (
                <div className="space-y-4">
                  {/* Selected Sheet Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-[#0F9D58]" />
                        <h2 className="text-sm font-black uppercase text-white truncate max-w-md">
                          {selectedMeta?.properties?.title || selectedFile.name}
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        ID: {selectedFile.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedFile.webViewLink && (
                        <a
                          href={selectedFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#0F9D58]" />
                          Open in Google Sheets
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAppendModalOpen(true)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        Add Row
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-1.5 bg-[#B8E62E] hover:bg-[#a5d126] text-[#14161A] text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-colors shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Import to CheapLoot
                      </button>
                    </div>
                  </div>

                  {/* Sheet Tab Switcher */}
                  {selectedMeta?.sheets && selectedMeta.sheets.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-neutral-800/80 pb-2">
                      <span className="text-[10px] font-bold uppercase text-gray-500 mr-2 flex-shrink-0">
                        Sheet Tabs:
                      </span>
                      {selectedMeta.sheets.map(sheet => {
                        const tabTitle = sheet.properties.title;
                        const isTabActive = selectedTabName === tabTitle;

                        return (
                          <button
                            key={sheet.properties.sheetId}
                            type="button"
                            onClick={() => handleTabChange(tabTitle)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex-shrink-0 ${
                              isTabActive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'
                            }`}
                          >
                            {tabTitle}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Live Spreadsheet Data Table Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-mono text-[11px]">
                        Range: {selectedTabName}!A1:Z100 ({sheetValues?.values?.length || 0} rows loaded)
                      </span>

                      {sheetValues?.values && sheetValues.values.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setClearConfirmationTarget({
                            sheetId: selectedFile.id,
                            range: `${selectedTabName}!A2:Z500`,
                            title: selectedFile.name
                          })}
                          className="text-[11px] text-red-400 hover:text-red-300 font-bold hover:underline"
                        >
                          Clear Sheet Data
                        </button>
                      )}
                    </div>

                    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60 max-h-[460px] overflow-auto">
                      {isLoadingSheetValues ? (
                        <div className="p-16 text-center space-y-3">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                          <div className="text-xs text-gray-400 font-mono">
                            Fetching cell matrix from Google Sheets API v4...
                          </div>
                        </div>
                      ) : !sheetValues || !sheetValues.values || sheetValues.values.length === 0 ? (
                        <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                          <Table className="w-8 h-8 text-gray-600 mx-auto" />
                          <p>This sheet tab is currently empty.</p>
                          <button
                            onClick={() => setIsAppendModalOpen(true)}
                            className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold"
                          >
                            Add First Row
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          {/* Header Row */}
                          <thead className="bg-[#14161A] text-gray-300 font-black uppercase text-[10px] tracking-wider sticky top-0 border-b border-neutral-700 z-10">
                            <tr>
                              <th className="p-2.5 border-r border-neutral-800 text-gray-500 text-center w-10">#</th>
                              {sheetValues.values[0].map((header: any, colIdx: number) => (
                                <th key={colIdx} className="p-2.5 border-r border-neutral-800 whitespace-nowrap">
                                  {header || `Col ${String.fromCharCode(65 + colIdx)}`}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          {/* Data Rows */}
                          <tbody className="divide-y divide-neutral-800/60 text-gray-300 font-mono text-[11px]">
                            {sheetValues.values.slice(1).map((row: any[], rowIdx: number) => (
                              <tr key={rowIdx} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="p-2 border-r border-neutral-800 text-gray-500 text-center text-[10px]">
                                  {rowIdx + 2}
                                </td>
                                {sheetValues.values[0].map((_: any, colIdx: number) => (
                                  <td key={colIdx} className="p-2 border-r border-neutral-800/60 whitespace-nowrap max-w-[220px] truncate">
                                    {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center space-y-4">
                  <FileSpreadsheet className="w-12 h-12 text-gray-600 mx-auto" />
                  <div className="text-sm font-bold text-white uppercase">No Spreadsheet Selected</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Select a spreadsheet from your Google Drive on the left or export your current inventory to begin live synchronization.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE BLANK SPREADSHEET MODAL */}
      {isNewSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14161A] border border-neutral-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0F9D58]" />
                <h3 className="text-sm font-black uppercase text-white">Create Google Spreadsheet</h3>
              </div>
              <button onClick={() => setIsNewSheetModalOpen(false)} className="text-gray-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBlankSheet} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Spreadsheet Title *</label>
                <input
                  type="text"
                  required
                  value={newSheetTitle}
                  onChange={e => setNewSheetTitle(e.target.value)}
                  placeholder="e.g. CheapLoot Weekly Pallet Log"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewSheetModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingNewSheet}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg disabled:opacity-50"
                >
                  {isCreatingNewSheet ? 'Creating in Drive...' : 'Create Spreadsheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK APPEND ROW MODAL */}
      {isAppendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14161A] border border-neutral-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-[#0F9D58] text-white px-2 py-0.5 rounded">
                  Append Operation
                </span>
                <h3 className="text-sm font-black uppercase text-white mt-1">
                  Add Row to &quot;{selectedTabName}&quot;
                </h3>
              </div>
              <button onClick={() => setIsAppendModalOpen(false)} className="text-gray-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAppendRowSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={appendRowData.sku}
                    onChange={e => setAppendRowData({ ...appendRowData, sku: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={appendRowData.category}
                    onChange={e => setAppendRowData({ ...appendRowData, category: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={appendRowData.title}
                  onChange={e => setAppendRowData({ ...appendRowData, title: e.target.value })}
                  placeholder="e.g. Milwaukee M18 FUEL 1/2in Impact Wrench Skin"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Cost (AUD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={appendRowData.cost}
                    onChange={e => setAppendRowData({ ...appendRowData, cost: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">RRP (AUD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={appendRowData.rrp}
                    onChange={e => setAppendRowData({ ...appendRowData, rrp: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Price (AUD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={appendRowData.price}
                    onChange={e => setAppendRowData({ ...appendRowData, price: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={appendRowData.qty}
                    onChange={e => setAppendRowData({ ...appendRowData, qty: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    value={appendRowData.location}
                    onChange={e => setAppendRowData({ ...appendRowData, location: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAppendModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAppending}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-lg disabled:opacity-50"
                >
                  {isAppending ? 'Appending Row...' : 'Append to Google Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT SHEET INTO INVENTORY PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#14161A] border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#B8E62E]" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Import from Google Sheet into CheapLoot</h3>
                  <p className="text-[11px] text-gray-400">
                    Source: {selectedMeta?.properties?.title} ({selectedTabName})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                <div className="font-bold text-white">Automated Column Detection</div>
                <p className="text-gray-400 text-[11px]">
                  CheapLoot automatically detects headers like <strong>Title, SKU, Price, Cost, RRP, Category, Condition, Qty, Location</strong> and parses currency signs ($) and Australian tax formatting.
                </p>
              </div>

              {sheetValues?.values && sheetValues.values.length > 1 ? (
                <div className="space-y-2">
                  <div className="text-gray-300 font-bold">
                    Found {sheetValues.values.length - 1} data rows ready to import:
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-neutral-800 rounded-lg divide-y divide-neutral-800 bg-neutral-900/60 p-2 font-mono text-[11px]">
                    {sheetValues.values.slice(1, 6).map((r: any[], i: number) => (
                      <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-gray-300">
                        <span className="truncate max-w-[320px] font-sans font-medium text-white">
                          {r[0] || r[1] || r[2] || 'Item'}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          ${r.find((c: any) => typeof c === 'number' || (typeof c === 'string' && /^\$?[0-9.]+$/.test(c.trim()))) || '49.00'}
                        </span>
                      </div>
                    ))}
                    {sheetValues.values.length > 6 && (
                      <div className="text-center text-gray-500 py-1 text-[10px]">
                        + {sheetValues.values.length - 6} more rows...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-amber-400 bg-amber-950/40 border border-amber-800 rounded-lg">
                  No data rows found in this sheet. Make sure your sheet has a header row and product data.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSheetIntoInventory}
                  className="px-5 py-2 bg-[#B8E62E] hover:bg-[#a5d126] text-[#14161A] font-black uppercase rounded-lg shadow"
                >
                  Confirm & Import into Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR SHEET DATA CONFIRMATION DIALOG (MANDATORY per Workspace Skill) */}
      {clearConfirmationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#16181D] border border-red-900/80 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-white">Clear Google Sheet Range?</h3>
                <p className="text-[11px] text-gray-400">This will erase values in the specified sheet range.</p>
              </div>
            </div>

            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1 text-xs font-mono">
              <div className="text-white font-bold">{clearConfirmationTarget.title}</div>
              <div className="text-amber-400">Target Range: {clearConfirmationTarget.range}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearConfirmationTarget(null)}
                disabled={isClearing}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Yes, Clear Cell Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
