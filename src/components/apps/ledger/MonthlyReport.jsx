import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown } from 'lucide-react';
import { downloadMonthlyReport } from '@/lib/monthlyReportPdf';

/** Month picker + stylized PDF export for ledger financial summaries */
export default function MonthlyReport({ entries }) {
  const months = useMemo(() => {
    const set = new Set(
      entries
        .map((e) => (e.entry_date || e.created_date || '').slice(0, 7))
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
    );
    return [...set].sort().reverse();
  }, [entries]);

  const [month, setMonth] = useState('');
  const selected = month || months[0] || '';

  const monthEntries = entries.filter(
    (e) => (e.entry_date || e.created_date || '').slice(0, 7) === selected
  );

  if (months.length === 0) return null;

  const label = (m) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setMonth}>
        <SelectTrigger className="h-7 w-28 text-[10px] font-mono"><SelectValue /></SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m} className="text-xs font-mono">{label(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={() => downloadMonthlyReport(selected, monthEntries)}
        disabled={monthEntries.length === 0}
        className="h-7 px-3 font-mono text-[9px] font-bold border inline-flex items-center gap-1.5 hover:brightness-125 transition-all disabled:opacity-40"
        style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#161310' }}
        title="Download a stylized PDF financial summary for the selected month"
      >
        <FileDown className="w-3 h-3" /> MONTHLY PDF
      </button>
    </div>
  );
}