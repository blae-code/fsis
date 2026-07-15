import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, FileJson, Check, RotateCcw, Ship } from 'lucide-react';
import { importArkanisSalvageLog } from '@/functions/importArkanisSalvageLog';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const RED = '#C05050';
const DIM = '#5A4A34';
const fieldStyle = { borderColor: '#3A2F20', background: 'transparent', color: '#EDE5D6' };

/** Upload an Arkanis overlay log (JSON/CSV); ship + cargo data is grouped
 *  into salvage sessions, reviewed and edited here, then committed. */
export default function ArkanisLogImport() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);

  const preview = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await importArkanisSalvageLog({ mode: 'preview', file_url });
      return res.data;
    },
    onSuccess: (data) => {
      setSummary(null);
      setSessions(data.sessions.map((s) => ({ ...s, include: true })));
    },
  });

  const commit = useMutation({
    mutationFn: async () => {
      const approved = sessions.filter((s) => s.include);
      const res = await importArkanisSalvageLog({ mode: 'commit', sessions: approved });
      return res.data;
    },
    onSuccess: (data) => {
      setSummary(data);
      setSessions([]);
      setFile(null);
      qc.invalidateQueries({ queryKey: ['salvage_sessions'] });
      qc.invalidateQueries({ queryKey: ['notif_salvage'] });
    },
  });

  const edit = (i, patch) => setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const included = sessions.filter((s) => s.include);
  const num = (v) => Math.max(0, Number(v) || 0);

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="border rounded p-3 space-y-3" style={{ borderColor: `${AMBER}40`, background: `${AMBER}08` }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] font-bold" style={{ color: AMBER }}>
          <FileJson className="w-3.5 h-3.5" /> ARKANIS LOG IMPORT — SALVAGE SESSIONS
        </div>
        <p className="text-[9px]" style={{ color: '#8A7E6C' }}>
          Upload the log file the Arkanis overlay produces. Ship and cargo entries are grouped into salvage sessions
          (RMC / CMR / CMS SCU, hulls, location) and valued against cached UEX best-sell prices — review, edit, then commit.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".json,.csv,.txt,.log,application/json,text/csv,text/plain"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setSessions([]); setSummary(null); }}
            className="text-[10px]"
            style={{ color: '#9C9080' }}
          />
          <button
            onClick={() => preview.mutate()}
            disabled={!file || preview.isPending}
            className="border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
            style={{ borderColor: `${AMBER}60`, color: AMBER, background: '#E0A22E10' }}
          >
            {preview.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            PARSE LOG
          </button>
          {sessions.length > 0 && (
            <>
              <button
                onClick={() => { setSessions([]); setSummary(null); }}
                className="border px-2.5 py-1.5 text-[9px] tracking-[0.14em] flex items-center gap-1"
                style={{ borderColor: '#3A2F20', color: DIM }}
              >
                <RotateCcw className="w-3 h-3" /> DISCARD
              </button>
              <button
                onClick={() => commit.mutate()}
                disabled={commit.isPending || included.length === 0}
                className="ml-auto border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
                style={{ borderColor: `${GREEN}60`, color: GREEN, background: `${GREEN}10` }}
              >
                {commit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                CREATE {included.length} SESSION{included.length !== 1 ? 'S' : ''}
              </button>
            </>
          )}
        </div>
        {preview.isError && (
          <p className="text-[9px]" style={{ color: RED }}>
            Parse failed — {preview.error?.response?.data?.error || preview.error?.message || 'check the file and try again'}.
          </p>
        )}
        {commit.isError && (
          <p className="text-[9px]" style={{ color: RED }}>
            Import failed — {commit.error?.response?.data?.error || commit.error?.message || 'try again'}.
          </p>
        )}
      </div>

      {summary && (
        <div className="border rounded p-2.5 text-[9px]" style={{ borderColor: `${GREEN}40`, background: `${GREEN}0A`, color: GREEN }}>
          ✓ Imported {summary.created} salvage session{summary.created !== 1 ? 's' : ''} from the Arkanis log — they're now in-progress sessions with cargo and estimated value pre-filled.
        </div>
      )}

      {sessions.map((s, i) => (
        <div key={i} className="border rounded p-3 space-y-2" style={{ borderColor: s.include ? `${AMBER}35` : 'hsl(33,18%,14%)', background: 'hsl(30,10%,7%)', opacity: s.include ? 1 : 0.45 }}>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={s.include} onChange={(e) => edit(i, { include: e.target.checked })} className="accent-[#E0A22E]" />
            <Ship className="w-3.5 h-3.5 shrink-0" style={{ color: AMBER }} />
            <input
              value={s.session_name}
              onChange={(e) => edit(i, { session_name: e.target.value })}
              className="flex-1 min-w-0 h-7 px-2 text-[10px] font-bold border rounded outline-none"
              style={fieldStyle}
            />
            <span className="text-[9px] font-bold shrink-0" style={{ color: GREEN }}>
              ≈ {(s.estimated_value || 0).toLocaleString()} aUEC
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              ['SHIP', 'ship', 'text'],
              ['LOCATION', 'location', 'text'],
              ['RMC SCU', 'rmc_scu', 'number'],
              ['CMR SCU', 'cmr_scu', 'number'],
              ['CMS SCU', 'cms_scu', 'number'],
              ['HULLS', 'hulls_scraped', 'number'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>{label}</div>
                <input
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  step={type === 'number' ? 'any' : undefined}
                  value={s[key]}
                  onChange={(e) => edit(i, { [key]: type === 'number' ? num(e.target.value) : e.target.value })}
                  className="w-full h-7 px-2 text-[10px] border rounded outline-none"
                  style={fieldStyle}
                />
              </div>
            ))}
          </div>
          {s.other_cargo?.length > 0 && (
            <p className="text-[8px]" style={{ color: DIM }}>
              NON-SALVAGE CARGO (saved to notes): {s.other_cargo.join(' · ')}
            </p>
          )}
        </div>
      ))}

      {sessions.length > 0 && (
        <p className="text-[8px] text-center pb-2" style={{ color: '#3A2A14' }}>
          Sessions are created as IN-PROGRESS · estimated value uses cached UEX best-sell prices · every import is written to the ops log
        </p>
      )}
    </div>
  );
}