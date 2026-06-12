import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';

/** Out-of-stock email/handle capture — files a restock_request for the operator */
export default function RestockNotify({ product }) {
  const [contact, setContact] = useState('');
  const [state, setState] = useState('idle'); // idle | saving | done

  const submit = async () => {
    if (!contact.trim()) return;
    setState('saving');
    await base44.entities.restock_request.create({
      product_id: product.id,
      product_name: product.product_name,
      code: product.code,
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
      <div className="flex gap-2">
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Email or RSI handle"
          className="h-8 text-xs font-mono flex-1"
          style={{ borderColor: '#3A2F20', background: '#121110', color: '#D8CFC0' }}
        />
        <button
          onClick={submit}
          disabled={state === 'saving' || !contact.trim()}
          className="h-8 px-4 font-mono text-[10px] font-bold disabled:opacity-40 hover:brightness-110 transition-all"
          style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
        >
          {state === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ARM'}
        </button>
      </div>
    </div>
  );
}