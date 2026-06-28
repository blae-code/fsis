import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackageCheck, CheckCircle2, Loader2 } from 'lucide-react';

/** Out-of-stock handle/contact capture — files canonical restock_notify records for the operator inbox */
export default function RestockNotify({ product }) {
  const [handle, setHandle] = useState('');
  const [contact, setContact] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState('idle'); // idle | saving | done

  const submit = async () => {
    if (!handle.trim()) return;
    setState('saving');
    await base44.entities.restock_notify.create({
      product_id: product.id,
      product_name: product.product_name,
      handle: handle.trim(),
      contact: contact.trim(),
      request_type: 'reserve',
      desired_quantity: Math.max(1, Number(quantity) || 1),
      reserve_status: 'open',
      reserved_quantity: 0,
    });
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 border p-3 font-mono text-[10px]" style={{ borderColor: '#4A6B3A', color: '#7BA05B' }}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Reserve logged — FSIS will hold the next found stock before public relist.
      </div>
    );
  }

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
      <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <PackageCheck className="w-3 h-3" /> RESERVE NEXT FOUND STOCK
      </div>
      <p className="text-[9px] font-mono leading-relaxed" style={{ color: '#7A6E60' }}>
        Request a reserve and FSIS will hold the next unit found before it returns to public inventory.
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
        <div className="grid grid-cols-[90px_1fr_auto] gap-2">
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="h-8 text-xs font-mono"
            style={{ borderColor: '#3A2F20', background: '#121110', color: '#D8CFC0' }}
          />
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
            {state === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'RESERVE'}
          </button>
        </div>
      </div>
    </div>
  );
}