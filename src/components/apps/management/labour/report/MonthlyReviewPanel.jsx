import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FileText, Download, Copy, Check } from 'lucide-react';
import ReportRow from '@/components/apps/management/labour/report/ReportRow';
import {
  availableMonths, buildMonthlyReport, downloadCsv, monthKey, monthLabel, reportCsv,
} from '@/components/apps/management/labour/report/monthlyLabourReport';

const AMBER = '#E0A22E';
const DIM = '#7A6E60';

/** The month's labour laid out for review, and taken away as a file if wanted. */
export default function MonthlyReviewPanel() {
  const [month, setMonth] = useState(monthKey(new Date()));
  const [copied, setCopied] = useState(false);

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['labour_report_tasks'],
    queryFn: () => base44.entities.labour_task.list('-created_date', 500),
  });
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['labour_report_events'],
    queryFn: () => base44.entities.standing_event.list('-created_date', 500),
  });

  const months = useMemo(() => availableMonths(tasks, events), [tasks, events]);
  const report = useMemo(() => buildMonthlyReport({ tasks, events, month }), [tasks, events, month]);

  const copy = () => {
    navigator.clipboard.writeText(reportCsv(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingTasks || loadingEvents) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} /></div>;
  }

  const t = report.totals;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-bold" style={{ color: AMBER }}>
          <FileText className="w-3.5 h-3.5" /> CONTRACTOR REVIEW — {monthLabel(month)}
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-7 px-2 bg-transparent border text-[9px] outline-none ml-auto"
          style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
        >
          {months.map((m) => <option key={m} value={m} style={{ background: '#111009' }}>{monthLabel(m)}</option>)}
        </select>
        <button
          onClick={copy}
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5"
          style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          onClick={() => downloadCsv(report)}
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5"
          style={{ borderColor: AMBER, color: '#0C0A07', background: 'linear-gradient(135deg,#E0A22E,#C8893B)' }}
        >
          <Download className="w-3 h-3" /> EXPORT CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'HANDS ON RECORD', value: report.rows.length },
          { label: 'HOURS FILED', value: t.hours.toFixed(1) },
          { label: 'TASKS CREDITED', value: t.tasks },
          { label: 'SETTLED aUEC', value: Math.round(t.credited).toLocaleString() },
        ].map((k) => (
          <div key={k.label} className="border p-2.5" style={{ borderColor: '#2A2118', background: '#111009' }}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: '#3A3028' }}>{k.label}</div>
            <div className="text-lg font-bold" style={{ color: AMBER }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_70px_70px_100px_80px_50px] gap-2 px-2.5 text-[8px] tracking-[0.18em]" style={{ color: '#3A3028' }}>
        <span>CONTRACTOR</span>
        <span className="text-right">HOURS</span>
        <span className="text-right">TASKS</span>
        <span className="text-right">SETTLED</span>
        <span className="text-right">STANDING</span>
        <span className="text-right">MARKS</span>
      </div>

      {report.rows.length === 0 ? (
        <div className="border p-6 text-center" style={{ borderColor: '#2A2118', background: '#111009' }}>
          <p className="text-[10px]" style={{ color: DIM }}>No labour recorded in {monthLabel(month)}.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {report.rows.map((r) => <ReportRow key={r.handle} r={r} />)}
          <div className="border p-2.5 flex justify-between text-[10px]" style={{ borderColor: '#3A2E1E', background: '#111009' }}>
            <span style={{ color: DIM }}>MONTH TOTAL</span>
            <span className="font-bold" style={{ color: '#6FA08F' }}>
              {t.hours.toFixed(1)} h · {t.tasks} credited · {Math.round(t.credited).toLocaleString()} aUEC · {t.marks} mark{t.marks === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}

      <p className="text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>
        Hours are what each hand filed about their own labour. Settled sums count only what the council actually credited;
        standing shows the month's movement after any appeal ruling.
      </p>
    </div>
  );
}