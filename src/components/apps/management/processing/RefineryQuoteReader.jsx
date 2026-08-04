import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';

/**
 * Photograph the refinery terminal quote and let it fill the hopper form. The game already
 * states the material, the volume, the yield, the fee and the wait — retyping all five is
 * how a wait gets entered as a guess and a batch sits out all night uncollected.
 */
export default function RefineryQuoteReader({ onRead }) {
  const [file, setFile] = useState(null);

  const read = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: 'This is a screenshot of a Star Citizen refinery terminal quote screen. Read the ore or material being refined, the input volume in SCU, the refining method if named, the total refining time (convert to decimal hours — 2h 15m is 2.25), the refinery fee in aUEC, the expected yield value in aUEC, and the station or refinery name. Omit any value you cannot actually read rather than guessing.',
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            material: { type: 'string' },
            quantity_scu: { type: 'number' },
            method: { type: 'string' },
            hours: { type: 'number' },
            fee_auec: { type: 'number' },
            est_value_auec: { type: 'number' },
            location: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
        },
      });
      return r;
    },
    onSuccess: (r) => {
      const notes = [r.method && `Method: ${r.method}`, r.fee_auec && `Refinery fee ${Math.round(r.fee_auec).toLocaleString()} aUEC`, 'Read from a terminal photograph.']
        .filter(Boolean).join(' · ');
      onRead({
        material: r.material || '',
        quantity_scu: r.quantity_scu ? String(Math.round(r.quantity_scu)) : '',
        hours: r.hours ? String(Math.round(r.hours * 100) / 100) : '',
        est_value_auec: r.est_value_auec ? String(Math.round(r.est_value_auec)) : '',
        location: r.location || '',
        label: r.material ? `Refine ${r.quantity_scu ? `${Math.round(r.quantity_scu)} SCU ` : ''}${r.material}` : '',
        notes,
      });
      setFile(null);
    },
  });

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: '#3A2F20', background: '#0B0906' }}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] tracking-[0.18em] flex items-center gap-1" style={{ color: '#8A8F45' }}>
          <Camera className="w-3 h-3" /> READ A TERMINAL QUOTE
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-[8px] flex-1 min-w-0"
          style={{ color: '#8A7E6C' }}
        />
        <button
          disabled={!file || read.isPending}
          onClick={() => read.mutate()}
          className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
          style={{ borderColor: '#8A6430', color: '#E0A22E' }}
        >
          {read.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} FILL THE FORM
        </button>
      </div>
      <p className="text-[7px] leading-relaxed" style={{ color: '#5F564A' }}>
        Whatever it reads is only a proposal — every field below stays yours to correct before the clock starts.
      </p>
      {read.isSuccess && (
        <p className="text-[8px]" style={{ color: read.data?.confidence === 'low' ? '#E0A22E' : '#8A8F45' }}>
          {read.data?.confidence === 'low'
            ? 'Read, but poorly — check every figure against the screen before starting.'
            : 'Quote read. Check the wait and the yield, then start the clock.'}
        </p>
      )}
      {read.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>That quote could not be read. Try a clearer shot of the terminal.</p>}
    </div>
  );
}