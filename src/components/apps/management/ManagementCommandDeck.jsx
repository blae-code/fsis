import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ShoppingBag, Boxes, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { differenceInDays, subDays, format } from 'date-fns';
import CommodityTrendChart from '@/components/apps/station/CommodityTrendChart';

// ─── Theme ────────────────────────────────────────────────────────────────────
const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const OP_COLOR = { salvage: '#6FA08F', bounty: '#C8893B', cargo: '#5B8EC0', piracy: '#C05050', escort: '#B0793A', other: DIM };

function fmt(n) {
  if (!n) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function DeckTile({ label, value, sub, color, icon: Icon, delta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="border p-3 relative overflow-hidden"
      style={PANEL}
    >
      <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: color || AMBER }} />
      <div className="pl-2">
        {Icon && <Icon className="w-3 h-3 mb-1.5" style={{ color: color || AMBER }} />}
        <div className="text-xl font-bold font-mono" style={{ color: color || AMBER }}>{value}</div>
        {sub && <div className="text-[9px] font-mono mt-0.5" style={{ color: TEAL }}>{sub}</div>}
        <div className="text-[8px] tracking-[0.18em] font-mono mt-1" style={{ color: DIMMER }}>{label}</div>
        {delta !== undefined && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-mono"
            style={{ color: delta > 0 ? '#7BA05B' : delta < 0 ? '#C05050' : DIM }}>
            {delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : delta < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
            {delta !== 0 && `${delta > 0 ? '+' : ''}${fmt(delta)}`}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SectionHead({ children, accent }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.28em]" style={{ color: accent || '#B0793A' }}>
      <span className="w-3 h-px shrink-0" style={{ background: accent || '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.2)' }} />
    </div>
  );
}

export default function ManagementCommandDeck() {
  const { data: sessions = [] } = useQuery({ queryKey: ['mgmt_sessions'], queryFn: () => base44.entities.salvage_session.list('-created_date', 200) });
  const { data: orders = [] }   = useQuery({ queryKey: ['mgmt_orders'],   queryFn: () => base44.entities.order.list('-created_date', 200) });
  const { data: lots = [] }     = useQuery({ queryKey: ['mgmt_lots'],     queryFn: () => base44.entities.cargo_lot.list('-created_date', 200) });
  const { data: workOrders = []} = useQuery({ queryKey: ['mgmt_work_orders'], queryFn: () => base44.entities.work_order.list('-created_date', 100) });
  const { data: ledger = [] }   = useQuery({ queryKey: ['mgmt_ledger'],   queryFn: () => base44.entities.ledger_entry.list('-entry_date', 500) });
  const { data: crew = [] }     = useQuery({ queryKey: ['crew_members'],  queryFn: () => base44.entities.crew_member.list('-created_date') });
  const { data: lootItems = []} = useQuery({ queryKey: ['mgmt_loot'],     queryFn: () => base44.entities.loot_item.list('-created_date', 200) });

  const stats = useMemo(() => {
    const now = new Date();
    const cutoff7 = subDays(now, 7);
    const cutoff30 = subDays(now, 30);

    // Ledger 7-day
    const recent = ledger.filter(e => new Date(e.entry_date || e.created_date) >= cutoff7);
    const income7 = recent.filter(e => e.entry_type === 'income').reduce((s,e) => s + (e.amount_auec||0), 0);
    const expense7 = recent.filter(e => e.entry_type === 'expense').reduce((s,e) => s + (e.amount_auec||0), 0);
    const net7 = income7 - expense7;

    // Ledger 30-day for comparison
    const month = ledger.filter(e => new Date(e.entry_date || e.created_date) >= cutoff30);
    const income30 = month.filter(e => e.entry_type === 'income').reduce((s,e) => s + (e.amount_auec||0), 0);

    // Work orders
    const openWO = workOrders.filter(o => o.status === 'open');
    const grossOwed = openWO.reduce((s,o) => {
      const gross = o.gross_auec || 0;
      const exp = (o.expenses||[]).reduce((x,e) => x+(e.amount_auec||0), 0);
      return s + (gross - exp);
    }, 0);

    // Op type breakdown
    const opTypes = {};
    workOrders.forEach(o => { const t = o.op_type||'other'; opTypes[t] = (opTypes[t]||0)+1; });

    // Orders
    const activeOrders = orders.filter(o => ['new','confirmed','in_fulfillment'].includes(o.status));
    const orderValue = activeOrders.reduce((s,o) => s+(o.total_auec||0), 0);

    // Loot pipeline value
    const activeLoot = lootItems.filter(i => !['sold','scrapped'].includes(i.status||'raw'));
    const lootValue = activeLoot.reduce((s,i) => s+(i.est_sell_auec||0), 0);
    const lootNeedingRepair = activeLoot.filter(i => ['raw','repairing'].includes(i.status||'raw')).length;

    // Stale work orders
    const staleWO = openWO.filter(o => differenceInDays(now, new Date(o.created_date)) >= 3).length;

    return { net7, income7, expense7, income30, grossOwed, opTypes, activeOrders: activeOrders.length, orderValue, activeSessions: sessions.filter(s=>['planning','in-progress','hauling'].includes(s.status)).length, lotsMoving: lots.filter(l=>l.status!=='sold').length, openWO: openWO.length, staleWO, crew: crew.filter(m=>m.active!==false).length, lootValue, lootNeedingRepair };
  }, [sessions, orders, lots, workOrders, ledger, crew, lootItems]);

  // Recent work orders for the live feed
  const recentWO = workOrders.slice(0, 6);

  return (
    <div className="space-y-5 font-mono">

      {/* ── 7-day P&L banner ─────────────────────────────────────────────── */}
      <div className="border p-3 relative overflow-hidden" style={{ ...PANEL, borderColor: stats.net7 >= 0 ? '#3A5A3A' : '#5A2A2A' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${stats.net7 >= 0 ? 'rgba(95,154,140,0.04)' : 'rgba(192,80,80,0.04)'} 0%, transparent 60%)` }} />
        <div className="text-[8px] tracking-[0.28em] mb-2" style={{ color: '#B0793A' }}>7-DAY FINANCIAL PULSE</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[8px]" style={{ color: DIMMER }}>INCOME</div>
            <div className="text-lg font-bold" style={{ color: '#7BA05B' }}>{fmt(stats.income7)} ¤</div>
          </div>
          <div>
            <div className="text-[8px]" style={{ color: DIMMER }}>EXPENSES</div>
            <div className="text-lg font-bold" style={{ color: '#C05050' }}>−{fmt(stats.expense7)} ¤</div>
          </div>
          <div>
            <div className="text-[8px]" style={{ color: DIMMER }}>NET</div>
            <div className="text-lg font-bold" style={{ color: stats.net7 >= 0 ? TEAL : '#C05050' }}>
              {stats.net7 >= 0 ? '+' : ''}{fmt(stats.net7)} ¤
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <DeckTile label="ACTIVE SALVAGE RUNS"    value={stats.activeSessions}             color={TEAL}       icon={null} />
        <DeckTile label="OPEN CUSTOMER ORDERS"   value={stats.activeOrders}   sub={`${fmt(stats.orderValue)} ¤ value`} color="#5B8EC0" icon={ShoppingBag} />
        <DeckTile label="CARGO LOTS IN MOTION"   value={stats.lotsMoving}                 color="#C8893B"    icon={Boxes} />
        <DeckTile label="ACTIVE CREW"            value={stats.crew}                        color={AMBER}      icon={Users} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <DeckTile label="OPEN WORK ORDERS"  value={stats.openWO}  sub={stats.staleWO > 0 ? `${stats.staleWO} stale 3d+` : 'all fresh'}  color={stats.staleWO > 0 ? '#C8893B' : TEAL} />
        <DeckTile label="CREW OWED (ACTIVE)" value={`${fmt(stats.grossOwed)} ¤`} color="#C8893B" />
        <DeckTile label="LOOT PIPELINE VALUE" value={`${fmt(stats.lootValue)} ¤`} sub={`${stats.lootNeedingRepair} need repair`} color={AMBER} />
        <DeckTile label="30-DAY INCOME" value={`${fmt(stats.income30)} ¤`} color={TEAL} />
      </div>

      {/* ── Op type distribution ──────────────────────────────────────────── */}
      {Object.keys(stats.opTypes).length > 0 && (
        <div>
          <SectionHead>OP TYPE BREAKDOWN</SectionHead>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(stats.opTypes).sort((a,b)=>b[1]-a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 border px-3 py-1.5" style={{ ...PANEL, borderColor: `${OP_COLOR[type]}55` }}>
                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: OP_COLOR[type] }} />
                <span className="text-[9px] tracking-[0.16em]" style={{ color: OP_COLOR[type] }}>{type.toUpperCase()}</span>
                <span className="text-[11px] font-bold" style={{ color: OP_COLOR[type] }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Live work order feed ──────────────────────────────────────────── */}
      <div>
        <SectionHead>LIVE WORK ORDER FEED</SectionHead>
        <div className="mt-2 space-y-1">
          {recentWO.length === 0 ? (
            <div className="border p-6 text-center text-[9px]" style={{ ...PANEL, color: DIM }}>No work orders logged yet.</div>
          ) : recentWO.map((o, i) => {
            const gross = o.gross_auec || 0;
            const exp = (o.expenses||[]).reduce((s,e)=>s+(e.amount_auec||0),0);
            const net = gross - exp;
            const settled = o.status === 'settled';
            const age = differenceInDays(new Date(), new Date(o.created_date));
            return (
              <motion.div key={o.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="border" style={{ ...PANEL, borderColor: settled ? '#3A5A3A' : age >= 3 ? '#4A3A18' : '#2A2118' }}>
                <div className="grid grid-cols-[auto_1fr_80px_80px_80px_70px] gap-2 px-3 py-2 items-center">
                  <span className="w-1.5 h-4 shrink-0" style={{ background: settled ? '#7BA05B' : OP_COLOR[o.op_type||'other'], opacity: 0.8 }} />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold truncate" style={{ color: '#D8CFC0' }}>{o.order_name}</div>
                    <div className="text-[8px]" style={{ color: DIM }}>
                      {(o.op_type||'other').toUpperCase()} · {(o.crew_shares||[]).map(c=>c.handle).join(', ') || 'no crew'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px]" style={{ color: DIMMER }}>GROSS</div>
                    <div className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>{fmt(gross)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px]" style={{ color: DIMMER }}>NET</div>
                    <div className="text-[10px] font-mono font-bold" style={{ color: AMBER }}>{fmt(net)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px]" style={{ color: DIMMER }}>CREW</div>
                    <div className="text-[10px] font-mono" style={{ color: TEAL }}>{(o.crew_shares||[]).length}</div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[8px] px-1.5 py-0.5 font-bold" style={{
                      color: settled ? '#7BA05B' : AMBER,
                      border: `1px solid ${settled ? '#7BA05B' : AMBER}44`,
                      background: `${settled ? '#7BA05B' : AMBER}10`,
                    }}>
                      {settled ? 'SETTLED' : 'OPEN'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Market trend ─────────────────────────────────────────────────── */}
      <div>
        <SectionHead>COMMODITY MARKET TREND</SectionHead>
        <div className="mt-2 border" style={PANEL}>
          <CommodityTrendChart />
        </div>
      </div>

      {/* ── Alert rail ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {stats.staleWO > 0 && (
          <div className="flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px]" style={{ borderColor: '#C8893B55', background: '#C8893B10', color: '#C8893B' }}>
            <AlertTriangle className="w-3 h-3" /> {stats.staleWO} work order{stats.staleWO > 1 ? 's' : ''} open 3+ days — settle or investigate
          </div>
        )}
        {stats.activeOrders > 3 && (
          <div className="flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px]" style={{ borderColor: '#5B8EC055', background: '#5B8EC010', color: '#5B8EC0' }}>
            <ShoppingBag className="w-3 h-3" /> {stats.activeOrders} orders in queue — check fulfillment pipeline
          </div>
        )}
        {stats.lootNeedingRepair > 2 && (
          <div className="flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px]" style={{ borderColor: `${AMBER}55`, background: `${AMBER}10`, color: AMBER }}>
            <Clock className="w-3 h-3" /> {stats.lootNeedingRepair} loot items awaiting repair — review in Loot Tracker
          </div>
        )}
      </div>
    </div>
  );
}