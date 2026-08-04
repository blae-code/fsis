import React from 'react';
import { TIERS } from '@/lib/reputation';

/** Where a comrade stands in the collective, and what carries them to the next tier. */
export default function StandingMeter({ m }) {
  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg,#14100B,#0B0906)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>YOUR STANDING</span>
        <span className="text-[9px] tabular-nums" style={{ color: '#8A7E6C' }}>{m.points} PTS</span>
      </div>

      <div className="text-[13px] font-bold tracking-[0.1em]" style={{ color: m.tier.color, textShadow: `0 0 12px ${m.tier.color}55` }}>
        {m.locked ? 'STANDING HELD' : m.tier.label}
      </div>
      <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>{m.tier.blurb}</p>

      <div className="h-[4px]" style={{ background: '#241C14' }}>
        <div className="h-full" style={{ width: `${m.fill}%`, background: m.tier.color, boxShadow: `0 0 6px ${m.tier.color}88` }} />
      </div>
      <p className="text-[8px]" style={{ color: '#6B6155' }}>
        {m.next ? `${m.toNext} more to ${m.next.label} — work credited and musters stood both count.` : 'Top of the ladder. The collective returns what you have built.'}
      </p>

      <ul className="space-y-0.5 pt-1 border-t" style={{ borderColor: '#2A2118' }}>
        {TIERS.map((t) => (
          <li key={t.key} className="flex items-center justify-between text-[7px] tracking-[0.14em]" style={{ color: t.key === m.tier.key ? t.color : '#54493B' }}>
            <span>{t.label}</span>
            <span className="tabular-nums">{Number.isFinite(t.min) ? `${t.min}+` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}