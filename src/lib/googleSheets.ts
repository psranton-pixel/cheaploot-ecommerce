import { GoogleDriveFile, GoogleSpreadsheetMetadata, GoogleSheetValueRange } from '../types/sheets';
import { Product, Order } from '../types';
import { getAccessToken } from './googleAuth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No active Google authentication token. Please connect with Google first.');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `Google API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Lists Google Spreadsheets accessible to the user from Google Drive
 */
export async function listUserSpreadsheets(searchQuery = '', pageSize = 30): Promise<GoogleDriveFile[]> {
  const queryParts = ["mimeType='application/vnd.google-apps.spreadsheet'", "trashed=false"];
  if (searchQuery.trim()) {
    // Escape single quotes for drive query
    const escaped = searchQuery.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const params = new URLSearchParams({
    q: queryParts.join(' and '),
    pageSize: pageSize.toString(),
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, iconLink, size)',
    orderBy: 'modifiedTime desc'
  });

  const response = await authenticatedFetch(`${DRIVE_API_BASE}/files?${params.toString()}`);
  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches Google Spreadsheet metadata (sheet tabs, titles, dimensions)
 */
export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<GoogleSpreadsheetMetadata> {
  const response = await authenticatedFetch(`${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties,sheets.properties,spreadsheetUrl`);
  return await response.json();
}

/**
 * Fetches 2D matrix values from a specified sheet and range
 */
export async function getSpreadsheetValues(spreadsheetId: string, range: string): Promise<GoogleSheetValueRange> {
  const response = await authenticatedFetch(`${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`);
  const data = await response.json();
  return {
    range: data.range || range,
    majorDimension: data.majorDimension || 'ROWS',
    values: data.values || []
  };
}

/**
 * Creates a new blank Google Spreadsheet
 */
export async function createSpreadsheet(title: string, initialSheetTitle = 'CheapLoot Data'): Promise<GoogleSpreadsheetMetadata> {
  const payload = {
    properties: {
      title,
      locale: 'en_AU',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney'
    },
    sheets: [
      {
        properties: {
          title: initialSheetTitle,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const response = await authenticatedFetch(SHEETS_API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Appends rows to a spreadsheet range
 */
export async function appendSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<{ updates: { updatedRange: string; updatedRows: number; updatedColumns: number; updatedCells: number } }> {
  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({
        values
      })
    }
  );

  return await response.json();
}

/**
 * Updates / overwrites values in a specified range
 */
export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<{ updatedRange: string; updatedRows: number; updatedColumns: number; updatedCells: number }> {
  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        values
      })
    }
  );

  return await response.json();
}

/**
 * Clears cell values in a range (Requires explicit confirmation before calling)
 */
export async function clearSheetValues(spreadsheetId: string, range: string): Promise<void> {
  await authenticatedFetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      body: JSON.stringify({})
    }
  );
}

/**
 * 1-Click Export: Exports current active Inventory to a newly created Google Spreadsheet
 */
export async function exportInventoryToGoogleSheet(products: Product[], customTitle?: string): Promise<{ spreadsheetId: string; url: string; rowCount: number }> {
  const dateStr = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const title = customTitle || `CheapLoot Live Inventory Manifest (${dateStr})`;

  // 1. Create Spreadsheet
  const newSheet = await createSpreadsheet(title, 'Inventory Master');
  const spreadsheetId = newSheet.spreadsheetId;

  // 2. Prepare Headers and Data
  const headers = [
    'SKU',
    'Barcode / EAN',
    'Title',
    'Category',
    'Subcategory',
    'Condition',
    'Cost Price (AUD)',
    'RRP (AUD)',
    'CheapLoot Price (AUD)',
    'Discount (%)',
    'Est. Margin (%)',
    'Stock Qty',
    'Aisle / Bin Location',
    'Source Lot Ref',
    'eBay Sync Status',
    'Last Updated'
  ];

  const rows = products.map(p => {
    const cost = p.costPrice || 0;
    const price = p.price || 0;
    const rrp = p.wasPrice || (price * 1.5);
    const discount = rrp > 0 ? Math.round(((rrp - price) / rrp) * 100) : 0;
    const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

    return [
      p.sku || '',
      p.barcode || '',
      p.title || '',
      p.department || '',
      p.category || '',
      p.condition || 'Brand New',
      cost,
      rrp,
      price,
      `${discount}%`,
      `${margin}%`,
      p.stock ?? 1,
      p.warehouseLocation || 'Geelong Warehouse A-1',
      p.mpn || '',
      p.ebayItemId ? `Listed (${p.ebayItemId})` : (p.marketplaceSynced ? 'Synced' : 'Ready / Draft'),
      new Date().toISOString().split('T')[0]
    ];
  });

  const allValues = [headers, ...rows];

  // 3. Write data
  await updateSheetValues(spreadsheetId, 'Inventory Master!A1', allValues);

  return {
    spreadsheetId,
    url: newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    rowCount: products.length
  };
}

/**
 * 1-Click Export: Exports Supplier Liquidation Lots to a new Google Spreadsheet
 */
export async function exportSupplierLotsToGoogleSheet(lots: any[], customTitle?: string): Promise<{ spreadsheetId: string; url: string; rowCount: number }> {
  const dateStr = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const title = customTitle || `CheapLoot Supplier Lots & Inbound Manifest (${dateStr})`;

  const newSheet = await createSpreadsheet(title, 'Liquidation Lots');
  const spreadsheetId = newSheet.spreadsheetId;

  const headers = [
    'Lot Reference',
    'Supplier / Origin',
    'Source Category',
    'Purchase Cost (AUD)',
    'Est. Manifest Value (AUD)',
    'Projected Profit (AUD)',
    'Pallet Count',
    'Total Units',
    'General Condition',
    'Assigned Bay',
    'Status',
    'Intake Date'
  ];

  const rows = lots.map(l => {
    const cost = l.cost || 0;
    const estVal = l.estValue || (cost * 2.8);
    const profit = estVal - cost;

    return [
      l.id || l.lotReference || '',
      l.supplier || 'Tier-1 Retail Overstock',
      l.category || 'Mixed Hardware & Tech',
      cost,
      estVal,
      profit,
      l.pallets || 1,
      l.units || l.itemCount || 50,
      l.condition || 'Overstock / Returns',
      l.bay || 'Receiving Bay B',
      l.status || 'Received / Auditing',
      l.intakeDate || new Date().toISOString().split('T')[0]
    ];
  });

  await updateSheetValues(spreadsheetId, 'Liquidation Lots!A1', [headers, ...rows]);

  return {
    spreadsheetId,
    url: newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    rowCount: lots.length
  };
}

/**
 * 1-Click Export: Exports Customer Orders & Click & Collect Pickups to a new Google Spreadsheet
 */
export async function exportOrdersToGoogleSheet(orders: Order[], customTitle?: string): Promise<{ spreadsheetId: string; url: string; rowCount: number }> {
  const dateStr = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const title = customTitle || `CheapLoot Orders & Dispatch Log (${dateStr})`;

  const newSheet = await createSpreadsheet(title, 'Orders & Dispatch');
  const spreadsheetId = newSheet.spreadsheetId;

  const headers = [
    'Order #',
    'Date Placed',
    'Customer Name',
    'Customer Email',
    'Item Count',
    'Order Total (AUD)',
    'Fulfillment Method',
    'Order Status',
    'Payment Method',
    'AusPost Tracking',
    'Items Summary'
  ];

  const rows = orders.map(o => {
    const itemsSummary = (o.items || [])
      .map((i: any) => `${i.title || 'Item'} x${i.quantity || 1}`)
      .join('; ');

    return [
      o.orderNumber || o.id,
      new Date(o.createdAt).toLocaleDateString('en-AU'),
      o.customer?.name || 'Customer',
      o.customer?.email || '',
      (o.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0),
      o.total || 0,
      o.shippingMethod === 'pickup' ? `Click & Collect (${o.pickupLocation || 'Warehouse Hub'})` : `${o.courier || 'Australia Post'} (${o.shippingMethod})`,
      o.status?.toUpperCase() || 'PAID',
      o.paymentMethod || 'Credit Card / Stripe',
      o.trackingNumber || 'Pending Dispatch',
      itemsSummary
    ];
  });

  await updateSheetValues(spreadsheetId, 'Orders & Dispatch!A1', [headers, ...rows]);

  return {
    spreadsheetId,
    url: newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    rowCount: orders.length
  };
}
