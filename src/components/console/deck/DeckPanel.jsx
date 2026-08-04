import React from 'react';

const NOTCH_TL = 'polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px)';
const NOTCH_BR = 'polygon(0 7px, 7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)';
const NOTCH_BOTH = 'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)';

const CLIPS = { tl: NOTCH_TL, br: NOTCH_BR, both: NOTCH_BOTH };

const stripe = (hot) => (hot
  ? 'repeating-linear-gradient(45deg,#5C302A 0 5px,#160B08 5px 10px)'
  : 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)');

/**
 * A console plate: notched corners, lit masthead, hazard caps. Every column on
 * every deck is one of these, so the chrome is learned once and never re-read.
 */
export default function DeckPanel({ glyph, title, meta, notch = 'br', capTop, capBottom, hot, footer, children, bright }) {
  return (
    <div className="relative flex flex-col h-full min-h-0" style={{ clipPath: CLIPS[notch], background: '#090705', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      {capTop && <div className="h-[3px] shrink-0" style={{ background: stripe(hot) }} />}

      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background: bright ? 'linear-gradient(180deg,#1B1309,#0D0A07)' : 'linear-gradient(180deg,#171009,#0D0A07)', boxShadow: `inset 0 -1px 0 ${bright ? '#3A2F20' : '#241C14'}` }}
      >
        {glyph && <span className="text-[11px] leading-none" style={{ color: '#E0A22E', filter: bright ? 'drop-shadow(0 0 8px rgba(224,162,46,.5))' : 'none' }}>{glyph}</span>}
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#F0E7D6', textShadow: bright ? '0 0 12px rgba(224,162,46,.25)' : 'none' }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        {meta && <span className="text-[7px] tracking-[0.2em] tabular-nums shrink-0" style={{ color: '#5F564A' }}>{meta}</span>}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">{children}</div>

      {footer && <div className="shrink-0 px-3 py-1" style={{ boxShadow: 'inset 0 1px 0 #241C14' }}>{footer}</div>}
      {capBottom && <div className="h-[3px] shrink-0" style={{ background: stripe(hot) }} />}
    </div>
  );
}