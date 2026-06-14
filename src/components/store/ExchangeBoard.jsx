import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DeltaGlyph from '@/components/brand/DeltaGlyph';

const BRONZE = '#B0793A';
const AMBER = '#D4920B';
const BONE = '#D8CFC0';
const DIM = '#8A7E6C';

const CODE_ORDER = ['RMC', 'CMAT', 'SCRA'];

function Sparkline({ points }) {
  if (points.length < 2) return <div className="w-[72px]" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 72, h = 18;
  const d = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * w} ${h - ((v - min) / range) * (h - 3) - 1.5}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="shrink-0 opacity-90">
      <path d={d} fill="none" stroke={AMBER} strokeWidth="1.2" />
      <circle cx={w} cy={h - ((points[points.length - 1] - min) / range) * (h - 3) - 1.5} r="1.8" fill={AMBER} />
    </svg>
  );
}

function timeAgo(iso) {
  if (!iso) return '—';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  return `${Math.floor(mins / 60)}H ${mins % 60}M AGO`;
}

/** Real-time UEX exchange board — live best-sell prices, deltas and trend lines per salvage commodity */
export default function ExchangeBoard() {
  const queryClient = useQueryClient();

  const { data: prices = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['exchange_prices'],
    queryFn: () => base44.entities.commodity_price.list('-price_sell', 200),
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 3,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['exchange_snapshots'],
    queryFn: () => base44.entities.price_snapshot.list('-captured_at', 90),
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  // Real-time push: when the 15-min UEX sync rewrites the cache, refresh the board instantly
  useEffect(() => {
    const unsubscribe = base44.entities.commodity_price.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['exchange_prices'] });
      queryClient.invalidateQueries({ queryKey: ['exchange_snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['ticker_prices'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Best entry + terminal depth per commodity from the live UEX cache
  const board = {};
  prices.forEach((p) => {
    const b = board[p.commodity_code] || (board[p.commodity_code] = { best: null, terminals: 0 });
    b.terminals += 1;
    if (!b.best || (p.price_sell || 0) > (b.best.price_sell || 0)) b.best = p;
  });

  // Historical series per commodity (oldest → newest) for deltas + sparklines
  const history = {};
  [...snapshots].reverse().forEach((s) => {
    (history[s.commodity_code] = history[s.commodity_code] || []).push(s.best_sell || 0);
  });

  const codes = Object.keys(board)
    .filter((c) => board[c]?.best)
    .sort((a, b) => {
      const ia = CODE_ORDER.indexOf(a), ib = CODE_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .slice(0, 3);
  const latest = prices.reduce((m, p) => (p.synced_at > m ? p.synced_at : m), '');
  const patch = prices[0]?.patch_version;

  return (
    <div className="hidden md:flex flex-col relative overflow-hidden" style={{ background: '#080705', borderLeft: '2px solid #5C4424' }}>
      {/* Backdrop: radial glow + blueprint grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(212, 146, 11, 0.10), transparent 70%)' }} />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.13]"
        style={{
          backgroundImage: `linear-gradient(${BRONZE}22 1px, transparent 1px), linear-gradient(90deg, ${BRONZE}22 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />
      {/* Sweeping scan beam */}
      <motion.div
        className="absolute left-0 right-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent, ${AMBER}1E 50%, ${AMBER}40 52%, transparent 54%)` }}
        animate={{ top: ['-12%', '108%'] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Feed header */}
      <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em]" style={{ color: BRONZE }}>
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: '#C24141' }}
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          EXCHANGE BOARD • LIVE
        </div>
        <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: DIM }}>
          UEX FEED{patch ? ` / ${patch}` : ''}
        </span>
      </div>

      {/* Commodity rows */}
      <div className="relative flex-1 flex flex-col justify-center gap-px px-3 min-h-[210px]">
        {isLoading ? (
          <p className="text-center font-mono text-[10px] animate-pulse" style={{ color: DIM }}>LINKING TO UEX RELAY…</p>
        ) : isError ? (
          <div className="text-center font-mono text-[10px] space-y-2">
            <p style={{ color: '#C24141' }}>FEED INTERRUPTED — RELAY UNREACHABLE</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 border hover:brightness-125 transition-all"
              style={{ borderColor: `${BRONZE}66`, color: BRONZE }}
            >
              RETRY LINK
            </button>
          </div>
        ) : codes.length === 0 ? (
          <p className="text-center font-mono text-[10px]" style={{ color: DIM }}>AWAITING UEX TELEMETRY…</p>
        ) : (
          codes.map((code) => {
            const { best, terminals } = board[code];
            const series = (history[code] || []).slice(-24);
            const prev = series.length > 1 ? series[series.length - 2] : null;
            const delta = prev ? (best.price_sell || 0) - prev : 0;
            const deltaPct = prev ? ((delta / prev) * 100).toFixed(1) : null;
            return (
              <div key={code} className="px-3 py-2" style={{ background: '#0D0B09CC', border: `1px solid ${BRONZE}33` }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-[13px] font-bold tracking-[0.12em]" style={{ color: BONE }}>{code}</span>
                      <span className="text-[8px] tracking-[0.18em] truncate" style={{ color: DIM }}>{best.commodity_name?.toUpperCase()}</span>
                    </div>
                    <div className="font-mono text-[8px] mt-0.5 truncate" style={{ color: BRONZE }}>
                      BEST @ {best.terminal_name?.toUpperCase()} • {terminals} TERMINALS
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Sparkline points={series} />
                    <div className="text-right font-mono">
                      <div className="text-[13px] font-bold leading-none" style={{ color: AMBER }}>
                        {(best.price_sell || 0).toLocaleString()}
                      </div>
                      <div className="text-[8px] mt-0.5 tracking-[0.1em] flex items-center justify-end gap-1" style={{ color: delta > 0 ? '#5FA463' : delta < 0 ? '#C24141' : DIM }}>
                        {deltaPct === null ? 'aUEC/SCU' : (
                          <>
                            <DeltaGlyph dir={delta > 0 ? 'up' : delta < 0 ? 'down' : 'par'} className="w-2 h-2 shrink-0" />
                            {delta === 0 ? 'FLAT' : `${Math.abs(deltaPct)}%`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sync footer */}
      <div className="relative px-4 py-2 font-mono text-[9px] flex items-center justify-between" style={{ borderTop: `1px solid ${BRONZE}26` }}>
        <span style={{ color: DIM }}>SYNC: <span style={{ color: BONE }}>{timeAgo(latest)}</span></span>
        <span style={{ color: isError ? '#C24141' : '#5FA463' }}>● UEXCORP RELAY {isError ? 'FAULT' : 'NOMINAL'}</span>
      </div>
    </div>
  );
}