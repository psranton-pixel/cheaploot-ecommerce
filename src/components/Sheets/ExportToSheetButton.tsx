import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Check, ExternalLink } from 'lucide-react';
import { getAccessToken, googleSignIn } from '../../lib/googleAuth';
import { 
  exportInventoryToGoogleSheet, 
  exportSupplierLotsToGoogleSheet, 
  exportOrdersToGoogleSheet 
} from '../../lib/googleSheets';
import { Product, Order } from '../../types';

interface Props {
  type: 'inventory' | 'lots' | 'orders';
  data: any[];
  label?: string;
  className?: string;
  onSuccess?: (sheetUrl: string) => void;
}

export const ExportToSheetButton: React.FC<Props> = ({
  type,
  data,
  label = 'Export to Google Sheets',
  className = 'px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-900/60 flex items-center gap-1.5 transition-colors',
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        token = result.accessToken;
      }

      let res: { spreadsheetId: string; url: string; rowCount: number };
      if (type === 'inventory') {
        res = await exportInventoryToGoogleSheet(data as Product[]);
      } else if (type === 'lots') {
        res = await exportSupplierLotsToGoogleSheet(data);
      } else {
        res = await exportOrdersToGoogleSheet(data as Order[]);
      }

      setCreatedUrl(res.url);
      if (onSuccess) onSuccess(res.url);
    } catch (err: any) {
      console.error('Google Sheets Export error:', err);
      setError(err.message || 'Failed to export to Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : createdUrl ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>{loading ? 'Exporting...' : createdUrl ? 'Exported!' : label}</span>
      </button>

      {createdUrl && (
        <a
          href={createdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-800 rounded-lg text-xs flex items-center gap-1 transition-colors"
          title="Open in Google Sheets"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Sheet</span>
        </a>
      )}

      {error && (
        <span className="text-[10px] text-red-400 font-mono">
          {error}
        </span>
      )}
    </div>
  );
};
