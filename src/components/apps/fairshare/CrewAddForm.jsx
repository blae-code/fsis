import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { C, plate, actionBtn, notch } from '@/components/console/theme';

/** Bringing a new hand onto the roster. */
export default function CrewAddForm({ onAdd, pending }) {
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [shares, setShares] = useState('1');

  const submit = () => {
    onAdd({ handle, role, default_shares: parseFloat(shares) || 1, active: true, employment_type: 'contractor' });
    setHandle(''); setRole(''); setShares('1');
  };

  const field = 'h-8 bg-transparent border px-2 text-[11px] font-mono outline-none focus:border-amber-600/60';

  return (
    <div className="border p-3 space-y-2" style={{ ...plate, ...notch(8) }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: C.dim }}>◈ BRING A HAND ONTO THE ROSTER</div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_5rem_auto] gap-2">
        <input className={field} style={{ borderColor: '#3A2F20', color: C.parchment }} placeholder="Callsign" value={handle} onChange={(e) => setHandle(e.target.value)} />
        <input className={field} style={{ borderColor: '#3A2F20', color: C.parchment }} placeholder="Role, e.g. Scraper" value={role} onChange={(e) => setRole(e.target.value)} />
        <input type="number" min="0" step="0.5" title="Default shares" className={`${field} text-center`} style={{ borderColor: '#3A2F20', color: C.parchment }} value={shares} onChange={(e) => setShares(e.target.value)} />
        <button
          disabled={!handle || pending}
          onClick={submit}
          className="flex items-center justify-center gap-1.5 h-8 px-3 text-[9px] border tracking-[0.16em] disabled:opacity-40 transition-colors"
          style={actionBtn}
        >
          <UserPlus className="w-3 h-3" /> ADD
        </button>
      </div>
      <p className="text-[8px]" style={{ color: C.dimmer }}>
        Callsign links automatically to the hand's FSIS operator account for pay day elections — no personal data collected.
      </p>
    </div>
  );
}