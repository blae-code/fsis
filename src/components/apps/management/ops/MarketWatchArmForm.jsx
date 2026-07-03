import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const SALVAGE_CODES = ['RMC', 'CMR', 'CMS'];
const field = { borderColor: '#3A2F20', background: '#0A0806', color: '#D8CFC0' };

export default function MarketWatchArmForm({ bestByCode = {}, onArmed }) {
  const [code, setCode] = useState('RMC');
  const [direction, setDirection] = useState('above');
  const [target, setTarget] = useState('');

  const arm = useMutation({
    mutationFn: () => base44.entities.price_alert.create({
      commodity_code: code,
      direction,
      target_price_auec: parseFloat(target),
      status: 'armed',
      notify_email: true,
    }),
    onSuccess: () => { setTarget(''); onArmed(); },
  });

  const current = bestByCode[code];

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-2 font-mono">
      <select value={code} onChange={(e) => setCode(e.target.value)} className="h-7 px-2 text-[9px] border outline-none" style={field}>
        {SALVAGE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={direction} onChange={(e) => setDirection(e.target.value)} className="h-7 px-2 text-[9px] border outline-none" style={field}>
        <option value="above">RISES ABOVE</option>
        <option value="below">DROPS BELOW</option>
      </select>
      <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target aUEC/SCU" className="h-7 px-2 w-32 text-[9px] border outline-none" style={field} />
      <button
        disabled={!parseFloat(target) || arm.isPending}
        onClick={() => arm.mutate()}
        className="h-7 px-3 border text-[8px] font-bold tracking-[0.14em] disabled:opacity-40 hover:brightness-125 flex items-center gap-1"
        style={{ borderColor: '#8A8F45', color: '#8A8F45', background: '#0A0806' }}
      >
        {arm.isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />} ARM
      </button>
      <span className="text-[8px]" style={{ color: '#5A5044' }}>
        {current != null ? `Current best ${code}: ${current.toLocaleString()} aUEC/SCU` : 'No cached price yet'} · checked every 15 min after UEX sync
      </span>
    </div>
  );
}