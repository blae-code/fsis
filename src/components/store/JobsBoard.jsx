import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Briefcase, Send, CheckCircle2, Scale } from 'lucide-react';

const TYPE_LABELS = {
  salvage: 'SALVAGE', hauling: 'HAULING', fabrication: 'FABRICATION',
  security: 'SECURITY', mining: 'MINING', other: 'GENERAL',
};

/** Public contractor job board — open FSIS postings with guest application (no account needed). */
export default function JobsBoard() {
  const queryClient = useQueryClient();
  const [applyingTo, setApplyingTo] = useState(null);
  const [handle, setHandle] = useState('');
  const [contact, setContact] = useState('');
  const [pitch, setPitch] = useState('');
  const [sent, setSent] = useState(null);

  const { data: postings = [] } = useQuery({
    queryKey: ['public_job_postings'],
    queryFn: () => base44.entities.job_posting.filter({ status: 'open' }, '-created_date'),
  });

  const applyMutation = useMutation({
    mutationFn: (a) => base44.entities.job_application.create(a),
    onSuccess: (_, vars) => {
      setSent(vars.posting_id);
      setApplyingTo(null);
      setHandle(''); setContact(''); setPitch('');
      queryClient.invalidateQueries({ queryKey: ['job_applications'] });
    },
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <Briefcase className="w-3.5 h-3.5" /> CONTRACTOR JOB BOARD
      </div>

      {/* Standard terms — published openly so every applicant sees the same deal */}
      <div className="border p-3 space-y-1 font-mono" style={{ borderColor: '#5C4424', background: '#161310' }}>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>
          <Scale className="w-3 h-3" /> FSIS STANDARD CONTRACTOR TERMS
        </div>
        <p className="text-[10px] leading-relaxed" style={{ color: '#B8AC9A' }}>
          1 share per 20 minutes of confirmed participation — same rate for every crew member, Proprietor included.
          Shares cash in every Friday at a published per-share value (weekly distributable pool ÷ total shares).
          All payouts are itemized in the FSIS ledger.
        </p>
      </div>

      {postings.length === 0 ? (
        <div className="border p-6 text-center" style={{ borderColor: '#3A2F20' }}>
          <p className="text-xs font-mono" style={{ color: '#9C9080' }}>No open postings right now — check back soon.</p>
        </div>
      ) : (
        postings.map((p) => (
          <div key={p.id} className="border p-4 space-y-3" style={{ borderColor: '#2A2118', background: '#121110' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-mono font-bold" style={{ color: '#E5DDD0' }}>{p.title}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 font-mono text-[8px] tracking-[0.15em] border" style={{ borderColor: '#B0793A', color: '#D4920B' }}>
                    {TYPE_LABELS[p.job_type] || 'GENERAL'}
                  </span>
                  {(p.skills || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 font-mono text-[8px] border" style={{ borderColor: '#3A2F20', color: '#9C9080' }}>{s}</span>
                  ))}
                </div>
              </div>
              <span className="font-mono text-[9px] shrink-0" style={{ color: '#8A7E6C' }}>
                {p.slots} SLOT{p.slots === 1 ? '' : 'S'}
              </span>
            </div>
            {p.description && (
              <p className="text-[11px] font-mono leading-relaxed" style={{ color: '#B8AC9A' }}>{p.description}</p>
            )}

            {sent === p.id ? (
              <div className="flex items-center gap-2 font-mono text-[10px]" style={{ color: '#7BA05B' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> APPLICATION RECEIVED — FSIS WILL CONTACT YOU
              </div>
            ) : applyingTo === p.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="In-game handle"
                    className="h-8 text-xs font-mono" style={{ borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' }} />
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact — Spectrum / Discord"
                    className="h-8 text-xs font-mono" style={{ borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' }} />
                </div>
                <Input value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Relevant skills & experience"
                  className="h-8 text-xs font-mono" style={{ borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' }} />
                <div className="flex gap-2">
                  <button
                    onClick={() => applyMutation.mutate({ posting_id: p.id, posting_title: p.title, handle: handle.trim(), contact: contact.trim(), pitch: pitch.trim(), status: 'new' })}
                    disabled={!handle.trim() || applyMutation.isPending}
                    className="h-8 px-4 font-mono text-[10px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}>
                    <Send className="w-3 h-3" /> SUBMIT
                  </button>
                  <button onClick={() => setApplyingTo(null)} className="h-8 px-3 font-mono text-[10px] border" style={{ borderColor: '#3A2F20', color: '#8A7E6C' }}>
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setApplyingTo(p.id)}
                className="px-4 py-1.5 font-mono text-[10px] font-bold border hover:brightness-125 transition-all"
                style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#161310' }}>
                APPLY
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}