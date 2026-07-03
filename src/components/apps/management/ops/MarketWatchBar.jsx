import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, Plus, RotateCcw, Trash2 } from 'lucide-react';
import MarketWatchArmForm from '@/components/apps/management/ops/MarketWatchArmForm';

const AMBER = '#E0A22E';
const GREEN = '#7BA05B';
const DIM = '#7A6E60';

export default function MarketWatchBar() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ['price_alerts'],
    queryFn: () => base44.entities.price_alert.list('-created_date', 50),
    refetchInterval: 60000,
  });
  const { data: prices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
    refetchInterval: 60000,
  });
  const bestByCode = {};
  prices.forEach((p) => { if (!bestByCode[p.commodity_code] || (p.price_sell || 0) > bestByCode[p.commodity_code]) bestByCode[p.commodity_code] = p.price_sell || 0; });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['price_alerts'] });
  const rearm = useMutation({ mutationFn: (id) => base44.entities.price_alert.update(id, { status: 'armed' }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id) => base44.entities.price_alert.delete(id), onSuccess: invalidate });

  return (
    <div className="shrink-0 border-b font-mono" style={{ borderColor: '#2A2118', background: '#0C0906' }}>
      <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto">
        <span className="flex items-center gap-1.5 text-[8px] tracking-[0.22em] shrink-0" style={{ color: DIM }}>
          <Bell className="w-3 h-3" style={{ color: AMBER }} /> MARKET WATCH
        </span>
        {alerts.length === 0 && <span className="text-[8px] shrink-0" style={{ color: '#3A3028' }}>NO THRESHOLDS ARMED</span>}
        {alerts.map((a) => {
          const hit = a.status === 'triggered';
          const current = bestByCode[a.commodity_code];
          return (
            <span key={a.id} className={`flex items-center gap-1.5 border px-2 py-1 text-[8px] shrink-0 ${hit ? 'animate-pulse-glow' : ''}`} style={{ borderColor: hit ? GREEN : '#3A2F20', color: hit ? GREEN : DIM, background: hit ? 'rgba(123,160,91,0.08)' : '#0A0806' }}>
              {hit ? <BellRing className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" style={{ color: '#3A3028' }} />}
              <b style={{ color: hit ? GREEN : AMBER }}>{a.commodity_code}</b>
              {a.direction === 'below' ? '▼' : '▲'} {a.target_price_auec.toLocaleString()}
              {hit
                ? <span>HIT @ {(a.triggered_price || 0).toLocaleString()}{a.triggered_terminal ? ` — ${a.triggered_terminal}` : ''}</span>
                : current != null && <span style={{ color: '#5A5044' }}>now {current.toLocaleString()}</span>}
              {hit && (
                <button title="Re-arm" onClick={() => rearm.mutate(a.id)} className="hover:opacity-70" style={{ color: AMBER }}>
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
              <button title="Delete" onClick={() => remove.mutate(a.id)} className="opacity-40 hover:opacity-90" style={{ color: '#C05050' }}>
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 border px-2 py-1 text-[8px] font-bold tracking-[0.14em] shrink-0 ml-auto hover:brightness-125" style={{ borderColor: '#5C4424', color: AMBER, background: '#0A0806' }}>
          <Plus className="w-2.5 h-2.5" /> {showForm ? 'CLOSE' : 'ARM ALERT'}
        </button>
      </div>
      {showForm && <MarketWatchArmForm bestByCode={bestByCode} onArmed={() => { invalidate(); setShowForm(false); }} />}
    </div>
  );
}