import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Square, Plus, Minus } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#5F9A8C';
const DIM    = '#7A6E60';
const RED    = '#C05050';
const GREEN  = '#7BA05B';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function StatusBar({ label, value, max, color, unit = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = pct > 75 ? RED : pct > 40 ? AMBER : color;
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-1">
        <span style={{ color: DIM }}>{label}</span>
        <span style={{ color: barColor }}>{value}{unit} / {max}{unit}</span>
      </div>
      <div className="h-2.5 rounded-sm overflow-hidden relative" style={{ background: '#1A1410' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full"
          style={{ background: barColor }}
        />
        {pct > 80 && (
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 h-full"
            style={{ background: `${RED}40` }}
          />
        )}
      </div>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 9999, label, color = AMBER }) {
  const holdRef = useRef(null);
  const startHold = (dir) => {
    onChange(prev => Math.min(max, Math.max(min, prev + dir)));
    holdRef.current = setTimeout(() => {
      const interval = setInterval(() => onChange(prev => Math.min(max, Math.max(min, prev + dir))), 80);
      holdRef.current = interval;
    }, 500);
  };
  const stopHold = () => { clearTimeout(holdRef.current); clearInterval(holdRef.current); };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[8px] tracking-[0.12em]" style={{ color: DIM }}>{label}</div>
      <div className="flex items-center gap-2">
        <button
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={() => startHold(-1)} onTouchEnd={stopHold}
          className="w-7 h-7 border flex items-center justify-center"
          style={{ borderColor: '#2A2118', color: DIM }}>
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-[16px] font-bold w-12 text-center tabular-nums" style={{ color }}>{value}</span>
        <button
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={() => startHold(1)} onTouchEnd={stopHold}
          className="w-7 h-7 border flex items-center justify-center"
          style={{ borderColor: '#2A2118', color: DIM }}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function SalvageTelemetry() {
  const [running,    setRunning]    = useState(false);
  const [elapsed,   setElapsed]    = useState(0);
  const [hullPct,   setHullPct]    = useState(100);
  const [holdRmc,   setHoldRmc]    = useState(0);
  const [holdCmr,   setHoldCmr]    = useState(0);
  const [holdCms,   setHoldCms]    = useState(0);
  const [holdMax,   setHoldMax]    = useState(64);
  const [phase,     setPhase]      = useState('scrape'); // scrape | haul | transit
  const [log,       setLog]        = useState([]);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const phases = [
    { id: 'scrape',  label: 'SCRAPING',  color: AMBER },
    { id: 'haul',    label: 'HAULING',   color: TEAL },
    { id: 'transit', label: 'TRANSIT',   color: '#6FA0C8' },
    { id: 'sell',    label: 'SELLING',   color: GREEN },
  ];

  const qc = useQueryClient();

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const bestSell = (code) => {
    const ps = prices.filter(p => p.commodity_code === code);
    return ps.reduce((best, p) => p.price_sell > (best?.price_sell || 0) ? p : best, null)?.price_sell || 0;
  };

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
  };

  const holdTotal = holdRmc + holdCmr + holdCms;
  const holdPct   = holdMax > 0 ? Math.round((holdTotal / holdMax) * 100) : 0;
  const estValue  = holdRmc * bestSell('RMC') + holdCmr * bestSell('CMR') + holdCms * bestSell('CMS');

  const logPhase = (p) => {
    setLog(prev => [...prev, { time: elapsed, from: phase, to: p.id }]);
    setPhase(p.id);
  };

  const stopSession = () => {
    setRunning(false);
    setLog(prev => [...prev, { time: elapsed, from: phase, to: 'ENDED' }]);
  };

  const resetSession = () => {
    setRunning(false);
    setElapsed(0);
    setHullPct(100);
    setHoldRmc(0); setHoldCmr(0); setHoldCms(0);
    setPhase('scrape');
    setLog([]);
  };

  const activePhase = phases.find(p => p.id === phase);

  return (
    <div className="space-y-4 font-mono p-4">
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◈ SALVAGE TELEMETRY FEED</div>

      {/* Timer + phase */}
      <div className="border p-3" style={{ ...PANEL, borderColor: running ? `${activePhase?.color}60` : '#2A2118' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[8px] mb-0.5" style={{ color: DIM }}>SESSION TIME</div>
            <div className="text-[26px] font-bold tabular-nums" style={{ color: running ? AMBER : DIM }}>
              {formatTime(elapsed)}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRunning(!running)}
              className="w-9 h-9 border flex items-center justify-center"
              style={{ borderColor: running ? RED : AMBER, color: running ? RED : AMBER }}>
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={stopSession}
              className="w-9 h-9 border flex items-center justify-center"
              style={{ borderColor: '#2A2118', color: DIM }}>
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex gap-2 flex-wrap">
          {phases.map(p => (
            <button key={p.id} onClick={() => logPhase(p)}
              className="px-2.5 py-1 border text-[8px] tracking-[0.1em] transition-all"
              style={{
                borderColor: phase === p.id ? p.color : '#2A2118',
                color: phase === p.id ? p.color : DIM,
                background: phase === p.id ? `${p.color}12` : 'transparent',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status bars */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>OPERATIONAL STATUS</div>

        <div>
          <div className="text-[8px] mb-1 flex justify-between" style={{ color: DIM }}>
            <span>TARGET HULL INTEGRITY</span>
            <span style={{ color: hullPct < 30 ? RED : hullPct < 70 ? AMBER : GREEN }}>{hullPct}%</span>
          </div>
          <input type="range" min="0" max="100" value={hullPct}
            onChange={e => setHullPct(Number(e.target.value))}
            className="w-full h-1.5 mb-1"
          />
          <div className="h-2.5 rounded-sm overflow-hidden" style={{ background: '#1A1410' }}>
            <motion.div
              animate={{ width: `${hullPct}%` }}
              transition={{ duration: 0.3 }}
              className="h-full"
              style={{ background: hullPct < 30 ? RED : hullPct < 70 ? AMBER : GREEN }}
            />
          </div>
        </div>

        <StatusBar label="HOLD FILL" value={holdTotal} max={holdMax} color={TEAL} unit=" SCU" />
      </div>

      {/* Cargo steppers */}
      <div className="border p-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em] mb-3" style={{ color: DIM }}>EXTRACTED CARGO (SCU)</div>
        <div className="grid grid-cols-3 gap-4">
          <Stepper value={holdRmc} onChange={setHoldRmc} label="RMC" color={AMBER} />
          <Stepper value={holdCmr} onChange={setHoldCmr} label="CMR" color={TEAL} />
          <Stepper value={holdCms} onChange={setHoldCms} label="CMS" color="#9B6FC0" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="text-[8px]" style={{ color: DIM }}>HOLD CAPACITY</div>
          <input type="number" min="1" value={holdMax}
            onChange={e => setHoldMax(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 bg-transparent border px-2 py-0.5 text-[10px] text-center outline-none"
            style={{ borderColor: '#2A2118', color: DIM }}
          />
          <div className="text-[8px]" style={{ color: DIM }}>SCU max</div>
          {estValue > 0 && (
            <div className="ml-auto text-[10px] font-bold" style={{ color: TEAL }}>≈ {fmt(estValue)} aUEC</div>
          )}
        </div>
      </div>

      {/* Event log */}
      {log.length > 0 && (
        <div className="border" style={PANEL}>
          <div className="px-3 py-2 border-b text-[8px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
            SESSION EVENT LOG
          </div>
          {[...log].reverse().map((entry, i) => (
            <div key={i} className="flex justify-between px-3 py-1.5 border-b last:border-b-0 text-[9px]"
              style={{ borderColor: '#2A2118' }}>
              <span style={{ color: DIM }}>{formatTime(entry.time)}</span>
              <span style={{ color: '#D8CFC0' }}>{entry.from.toUpperCase()} → {entry.to.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={resetSession}
        className="w-full py-1.5 border text-[9px] tracking-[0.15em] transition-colors"
        style={{ borderColor: '#2A2118', color: DIM }}>
        RESET SESSION
      </button>
    </div>
  );
}