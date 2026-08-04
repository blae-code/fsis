import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Loader2 } from 'lucide-react';
import { fmtAuec } from '@/components/hall/hallMeta';

const NOTCH = 'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)';
const HAZARD = 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)';

/**
 * The bid control, mounted as an instrument well to match the console decks.
 *
 * A bid under the reserve is taken rather than refused, and the comrade is told so plainly: a hall
 * that bounces low bids has told you where the reserve sits as surely as printing it would.
 */
export default function HallBidForm({ lot, onBid, pending, result }) {
  const floor = Math.round(Number(lot.next_bid_at_least) || 0);
  const [amount, setAmount] = useState(String(floor));
  const value = Math.round(Number(amount) || 0);
  const short = value < floor;

  const steps = [
    { label: 'MINIMUM', to: floor },
    { label: '+5%', to: Math.round(floor * 1.05) },
    { label: '+10%', to: Math.round(floor * 1.1) },
    { label: '+25%', to: Math.round(floor * 1.25) },
  ];

  return (
    <div className="relative" style={{ clipPath: NOTCH, background: '#090705', boxShadow: 'inset 0 0 0 1px #5C4424' }}>
      <div className="h-[3px]" style={{ background: HAZARD }} />

      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: 'linear-gradient(180deg,#1B1309,#0D0A07)', boxShadow: 'inset 0 -1px 0 #3A2F20' }}
      >
        <Gavel className="w-3 h-3" style={{ color: '#E0A22E', filter: 'drop-shadow(0 0 8px rgba(224,162,46,.5))' }} />
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#F0E7D6' }}>BID ON THIS LOT</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        <span className="text-[7px] tracking-[0.2em] tabular-nums" style={{ color: '#5F564A' }}>FLOOR {fmtAuec(floor)}</span>
      </div>

      <div className="p-3 space-y-2">
        {/* Lit readout: the figure you are about to stand behind, stated large before you commit. */}
        <div
          className="relative px-3 py-2 overflow-hidden"
          style={{ background: 'linear-gradient(180deg,#140E07,#0A0806)', boxShadow: 'inset 0 0 0 1px #2E2519' }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ background: 'repeating-linear-gradient(180deg,rgba(255,220,160,.10) 0 1px,transparent 1px 3px)' }} />
          <div className="relative flex items-end justify-between gap-2">
            <div>
              <div className="text-[7px] tracking-[0.24em]" style={{ color: '#6B6155' }}>YOUR BID</div>
              <div
                className="text-[22px] leading-none tabular-nums"
                style={{ color: short ? '#D08A6A' : '#E0A22E', textShadow: short ? 'none' : '0 0 16px rgba(224,162,46,.35)' }}
              >
                {fmtAuec(value)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[7px] tracking-[0.2em]" style={{ color: '#6B6155' }}>STANDING AT</div>
              <div className="text-[11px] tabular-nums" style={{ color: '#A89C8A' }}>
                {fmtAuec(lot.bid_count > 0 ? lot.current_bid_auec : lot.start_auec)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {steps.map((s) => (
            <motion.button
              key={s.label}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              onClick={() => setAmount(String(s.to))}
              className="h-7 px-2 text-[7px] font-bold tracking-[0.16em] tabular-nums"
              style={{
                background: value === s.to ? 'rgba(224,162,46,.12)' : '#0C0A07',
                color: value === s.to ? '#E0A22E' : '#7A6E60',
                boxShadow: `inset 0 0 0 1px ${value === s.to ? '#5C4424' : '#2E2519'}`,
              }}
            >
              {s.label} · {Math.round(s.to).toLocaleString()}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-1">
          <input
            type="number"
            min={floor}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 flex-1 px-2 text-[11px] tabular-nums"
            style={{ background: '#0C0A07', color: '#EDE5D6', boxShadow: `inset 0 0 0 1px ${short ? '#5C302A' : '#3A2F20'}` }}
          />
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            disabled={pending || short}
            onClick={() => onBid(value)}
            className="h-9 px-4 text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
            style={{ color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)', boxShadow: 'inset 0 0 0 1px #E0A22E' }}
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />} PLACE BID
          </motion.button>
        </div>

        {short && (
          <p className="text-[8px]" style={{ color: '#D08A6A' }}>The next bid must be at least {fmtAuec(floor)}.</p>
        )}
        <p className="text-[8px] leading-relaxed" style={{ color: '#7A6E60' }}>
          The seller may have set a figure they will not go below; you are not told what it is, and a bid
          beneath it is still taken — it simply may not win. A bid in the last minutes pushes the close
          out, so nothing here is won by timing a click.
        </p>
        {result?.note && <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>{result.note}</p>}
      </div>

      <div className="h-[3px]" style={{ background: HAZARD }} />
    </div>
  );
}