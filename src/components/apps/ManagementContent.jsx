import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import ManagementView from '@/components/apps/station/ManagementView';
import ProductManager from '@/components/apps/management/ProductManager';
import DiscountManager from '@/components/apps/management/DiscountManager';
import JobBoardAdmin from '@/components/apps/fairshare/JobBoardAdmin';
import CrewRoster from '@/components/apps/fairshare/CrewRoster';
import OrdersContent from '@/components/apps/OrdersContent';
import OpsAuditLog from '@/components/apps/management/OpsAuditLog';
import InventoryManager from '@/components/apps/management/InventoryManager';
import SalvageCommodityDashboard from '@/components/apps/management/SalvageCommodityDashboard';
import OpsCommandDeck from '@/components/apps/management/OpsCommandDeck';

const AMBER  = '#E0A22E';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';

const TABS = [
  { id: 'overview',  label: 'OVERVIEW',   glyph: '◈' },
  { id: 'store',     label: 'STORE',      glyph: '⬡' },
  { id: 'discounts', label: 'DISCOUNTS',  glyph: '◆' },
  { id: 'orders',    label: 'ORDERS',     glyph: '▸' },
  { id: 'jobs',      label: 'JOB BOARD',  glyph: '✦' },
  { id: 'crew',      label: 'CREW',       glyph: '◉' },
  { id: 'salvage',   label: 'SALVAGE',    glyph: '◈' },
  { id: 'inventory', label: 'INVENTORY',  glyph: '▦' },
  { id: 'auditlog',  label: 'AUDIT LOG',  glyph: '⬚' },
  { id: 'ops',       label: 'OPS DECK',   glyph: '◉' },
];

export default function ManagementContent() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono" style={{ background: '#0A0806' }}>
        <span className="text-[10px] tracking-[0.2em]" style={{ color: DIM }}>VERIFYING CLEARANCE…</span>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center font-mono" style={{ background: '#0A0806' }}>
        <div className="text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto" style={{ color: '#C05050' }} />
          <div className="text-xs tracking-[0.25em]" style={{ color: '#C05050' }}>MANAGEMENT CLEARANCE REQUIRED</div>
          <p className="text-[9px]" style={{ color: DIM }}>This console is restricted to FSIS management personnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
        <span style={{ color: AMBER }}>◈</span>
        <span className="text-[9px] tracking-[0.25em]" style={{ color: '#7A6050' }}>MANAGEMENT CONSOLE</span>
        <span className="text-[8px] ml-auto" style={{ color: DIMMER }}>
          {user?.full_name || user?.email}
        </span>
      </div>

      {/* Tab rail */}
      <div className="shrink-0 border-b flex overflow-x-auto" style={{ borderColor: '#2A2118' }}>
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="relative flex items-center gap-1.5 px-4 py-2.5 text-[9px] tracking-[0.15em] whitespace-nowrap shrink-0 transition-colors"
              style={{ color: active ? AMBER : DIM }}
            >
              <span style={{ color: active ? AMBER : DIMMER }}>{t.glyph}</span>
              {t.label}
              {active && (
                <motion.div
                  layoutId="mgmt-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: AMBER }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview'  && <div className="p-4"><ManagementView /></div>}
        {activeTab === 'store'     && <div className="p-4"><ProductManager /></div>}
        {activeTab === 'discounts' && <div className="p-4"><DiscountManager /></div>}
        {activeTab === 'orders'    && <OrdersContent />}
        {activeTab === 'jobs'      && <JobBoardAdmin />}
        {activeTab === 'crew'      && <CrewRoster />}
        {activeTab === 'salvage'   && <div className="p-4"><SalvageCommodityDashboard /></div>}
        {activeTab === 'inventory' && <div className="p-4"><InventoryManager /></div>}
        {activeTab === 'auditlog'  && <OpsAuditLog />}
        {activeTab === 'ops'       && <OpsCommandDeck />}
      </div>
    </div>
  );
}