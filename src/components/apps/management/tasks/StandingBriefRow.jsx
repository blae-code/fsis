import React from 'react';
import { Loader2, Send, Archive, RotateCcw } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';

const CADENCE_LABEL = {
  none: 'POSTED BY HAND', daily: 'DAILY', weekly: 'WEEKLY', fortnightly: 'FORTNIGHTLY', monthly: 'MONTHLY',
};

/** One standing brief: the terms held in one place, posted as often as the work comes round. */
export default function StandingBriefRow({ brief, pending, onPost, onToggle }) {
  const retired = brief.active === false;

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: retired ? '#2E2519' : '#3A2F20', background: '#0C0A07', opacity: retired ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{brief.template_name}</div>
          <div className="text-[8px] truncate" style={{ color: '#8A7E6C' }}>POSTS AS: {brief.title}</div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: '#3A2F20', color: retired ? '#6B6155' : '#6FA0C8', background: '#120D08' }}>
          {retired ? 'RETIRED' : CADENCE_LABEL[brief.cadence] || 'POSTED BY HAND'}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ color: '#6B6155' }}>
        <span style={{ color: '#8A8F45' }}>{fmtAuec(brief.agreed_credit_auec)}</span>
        <span>{(brief.category || '').toUpperCase()}</span>
        <span>{Math.max(1, Number(brief.hands_needed) || 1)} HAND(S)</span>
        {brief.estimated_hours > 0 && <span>~{brief.estimated_hours}H</span>}
        <span>{Number(brief.due_in_days) || 7}D TO RUN</span>
        <span>POSTED {Number(brief.times_posted) || 0}×</span>
      </div>

      <div className="flex gap-1">
        <button
          disabled={pending || retired}
          onClick={() => onPost(brief)}
          className="flex-1 h-7 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {pending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />} PUT IT ON THE BOARD
        </button>
        <button
          disabled={pending}
          onClick={() => onToggle(brief)}
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#3A2F20', color: '#8A7E6C', background: '#120D08' }}
        >
          {retired ? <RotateCcw className="w-2.5 h-2.5" /> : <Archive className="w-2.5 h-2.5" />} {retired ? 'REINSTATE' : 'RETIRE'}
        </button>
      </div>
    </div>
  );
}