import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

/** One suspected pair, its grounds stated in full, with the council's two possible answers. */
export default function IdentityLinkCard({ link, onRule, pending }) {
  const [ruling, setRuling] = useState('');
  const open = link.status === 'suspected';

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: open ? '#5C4424' : '#2E2519', background: '#0A0805' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-[10px] flex items-center gap-1.5" style={{ color: '#EDE5D6' }}>
          <span className="truncate" style={{ color: '#D08A6A' }}>{link.flagged_handle}</span>
          <ArrowLeftRight className="w-2.5 h-2.5 shrink-0" style={{ color: '#7A6E60' }} />
          <span className="truncate">{link.other_handle}</span>
        </div>
        <span className="text-[8px] font-bold shrink-0" style={{ color: '#E0A22E' }}>WEIGHT {link.score}</span>
      </div>

      <ul className="space-y-0.5">
        {(link.signals || []).map((s, i) => (
          <li key={i} className="text-[9px] border-l pl-2 leading-snug" style={{ borderColor: '#3A2F20', color: '#A89C8A' }}>{s}</li>
        ))}
      </ul>

      {!open ? (
        <p className="text-[8px]" style={{ color: link.status === 'linked' ? '#D08A6A' : '#8A8F45' }}>
          {link.status === 'linked' ? 'RULED ONE COMRADE' : 'RULED TWO COMRADES'} by the council — {link.ruling}
        </p>
      ) : (
        <div className="space-y-1.5 border-t pt-1.5" style={{ borderColor: '#2E2519' }}>
          <textarea
            value={ruling}
            onChange={(e) => setRuling(e.target.value)}
            rows={2}
            placeholder="State the council's reasoning — both comrades may read it"
            className="w-full border px-2 py-1.5 text-[9px]"
            style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
          />
          <div className="flex gap-1">
            <button
              disabled={pending || !ruling.trim()}
              onClick={() => onRule({ link_id: link.id, action: 'cleared', ruling: ruling.trim() })}
              className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
              style={{ borderColor: '#8A8F4555', color: '#8A8F45', background: '#0E1009' }}
            >
              TWO COMRADES — CLEAR IT
            </button>
            <button
              disabled={pending || !ruling.trim()}
              onClick={() => onRule({ link_id: link.id, action: 'linked', ruling: ruling.trim() })}
              className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
              style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
            >
              ONE COMRADE — CARRY THE MARK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}