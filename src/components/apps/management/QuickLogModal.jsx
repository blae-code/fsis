import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, X } from 'lucide-react';

const AMBER = '#E0A22E';
const DIM = '#7A6E60';
const fieldStyle = { borderColor: '#5C4424', background: '#0C0A07', color: '#EDE5D6' };

/** Mid-job salvage capture — opens on Ctrl+Shift+L, saves a salvage session
 *  with ship + RMC/CMR hauls in a couple of keystrokes. */
export default function QuickLogModal() {
  const [open, setOpen] = useState(false);
  const [ship, setShip] = useState('');
  const [rmc, setRmc] = useState('');
  const [cmr, setCmr] = useState('');
  const [savedName, setSavedName] = useState(null);
  const shipRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setSavedName(null);
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => shipRef.current?.focus());
  }, [open]);

  const save = useMutation({
    mutationFn: () => {
      const stamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      return base44.entities.salvage_session.create({
        session_name: `Quick log — ${ship.trim()} ${stamp}`,
        ship: ship.trim(),
        status: 'in-progress',
        rmc_scu: Number(rmc) || 0,
        cmr_scu: Number(cmr) || 0,
        notes: 'Captured via Quick Log hotkey',
      });
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['notif_salvage'] });
      qc.invalidateQueries({ queryKey: ['salvage_sessions'] });
      setSavedName(created.session_name);
      setShip(''); setRmc(''); setCmr('');
      shipRef.current?.focus();
    },
  });

  const canSave = ship.trim() && (rmc !== '' || cmr !== '') && !save.isPending;
  const submit = (e) => { e.preventDefault(); if (canSave) save.mutate(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-start justify-center pt-[18vh] font-mono"
          style={{ background: 'rgba(5,4,3,0.72)', backdropFilter: 'blur(3px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.form
            onSubmit={submit}
            initial={{ y: -14, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-[420px] max-w-[92vw] border p-4 space-y-3"
            style={{ borderColor: '#5C4424', background: '#0E0C09', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)' }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.22em]" style={{ color: AMBER }}>
                <Zap className="w-3.5 h-3.5" /> QUICK LOG — SALVAGE CAPTURE
              </span>
              <button type="button" onClick={() => setOpen(false)}><X className="w-3.5 h-3.5" style={{ color: DIM }} /></button>
            </div>

            <div>
              <label className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>SHIP</label>
              <input ref={shipRef} value={ship} onChange={(e) => setShip(e.target.value)} placeholder="Vulture, Reclaimer…" className="w-full h-9 px-3 text-xs border outline-none mt-0.5" style={fieldStyle} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>RMC (SCU)</label>
                <input type="number" min="0" step="any" value={rmc} onChange={(e) => setRmc(e.target.value)} placeholder="0" className="w-full h-9 px-3 text-xs border outline-none mt-0.5" style={fieldStyle} />
              </div>
              <div>
                <label className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>CMR (SCU)</label>
                <input type="number" min="0" step="any" value={cmr} onChange={(e) => setCmr(e.target.value)} placeholder="0" className="w-full h-9 px-3 text-xs border outline-none mt-0.5" style={fieldStyle} />
              </div>
            </div>

            {savedName && <p className="text-[9px]" style={{ color: '#8A8F45' }}>✓ Logged: {savedName}</p>}
            {save.isError && <p className="text-[9px]" style={{ color: '#C05050' }}>Save failed — {save.error?.message || 'try again'}.</p>}

            <div className="flex items-center justify-between">
              <span className="text-[8px]" style={{ color: '#3A2E1E' }}>ENTER to log · ESC to close · CTRL+SHIFT+L toggles</span>
              <button type="submit" disabled={!canSave} className="border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30" style={{ borderColor: `${AMBER}60`, color: AMBER, background: `${AMBER}10` }}>
                {save.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} LOG IT
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}