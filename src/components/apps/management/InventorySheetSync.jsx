import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { syncInventoryToSheets } from '@/functions/syncInventoryToSheets';

const GREEN = '#4EBF7A';
const RED = '#C05050';
const AMBER = '#E0A22E';

/** One-click push of current shop stock levels to the FSIS Inventory Google Sheet. */
export default function InventorySheetSync() {
  const sync = useMutation({
    mutationFn: async () => {
      const res = await syncInventoryToSheets({});
      return res.data;
    },
  });

  return (
    <div className="flex items-center gap-2 shrink-0 font-mono">
      <button
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
        className="shrink-0 px-3 py-1 rounded-sm text-[9px] font-bold tracking-[0.15em] transition-colors flex items-center gap-1.5 disabled:opacity-50"
        style={{ background: '#E0A22E10', color: AMBER, border: '1px solid #5C442460' }}
        title="Push current inventory levels to Google Sheets"
      >
        {sync.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
        SYNC TO SHEETS
      </button>
      {sync.isSuccess && (
        <span className="text-[8px] flex items-center gap-1.5" style={{ color: GREEN }}>
          ✓ {sync.data?.products_synced} items synced
          <a href={sync.data?.spreadsheet_url} target="_blank" rel="noreferrer" className="underline hover:brightness-125" style={{ color: GREEN }}>
            OPEN SHEET ↗
          </a>
        </span>
      )}
      {sync.isError && (
        <span className="text-[8px]" style={{ color: RED }}>
          Sync failed — {sync.error?.response?.data?.error || sync.error?.message || 'try again'}
        </span>
      )}
    </div>
  );
}