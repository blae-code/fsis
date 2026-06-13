import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WorkOrderForm from '@/components/apps/fairshare/WorkOrderForm';
import WorkOrderList from '@/components/apps/fairshare/WorkOrderList';
import CrewRoster from '@/components/apps/fairshare/CrewRoster';
import PayrollTable from '@/components/apps/fairshare/PayrollTable';
import PayrollTracker from '@/components/apps/fairshare/PayrollTracker';
import TimeLogs from '@/components/apps/fairshare/TimeLogs';
import PaydayCycles from '@/components/apps/fairshare/PaydayCycles';
import JobBoardAdmin from '@/components/apps/fairshare/JobBoardAdmin';
import ContractorDashboard from '@/components/apps/fairshare/ContractorDashboard';

const AMBER  = '#E0A22E';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';

const TABS = [
  { id: 'orders',      label: 'WORK ORDERS',  glyph: '⬡' },
  { id: 'contractors', label: 'CONTRACTORS',  glyph: '◈' },
  { id: 'crew',        label: 'CREW ROSTER',  glyph: '▸' },
  { id: 'payroll',     label: 'PAYROLL',      glyph: '◆' },
  { id: 'time',        label: 'TIME & SHARES', glyph: '⏱' },
  { id: 'payday',      label: 'PAY DAY',      glyph: '◉' },
  { id: 'jobs',        label: 'JOB BOARD',    glyph: '✦' },
];

export default function FairShareContent() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
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
                  layoutId="fairshare-tab-underline"
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
        {activeTab === 'orders' && (
          <div className="p-4 space-y-3">
            <WorkOrderForm />
            <WorkOrderList />
          </div>
        )}
        {activeTab === 'contractors' && <ContractorDashboard />}
        {activeTab === 'crew' && <CrewRoster />}
        {activeTab === 'payroll' && (
          <div className="p-4 space-y-3">
            <PayrollTracker />
            <PayrollTable />
          </div>
        )}
        {activeTab === 'time' && <TimeLogs />}
        {activeTab === 'payday' && <PaydayCycles />}
        {activeTab === 'jobs' && <JobBoardAdmin />}
      </div>

      <div className="shrink-0 px-4 py-2 border-t text-center" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
        <p className="text-[8px] tracking-[0.1em]" style={{ color: DIMMER }}>
          "Every credit accounted for." — Net payout = gross − expenses, split by crew share weight.
        </p>
      </div>
    </div>
  );
}