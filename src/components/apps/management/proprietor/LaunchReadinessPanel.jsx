import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QA_CHECKS } from './launchReadinessConfig';
import ReadinessScoreCard from './ReadinessScoreCard';
import RoleCoveragePanel from './RoleCoveragePanel';
import QaChecklistPanel from './QaChecklistPanel';
import TestScenarioPanel from './TestScenarioPanel';
import LaunchBlockerPanel from './LaunchBlockerPanel';
import QaDataControls from './QaDataControls';
import AcceptanceRunPanel from './AcceptanceRunPanel';

function computedBlockers({ orders, products, loot, prices, messages }) {
  const latestPrice = prices.map((p) => p.synced_at).filter(Boolean).sort().at(-1);
  const stale = !latestPrice || Date.now() - new Date(latestPrice).getTime() > 24 * 60 * 60 * 1000;
  return [
    products.filter((p) => p.available).length === 0 && { severity: 'blocker', label: 'No public inventory', detail: 'Storefront needs at least one available item.' },
    orders.some((o) => ['new', 'confirmed'].includes(o.status)) && { severity: 'important', label: 'Active order queue', detail: 'Orders need a final fulfillment pass before launch.' },
    loot.filter((i) => ['raw', 'repairing', 'repaired'].includes(i.status)).length > 5 && { severity: 'important', label: 'Loot backlog', detail: 'Large unprocessed loot queue may confuse launch inventory.' },
    stale && { severity: 'blocker', label: 'Market cache stale', detail: 'UEX price data should be refreshed before publishing.' },
    messages.length > 0 && { severity: 'important', label: 'Buyer messages present', detail: 'Review buyer communications before launch.' },
  ].filter(Boolean);
}

export default function LaunchReadinessPanel(props) {
  const qc = useQueryClient();
  const { data: checks = [] } = useQuery({ queryKey: ['qa_checks'], queryFn: () => base44.entities.qa_check.list('phase', 100) });
  const missing = QA_CHECKS.filter(([key]) => !checks.some((c) => c.check_key === key));
  const seedChecks = useMutation({ mutationFn: () => base44.entities.qa_check.bulkCreate(missing.map(([check_key, phase, group, label, role, priority]) => ({ check_key, phase, group, label, role, priority, status: 'not_tested' }))), onSuccess: () => qc.invalidateQueries({ queryKey: ['qa_checks'] }) });
  const update = useMutation({ mutationFn: ({ check, status }) => base44.entities.qa_check.update(check.id, { status, last_tested_at: new Date().toISOString() }), onSuccess: () => qc.invalidateQueries({ queryKey: ['qa_checks'] }) });
  useEffect(() => { if (checks.length && missing.length && !seedChecks.isPending) seedChecks.mutate(); }, [checks.length, missing.length]);
  useEffect(() => { if (!checks.length && !seedChecks.isPending) seedChecks.mutate(); }, [checks.length]);
  const blockers = computedBlockers(props);
  return (
    <section className="space-y-3 border p-3" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg,#120D08,#080604)' }}>
      <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-3"><ReadinessScoreCard checks={checks} blockers={blockers} /><QaDataControls /></div>
      <RoleCoveragePanel />
      <QaChecklistPanel checks={checks} onStatus={(check, status) => update.mutate({ check, status })} />
      <TestScenarioPanel />
      <LaunchBlockerPanel blockers={blockers} />
      <AcceptanceRunPanel />
    </section>
  );
}