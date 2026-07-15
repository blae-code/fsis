import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Package, AlertTriangle, DollarSign, FileSignature, Crosshair, GitBranch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const RED   = '#C05050';

function buildNotifications(orders = [], stockAlerts = [], priceAlerts = [], workOrders = [], contracts = [], salvageSessions = [], patchAlert = null) {
  const notes = [];

  // New game patch detected — price list refresh required (highest priority)
  if (patchAlert) {
    notes.push({
      id: `patch_${patchAlert.live}`,
      type: 'patch',
      icon: GitBranch,
      color: RED,
      title: `Patch ${patchAlert.live} detected — price list refresh required`,
      sub: `Market cache still on ${patchAlert.cached} · resync UEX + re-anchor prices`,
      ts: new Date().toISOString(),
    });
  }

  // New orders
  const newOrders = orders.filter(o => o.status === 'new');
  if (newOrders.length) {
    newOrders.slice(0, 3).forEach(o => notes.push({
      id: `ord_${o.id}`,
      type: 'order',
      icon: Package,
      color: AMBER,
      title: `New order — ${o.customer_handle}`,
      sub: `${o.tracking_code || o.id.slice(-6).toUpperCase()} · ${(o.total_auec || 0).toLocaleString()} aUEC`,
      ts: o.created_date,
    }));
  }

  // Open work orders unsettled > 3 days
  const staleWOs = workOrders.filter(w => {
    if (w.status !== 'open') return false;
    const age = (Date.now() - new Date(w.created_date)) / 86400000;
    return age > 3;
  });
  if (staleWOs.length) {
    notes.push({
      id: 'stale_wo',
      type: 'alert',
      icon: AlertTriangle,
      color: '#C8893B',
      title: `${staleWOs.length} work order${staleWOs.length > 1 ? 's' : ''} unsettled 3+ days`,
      sub: staleWOs.map(w => w.order_name).slice(0, 2).join(', '),
      ts: staleWOs[0]?.created_date,
    });
  }

  // Price alerts
  if (priceAlerts.length) {
    notes.push({
      id: 'price_alert',
      type: 'market',
      icon: DollarSign,
      color: TEAL,
      title: `${priceAlerts.length} commodity price alert${priceAlerts.length > 1 ? 's' : ''}`,
      sub: priceAlerts.map(a => a.commodity_code || a.code).slice(0, 3).join(' · '),
      ts: priceAlerts[0]?.updated_date,
    });
  }

  // New open contracts (last 48h)
  const recentContracts = contracts.filter(c => {
    const age = (Date.now() - new Date(c.created_date)) / 3600000;
    return c.status === 'open' && age < 48;
  });
  recentContracts.slice(0, 3).forEach(c => notes.push({
    id: `contract_${c.id}`,
    type: 'contract',
    icon: FileSignature,
    color: AMBER,
    title: `Contract — ${c.title}`,
    sub: [c.contract_type?.replace(/_/g,' ').toUpperCase(), c.payout_auec ? `${c.payout_auec.toLocaleString()} aUEC` : null].filter(Boolean).join(' · '),
    ts: c.created_date,
  }));

  // New salvage sessions (last 24h)
  const recentSalvage = salvageSessions.filter(s => {
    const age = (Date.now() - new Date(s.created_date)) / 3600000;
    return age < 24;
  });
  recentSalvage.slice(0, 2).forEach(s => notes.push({
    id: `salvage_${s.id}`,
    type: 'salvage',
    icon: Crosshair,
    color: TEAL,
    title: `Salvage session — ${s.session_name}`,
    sub: [s.ship, s.location].filter(Boolean).join(' · '),
    ts: s.created_date,
  }));

  return notes.slice(0, 8);
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('fsis_dismissed_notifs') || '[]'));
  const panelRef = useRef(null);

  const { data: orders = [] }          = useQuery({ queryKey: ['notif_orders'],    queryFn: () => base44.entities.order.filter({ status: 'new' }, '-created_date', 10),    refetchInterval: 30000 });
  const { data: workOrders = [] }      = useQuery({ queryKey: ['notif_wo'],        queryFn: () => base44.entities.work_order.filter({ status: 'open' }, '-created_date', 20), refetchInterval: 60000 });
  const { data: priceAlerts = [] }     = useQuery({ queryKey: ['notif_palerts'],   queryFn: () => base44.entities.price_alert.list('-updated_date', 10),                     refetchInterval: 120000 });
  const { data: contracts = [] }       = useQuery({ queryKey: ['notif_contracts'], queryFn: () => base44.entities.contract.filter({ status: 'open' }, '-created_date', 5),   refetchInterval: 60000 });
  const { data: salvageSessions = [] } = useQuery({ queryKey: ['notif_salvage'],   queryFn: () => base44.entities.salvage_session.list('-created_date', 5),                  refetchInterval: 60000 });
  const { data: patchSetting = [] }    = useQuery({ queryKey: ['notif_patch'],     queryFn: () => base44.entities.app_setting.filter({ key: 'live_patch_version' }),         refetchInterval: 300000 });
  const { data: latestCache = [] }     = useQuery({ queryKey: ['notif_patch_cache'], queryFn: () => base44.entities.commodity_price.list('-synced_at', 1),                   refetchInterval: 300000 });

  const livePatch = patchSetting[0]?.value;
  const cachedPatch = latestCache[0]?.patch_version;
  const patchAlert = livePatch && cachedPatch && livePatch !== cachedPatch ? { live: livePatch, cached: cachedPatch } : null;

  const all = buildNotifications(orders, [], priceAlerts, workOrders, contracts, salvageSessions, patchAlert);
  const active = all.filter(n => !dismissed.includes(n.id));
  const count = active.length;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('fsis_dismissed_notifs', JSON.stringify(next));
  };

  const dismissAll = () => {
    const next = [...dismissed, ...active.map(n => n.id)];
    setDismissed(next);
    localStorage.setItem('fsis_dismissed_notifs', JSON.stringify(next));
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-7 h-7 rounded transition-colors"
        style={{ background: open ? '#1A1510' : 'transparent' }}
      >
        <Bell className="w-3.5 h-3.5" style={{ color: count > 0 ? AMBER : '#5A4E40' }} />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold"
              style={{ background: RED, color: '#fff' }}
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-80 z-[500] font-mono"
            style={{ background: '#0E0B08', border: '1px solid #3A2E1E', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2A2118' }}>
              <span className="text-[10px] tracking-[0.18em]" style={{ color: AMBER }}>ALERTS & NOTIFICATIONS</span>
              {active.length > 0 && (
                <button onClick={dismissAll} className="text-[9px]" style={{ color: '#5A4E40' }}>CLEAR ALL</button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {active.length === 0 ? (
                <div className="px-4 py-6 text-center text-[10px]" style={{ color: '#3A2E1E' }}>All clear — no alerts.</div>
              ) : (
                active.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-2.5 px-3 py-2.5 border-b group" style={{ borderColor: '#1A1510' }}>
                      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: n.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] leading-tight" style={{ color: '#D8CFC0' }}>{n.title}</div>
                        {n.sub && <div className="text-[9px] mt-0.5 truncate" style={{ color: '#5A4E40' }}>{n.sub}</div>}
                      </div>
                      <button onClick={() => dismiss(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <X className="w-3 h-3" style={{ color: '#5A4E40' }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}