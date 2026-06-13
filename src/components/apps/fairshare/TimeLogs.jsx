import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const sharesFor = (mins) => Math.round((mins / 20) * 100) / 100;

export default function TimeLogs() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['time_logs'],
    queryFn: () => base44.entities.time_log.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (l) => base44.entities.time_log.create(l),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      setMinutes(''); setDescription('');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.time_log.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_logs'] }),
  });

  // Outstanding share balances
  const balances = {};
  logs.filter((l) => l.status !== 'cashed').forEach((l) => {
    balances[l.handle] = (balances[l.handle] || 0) + (l.shares || 0);
  });

  const mins      = parseFloat(minutes) || 0;
  const previewSh = mins > 0 ? sharesFor(mins) : null;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Log form */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em]" style={{ color: DIM }}>
          <span style={{ color: AMBER }}>⏱</span> LOG CONFIRMED PARTICIPATION — 1 SHARE / 20 MIN
        </div>

        <div className="grid grid-cols-[10rem_6rem_1fr_auto] gap-2">
          <Select value={handle} onValueChange={setHandle}>
            <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118', background: 'transparent', color: '#D8CFC0' }}>
              <SelectValue placeholder="Crew member" />
            </SelectTrigger>
            <SelectContent>
              {crew.map((m) => (
                <SelectItem key={m.id} value={m.handle} className="text-xs font-mono">{m.handle}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <input
              type="number" min="0"
              className="w-full h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
              style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
              placeholder="Minutes"
              value={minutes} onChange={(e) => setMinutes(e.target.value)}
            />
            {previewSh && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none"
                style={{ color: AMBER }}>+{previewSh}sh</span>
            )}
          </div>

          <input
            className="h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
            style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            placeholder="Work performed, e.g. Hull scraping — Aaron Halo"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />

          <button
            disabled={!handle || mins <= 0 || createMutation.isPending}
            onClick={() => createMutation.mutate({
              handle, minutes: mins,
              shares: sharesFor(mins),
              description,
              work_date: new Date().toISOString().slice(0, 10),
              status: 'confirmed',
            })}
            className="h-8 px-3 text-[9px] border font-mono tracking-[0.1em] disabled:opacity-40 transition-all whitespace-nowrap"
            style={{ borderColor: AMBER, color: AMBER, background: `${AMBER}0E` }}
          >
            LOG {previewSh ? `(+${previewSh} SH)` : ''}
          </button>
        </div>

        <p className="text-[8px]" style={{ color: DIMMER }}>
          Same rate for everyone — the Proprietor earns shares like any contractor. Shares cash on pay day (Fridays).
        </p>
      </div>

      {/* Outstanding balances */}
      {Object.keys(balances).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(balances).map(([h, sh]) => (
            <span key={h} className="text-[9px] px-2 py-1 border font-mono"
              style={{ color: AMBER, borderColor: `${AMBER}44`, background: `${AMBER}0E` }}>
              {h}: {Math.round(sh * 100) / 100} SH OUTSTANDING
            </span>
          ))}
        </div>
      )}

      {/* Log list */}
      <div>
        <div className="text-[9px] tracking-[0.18em] mb-2" style={{ color: DIM }}>
          TIME LOG ({logs.length})
        </div>
        {logs.length === 0 ? (
          <div className="border py-8 text-center" style={PANEL}>
            <div className="text-[10px]" style={{ color: DIMMER }}>No confirmed time logged yet.</div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border flex items-center gap-3 px-3 py-2"
                style={{ ...PANEL, borderColor: l.status === 'cashed' ? DIMMER : '#2A2118' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px]" style={{ color: l.status === 'cashed' ? DIM : '#D8CFC0' }}>
                    {l.handle}
                    <span style={{ color: DIM }}> — {l.minutes} min → </span>
                    <span style={{ color: l.status === 'cashed' ? DIM : AMBER }}>{l.shares} sh</span>
                  </div>
                  <div className="text-[8px] truncate mt-0.5" style={{ color: DIMMER }}>
                    {l.work_date}{l.description && ` · ${l.description}`}
                  </div>
                </div>

                <span className="text-[8px] px-1.5 py-0.5 font-mono shrink-0"
                  style={l.status === 'cashed'
                    ? { color: DIMMER, border: `1px solid ${DIMMER}44` }
                    : { color: TEAL, border: `1px solid ${TEAL}44`, background: `${TEAL}0E` }}>
                  {l.status === 'cashed' ? `CASHED ${l.payday_date || ''}` : 'CONFIRMED'}
                </span>

                {l.status !== 'cashed' && (
                  <button onClick={() => deleteMutation.mutate(l.id)}
                    style={{ color: DIMMER }} className="hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}