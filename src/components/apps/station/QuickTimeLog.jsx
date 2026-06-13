import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';
const PANEL = { background: '#0E0B08', borderColor: '#2A2118' };

const OP_PRESETS = ['Reclaimer hull scraping', 'Tractor beam ops', 'Bounty crew', 'Cargo haul', 'Security escort', 'Station guard', 'Other'];

export default function QuickTimeLog({ handle }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(60);
  const [desc, setDesc] = useState('');
  const [preset, setPreset] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['my_time_logs', handle],
    queryFn: () => base44.entities.time_log.filter({ handle }, '-created_date', 5),
    enabled: !!handle,
  });

  const mutation = useMutation({
    mutationFn: () => base44.entities.time_log.create({
      handle,
      work_date: today,
      minutes,
      shares: Math.floor(minutes / 20),
      description: desc || preset,
      status: 'confirmed',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_time_logs'] });
      queryClient.invalidateQueries({ queryKey: ['contractor_payday'] });
      setOpen(false);
      setMinutes(60);
      setDesc('');
      setPreset('');
    },
  });

  const sharesEarned = Math.floor(minutes / 20);

  return (
    <div className="border font-mono" style={{ ...PANEL, borderColor: '#2A2118' }}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: '#2A2118' }}>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" style={{ color: AMBER }} />
          <span className="text-[10px] tracking-[0.18em]" style={{ color: AMBER }}>LOG YOUR TIME</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-2.5 py-1 text-[9px] tracking-[0.12em] transition-all"
          style={{ border: `1px solid ${AMBER}44`, color: AMBER, background: open ? `${AMBER}14` : 'transparent' }}
        >
          <Plus className="w-2.5 h-2.5" /> NEW ENTRY
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 border-b" style={{ borderColor: '#1A1510' }}>
              {/* Minutes stepper */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] tracking-[0.12em]" style={{ color: DIM }}>TIME WORKED</span>
                <div className="flex items-center gap-2">
                  {[30, 60, 90, 120].map(m => (
                    <button key={m} onClick={() => setMinutes(m)}
                      className="px-2 py-0.5 text-[9px] transition-all"
                      style={{ border: `1px solid ${minutes === m ? AMBER : '#2A2118'}`, color: minutes === m ? AMBER : DIM, background: minutes === m ? `${AMBER}10` : 'transparent' }}
                    >{m}m</button>
                  ))}
                  <input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))}
                    className="w-14 h-6 text-center text-[10px] bg-transparent border outline-none font-mono"
                    style={{ borderColor: '#2A2118', color: AMBER }}
                  />
                </div>
              </div>

              {/* Shares preview */}
              <div className="flex items-center justify-between px-2 py-1.5" style={{ background: `${AMBER}0A`, border: `1px solid ${AMBER}22` }}>
                <span className="text-[9px]" style={{ color: DIM }}>SHARES EARNED (1 per 20 min)</span>
                <span className="text-[14px] font-bold" style={{ color: AMBER }}>{sharesEarned}</span>
              </div>

              {/* Preset ops */}
              <div>
                <div className="text-[9px] tracking-[0.12em] mb-1.5" style={{ color: DIM }}>OPERATION</div>
                <div className="flex flex-wrap gap-1.5">
                  {OP_PRESETS.map(p => (
                    <button key={p} onClick={() => { setPreset(p); setDesc(''); }}
                      className="px-2 py-0.5 text-[8px] transition-all"
                      style={{ border: `1px solid ${preset === p ? TEAL : '#2A2118'}`, color: preset === p ? TEAL : DIM, background: preset === p ? `${TEAL}10` : 'transparent' }}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {/* Custom description */}
              <input
                value={desc}
                onChange={e => { setDesc(e.target.value); setPreset(''); }}
                placeholder="Or describe the work…"
                className="w-full h-7 px-2 text-[10px] bg-transparent border outline-none font-mono"
                style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
              />

              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || (!desc && !preset) || sharesEarned === 0}
                className="w-full py-2 text-[10px] tracking-[0.15em] font-bold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(160deg,${AMBER}CC,#4A3722)`, color: '#0A0806', border: 'none' }}
              >
                {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `SUBMIT — +${sharesEarned} SHARE${sharesEarned !== 1 ? 'S' : ''}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="divide-y" style={{ borderColor: '#1A1510' }}>
          {recentLogs.slice(0, 3).map(log => (
            <div key={log.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <div className="text-[10px]" style={{ color: '#C8BFB0' }}>{log.description || 'Work session'}</div>
                <div className="text-[8px]" style={{ color: DIM }}>{log.work_date} · {log.minutes}min</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold" style={{ color: AMBER }}>{log.shares}</span>
                <span className="text-[8px]" style={{ color: DIM }}>shares</span>
                {log.status === 'confirmed' && <Check className="w-2.5 h-2.5" style={{ color: TEAL }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}