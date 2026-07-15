import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncUex } from '@/functions/syncUex';
import { repriceProducts } from '@/functions/repriceProducts';
import { Loader2, PauseCircle, PlayCircle, RefreshCw, Anchor } from 'lucide-react';
import { INTEL, PATCH_VERSION } from '@/components/apps/management/proprietor/patch49Intel';
import Patch49ChecklistPanel from '@/components/apps/management/proprietor/Patch49ChecklistPanel';

const SEVERITY = { high: '#C05050', medium: '#E0A22E', low: '#8A8F45' };
const PAUSE_MESSAGE = `Alpha ${PATCH_VERSION} go-live in progress — FSIS is holding new manifests while salvage prices and stock stabilize on the new patch. Existing orders remain tracked. Back online shortly.`;

function ActionButton({ icon: Icon, label, color, onClick, pending, done }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="border px-3 py-2 text-[9px] font-bold tracking-[0.14em] flex items-center justify-center gap-1.5 disabled:opacity-50"
      style={{ borderColor: `${color}60`, color, background: '#0C0A07' }}
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {done || label}
    </button>
  );
}

/** Patch 4.9 go-live command deck: anticipated-change intel, one-click
 *  transition actions, and the persisted runbook checklist. */
export default function PatchTransitionPanel() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: statusRows = [] } = useQuery({
    queryKey: ['store_status_public'],
    queryFn: () => base44.entities.store_status.list('-updated_date', 1),
  });
  const storeStatus = statusRows[0];
  const paused = !!storeStatus?.orders_paused;

  const pauseToggle = useMutation({
    mutationFn: async () => {
      const patch = paused
        ? { orders_paused: false, public_message: `FSIS is back online on Alpha ${PATCH_VERSION} — prices re-anchored to fresh market data.` }
        : { orders_paused: true, public_message: PAUSE_MESSAGE };
      if (storeStatus) return base44.entities.store_status.update(storeStatus.id, { ...patch, updated_by: 'patch_transition' });
      return base44.entities.store_status.create({ setting_key: 'primary', ...patch, updated_by: 'patch_transition' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store_status_public'] }),
  });

  const resync = useMutation({
    mutationFn: () => syncUex({}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price_command'] }); qc.invalidateQueries({ queryKey: ['ticker_prices'] }); },
  });

  const reprice = useMutation({
    mutationFn: () => repriceProducts({}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
  });

  return (
    <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-4 font-mono">
      {/* Intel briefing */}
      <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
        <div className="flex items-center justify-between">
          <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>ALPHA {PATCH_VERSION} INTEL BRIEFING</div>
          <span className="text-[8px]" style={{ color: '#7A6E60' }}>OFFICIAL ROADMAP · ISC · PTU NOTES</span>
        </div>
        {INTEL.map((item, idx) => {
          const open = expanded === idx;
          return (
            <button key={item.title} onClick={() => setExpanded(open ? null : idx)} className="w-full border px-2.5 py-2 text-left" style={{ borderColor: open ? `${SEVERITY[item.severity]}50` : '#3A2F20', background: '#0C0A07' }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SEVERITY[item.severity] }} />
                <span className="text-[7px] tracking-[0.18em] shrink-0 px-1 border" style={{ borderColor: '#3A2F20', color: SEVERITY[item.severity] }}>{item.tag}</span>
                <span className="flex-1 text-[10px] font-bold truncate" style={{ color: '#D8CFC0' }}>{item.title}</span>
                <span className="text-[9px]" style={{ color: '#5A4A34' }}>{open ? '−' : '+'}</span>
              </div>
              {open && (
                <div className="mt-2 space-y-1.5 pl-3.5">
                  <p className="text-[9px] leading-relaxed" style={{ color: '#9C9080' }}>{item.impact}</p>
                  <p className="text-[9px] leading-relaxed" style={{ color: '#E0A22E' }}>→ {item.action}</p>
                  <p className="text-[8px]" style={{ color: '#5A4A34' }}>SOURCE: {item.source}</p>
                </div>
              )}
            </button>
          );
        })}

        {/* Transition actions */}
        <div className="pt-2 border-t space-y-2" style={{ borderColor: '#2A2118' }}>
          <div className="text-[8px] tracking-[0.22em]" style={{ color: '#7A6E60' }}>ONE-CLICK TRANSITION ACTIONS</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ActionButton
              icon={paused ? PlayCircle : PauseCircle}
              label={paused ? 'RESUME ORDERS' : 'PAUSE ORDERS'}
              color={paused ? '#8A8F45' : '#C05050'}
              onClick={() => pauseToggle.mutate()}
              pending={pauseToggle.isPending}
            />
            <ActionButton
              icon={RefreshCw}
              label="RESYNC UEX DATA"
              color="#E0A22E"
              onClick={() => resync.mutate()}
              pending={resync.isPending}
              done={resync.isSuccess ? 'UEX RESYNCED ✓' : null}
            />
            <ActionButton
              icon={Anchor}
              label="RE-ANCHOR PRICES"
              color="#C8893B"
              onClick={() => reprice.mutate()}
              pending={reprice.isPending}
              done={reprice.isSuccess ? `REPRICED ${reprice.data?.data?.repriced ?? ''} ✓` : null}
            />
          </div>
          {paused && <p className="text-[9px]" style={{ color: '#C05050' }}>Storefront orders are PAUSED — buyers see the {PATCH_VERSION} transition notice.</p>}
          {(resync.isError || reprice.isError || pauseToggle.isError) && (
            <p className="text-[9px]" style={{ color: '#C05050' }}>
              {resync.error?.response?.data?.error || reprice.error?.response?.data?.error || pauseToggle.error?.message || 'Action failed — retry.'}
            </p>
          )}
          <p className="text-[8px] leading-relaxed" style={{ color: '#5A4A34' }}>
            Patch-day sequence: pause orders → wait for {PATCH_VERSION} UEX data → resync → re-anchor prices → audit stock (Inventory tab) → resume orders.
          </p>
        </div>
      </section>

      <Patch49ChecklistPanel />
    </div>
  );
}