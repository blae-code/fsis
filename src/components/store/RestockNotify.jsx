import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';

/** Out-of-stock handle/contact capture — files canonical restock_notify records for the operator inbox */
export default function RestockNotify({ product }) {
  const [handle, setHandle] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState('idle'); // idle | saving | done

  const submit = async () => {
    if (!handle.trim()) return;
    setState('saving');
    await base44.entities.restock_notify.create({
      product_id: product.id,
      product_name: product.product_name,
      handle: handle.trim(),
      contact: contact.trim(),
    });
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 border p-3 font-mono text-[10px]" style={{ borderColor: '#4A6B3A', color: '#7BA05B' }}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Noted — FSIS will reach out when this ware is restocked.
      </div>
    );
  }

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
      <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <BellRing className="w-3 h-3" /> NOTIFY ME ON RESTOCK
      </div>
      <p className="text-[9px] font-mono leading-relaxed" style={{ color: '#7A6E60' }}>
        Email contacts can receive automated restock mail; Discord/Spectrum/in-game contacts are handled manually.
      </p>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-[9px] font-mono" style={{ color: '#8A7E6C' }}>IN-GAME HANDLE *</Label>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Your RSI handle"
            className="h-8 text-xs font-mono"
            style={{ borderColor: '#3A2F20', background: '#121110', color: '#D8CFC0' }}
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Email, Discord, Spectrum, or in-game comms"
            className="h-8 text-xs font-mono flex-1"
            style={{ borderColor: '#3A2F20', background: '#121110', color: '#D8CFC0' }}
          />
          <button
            onClick={submit}
            disabled={state === 'saving' || !handle.trim()}
            className="h-8 px-4 font-mono text-[10px] font-bold disabled:opacity-40 hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
          >
            {state === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ARM'}
          </button>
        </div>
      </div>
    </div>
  );
}