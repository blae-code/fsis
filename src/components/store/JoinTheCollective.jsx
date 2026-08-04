import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { HardHat, ArrowRight, Loader2 } from 'lucide-react';
import { fsisRole, ROLE_META } from '@/lib/roles';
import JoinRequestForm from '@/components/store/JoinRequestForm';

const STATUS_META = {
  pending: { label: 'BEFORE THE COUNCIL', color: '#E0A22E' },
  accepted: { label: 'ACCEPTED', color: '#8A8F45' },
  declined: { label: 'DECLINED', color: '#C05050' },
  withdrawn: { label: 'WITHDRAWN', color: '#6B6155' },
};

const TERMS = [
  ['PAID IN FULL', 'Every task carries a fixed sum agreed before you start. It is settled to you directly and never diluted into anyone else\u2019s pool.'],
  ['NO ROTA, NO ORDERS', 'Work is posted openly. You take up what you choose, when you choose. Musters are answered, not commanded.'],
  ['YOUR RECORD IS YOURS', 'Every task you finish and every muster you stand is recorded on your own labour board, in your own name.'],
  ['NO CLAIM ON YOU', 'Contractors owe the outfit nothing between jobs \u2014 no dues, no quota, no standing to lose by resting.'],
];

/** The front door: what the outfit offers a working comrade, and how to ask in. */
export default function JoinTheCollective({ user, userLoading }) {
  const role = fsisRole(user);
  const { data: mine = [], isLoading } = useQuery({
    queryKey: ['my_standing_request'],
    queryFn: () => base44.entities.standing_request.list('-created_date', 5),
    enabled: !!user,
  });
  const latest = mine[0];

  return (
    <div className="space-y-3 max-w-4xl font-mono">
      <div className="border p-4 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg, #14110D, #0E0C09)', clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)' }}>
        <p className="text-[9px] tracking-[0.28em]" style={{ color: '#8A8F45' }}>// LABOUR WANTED</p>
        <h2 className="text-lg font-bold tracking-[0.14em]" style={{ color: '#EDE5D6' }}>WORK WITH US, NOT FOR US</h2>
        <p className="text-[10px] leading-relaxed max-w-2xl" style={{ color: '#9C9080' }}>
          Nothing leaves this yard that wasn't cut, hauled or repaired by someone's hands. The value is made by
          that labour, so the labour is what we pay first — before margin, before the pool, before anything else.
          We need scrapers, haulers, escorts and repair hands.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {TERMS.map(([title, body]) => (
          <div key={title} className="border p-3 space-y-1" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
            <div className="text-[9px] tracking-[0.18em]" style={{ color: '#E0A22E' }}>{title}</div>
            <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>{body}</p>
          </div>
        ))}
      </div>

      <div id="offer-your-labour" className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#100E0B' }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#6FA0C8' }}>
          <HardHat className="w-3.5 h-3.5" /> OFFER YOUR LABOUR
        </div>

        {userLoading || (user && isLoading) ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
        ) : !user ? (
          <div className="space-y-2">
            <p className="text-[10px] leading-relaxed" style={{ color: '#9C9080' }}>
              An account only exists so the council can credit your work and pay you. Buying from us never needs one.
            </p>
            <Link
              to="/register"
              className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2"
              style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}
            >
              CREATE AN ACCOUNT <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="text-[9px]" style={{ color: '#6B6155' }}>
              Already have one? <Link to="/login" className="underline" style={{ color: '#C8A05B' }}>Sign in</Link> and the form appears here.
            </p>
          </div>
        ) : role !== 'patron' ? (
          <div className="space-y-1">
            <p className="text-[10px]" style={{ color: ROLE_META[role].color }}>
              YOU HOLD {ROLE_META[role].label} STANDING — {ROLE_META[role].blurb}.
            </p>
            <Link to="/work" className="text-[9px] underline inline-flex items-center gap-1" style={{ color: '#8A8F45' }}>
              GO TO THE LABOUR BOARD <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : latest && latest.status === 'pending' ? (
          <div className="space-y-1">
            <p className="text-[10px]" style={{ color: STATUS_META.pending.color }}>
              YOUR REQUEST IS {STATUS_META.pending.label} — filed {new Date(latest.created_date).toLocaleDateString([], { dateStyle: 'medium' })} as {latest.handle}.
            </p>
            <p className="text-[9px]" style={{ color: '#6B6155' }}>
              The council answers as comrades, not as a hiring desk. Nothing more is asked of you meanwhile.
            </p>
          </div>
        ) : (
          <>
            {latest && STATUS_META[latest.status] && (
              <p className="text-[9px]" style={{ color: STATUS_META[latest.status].color }}>
                LAST REQUEST: {STATUS_META[latest.status].label}{latest.review_notes ? ` — ${latest.review_notes}` : ''}
              </p>
            )}
            <JoinRequestForm />
          </>
        )}
      </div>
    </div>
  );
}