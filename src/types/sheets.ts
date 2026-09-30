export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
}

export interface GoogleSheetProperties {
  sheetId: number;
  title: string;
  index: number;
  sheetType?: string;
  gridProperties?: {
    rowCount: number;
    columnCount: number;
    frozenRowCount?: number;
    frozenColumnCount?: number;
  };
}

export interface GoogleSpreadsheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
    autoRecalc?: string;
    timeZone?: string;
  };
  sheets: Array<{
    properties: GoogleSheetProperties;
  }>;
  spreadsheetUrl?: string;
}

export interface GoogleSheetValueRange {
  range: string;
  majorDimension?: string;
  values: any[][];
}

export type SheetExportTemplate = 
  | 'inventory_manifest'
  | 'supplier_lots'
  | 'orders_dispatch'
  | 'ai_ebay_research'
  | 'financial_kpis';

export interface ExportToSheetOptions {
  title: string;
  template: SheetExportTemplate;
  includeTimestamp?: boolean;
}
