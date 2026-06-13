import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Plus, Loader2, CheckCircle } from 'lucide-react';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

export default function TimeLogForm({ user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ minutes: '', description: '', work_date: new Date().toISOString().slice(0,10) });
  const [done, setDone] = useState(false);

  const handle = user?.handle || user?.full_name || 'unknown';

  const { data: myLogs = [] } = useQuery({
    queryKey: ['my_time_logs', handle],
    queryFn: () => base44.entities.time_log.filter({ handle, status: 'confirmed' }, '-work_date', 20),
    enabled: !!handle,
  });

  const totalShares = myLogs.reduce((s, l) => s + (l.shares || 0), 0);
  const totalMinutes = myLogs.reduce((s, l) => s + (l.minutes || 0), 0);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.time_log.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_time_logs'] });
      setForm({ minutes: '', description: '', work_date: new Date().toISOString().slice(0,10) });
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 1800);
    },
  });

  const submit = () => {
    const mins = parseInt(form.minutes, 10);
    if (!mins || mins < 1) return;
    createMutation.mutate({
      handle,
      minutes: mins,
      shares: Math.floor(mins / 20),
      description: form.description,
      work_date: form.work_date,
      status: 'confirmed',
    });
  };

  return (
    <div className="border font-mono" style={PANEL}>
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" style={{ color: TEAL }} />
          <span className="text-[10px] tracking-[0.18em]" style={{ color: '#D8CFC0' }}>LOG MY TIME</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px]" style={{ color: DIM }}>{totalMinutes}min · {totalShares} shares pending</span>
          <Plus className="w-3 h-3" style={{ color: AMBER, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t overflow-hidden" style={{ borderColor: '#2A2118' }}
        >
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] tracking-[0.14em] mb-1" style={{ color: DIM }}>DATE</label>
                <input
                  type="date" value={form.work_date}
                  onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))}
                  className="w-full h-7 text-[10px] bg-transparent border px-2 font-mono"
                  style={{ borderColor: '#3A2E1E', color: '#EDE5D6' }}
                />
              </div>
              <div>
                <label className="block text-[8px] tracking-[0.14em] mb-1" style={{ color: DIM }}>MINUTES WORKED</label>
                <input
                  type="number" min="1" value={form.minutes}
                  onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}
                  placeholder="60"
                  className="w-full h-7 text-[10px] bg-transparent border px-2 font-mono"
                  style={{ borderColor: '#3A2E1E', color: '#EDE5D6', caretColor: AMBER }}
                />
              </div>
            </div>
            {form.minutes && parseInt(form.minutes) >= 20 && (
              <div className="text-[9px]" style={{ color: TEAL }}>
                = {Math.floor(parseInt(form.minutes) / 20)} share{Math.floor(parseInt(form.minutes) / 20) !== 1 ? 's' : ''} earned
              </div>
            )}
            <div>
              <label className="block text-[8px] tracking-[0.14em] mb-1" style={{ color: DIM }}>WHAT WORK? (OPTIONAL)</label>
              <input
                type="text" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Reclaimer hull scraping, Aaron Halo"
                className="w-full h-7 text-[10px] bg-transparent border px-2 font-mono"
                style={{ borderColor: '#3A2E1E', color: '#EDE5D6', caretColor: AMBER }}
              />
            </div>
            <button
              onClick={submit}
              disabled={!form.minutes || createMutation.isPending || done}
              className="w-full h-8 text-[10px] font-bold tracking-[0.15em] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: done ? '#3A5A4A' : 'linear-gradient(160deg,#8A6430,#4A3722)', color: '#F2EADC', border: 'none' }}
            >
              {done ? <><CheckCircle className="w-3 h-3" /> LOGGED</> : createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'LOG TIME'}
            </button>
          </div>

          {/* Recent logs */}
          {myLogs.length > 0 && (
            <div className="border-t px-3 pb-3" style={{ borderColor: '#1E1A12' }}>
              <div className="text-[8px] tracking-[0.14em] pt-2 pb-1.5" style={{ color: DIM }}>RECENT (UNCONFIRMED)</div>
              {myLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between py-1 border-b text-[9px]" style={{ borderColor: '#1A1510' }}>
                  <span style={{ color: '#A89C8A' }}>{log.work_date} — {log.description || 'no detail'}</span>
                  <span style={{ color: AMBER }}>{log.shares}sh / {log.minutes}min</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}