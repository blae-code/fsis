import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { scanIdentityLinks } from '@/functions/scanIdentityLinks';
import { ruleIdentityLink } from '@/functions/ruleIdentityLink';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserSearch, Loader2, RefreshCw } from 'lucide-react';
import IdentityLinkCard from '@/components/apps/management/access/IdentityLinkCard';

const STATUS = [
  { key: 'suspected', label: 'AWAITING THE COUNCIL', color: '#E0A22E' },
  { key: 'linked', label: 'ONE COMRADE', color: '#D08A6A' },
  { key: 'cleared', label: 'TWO COMRADES', color: '#8A8F45' },
];

/**
 * Suspected alt accounts. A dismissal that can be shed by registering again is no dismissal at all,
 * and the honest hands pay for it — so the grounds are gathered, stated, and put to the council.
 */
export default function IdentityLinkPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('suspected');

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['identity_links'],
    queryFn: () => base44.entities.identity_link.list('-score', 200),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['identity_links'] });
    qc.invalidateQueries({ queryKey: ['access_roster'] });
  };
  const scan = useMutation({ mutationFn: () => scanIdentityLinks({}), onSuccess: invalidate });
  const rule = useMutation({ mutationFn: (payload) => ruleIdentityLink(payload), onSuccess: invalidate });

  const visible = links.filter((l) => l.status === filter);
  const error = scan.error || rule.error;

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>
          <UserSearch className="w-3.5 h-3.5" /> LINKED IDENTITIES
        </div>
        <button
          disabled={scan.isPending}
          onClick={() => scan.mutate()}
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#120D08' }}
        >
          {scan.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />} GATHER GROUNDS
        </button>
      </div>

      <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Nothing here is decided by machine. Where an account carrying a mark looks like the same comrade as
        another, the reasons are set out for the council to weigh. Ruled one comrade, the mark and the lock
        carry across — with the same appeal open to them as any other. Ruled two comrades, the pair is left
        alone for good.
      </p>

      <div className="flex flex-wrap gap-1">
        {STATUS.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em]"
            style={{
              borderColor: filter === s.key ? s.color : '#2E2519',
              color: filter === s.key ? s.color : '#7A6E60',
              background: '#0C0A07',
            }}
          >
            {s.label} {links.filter((l) => l.status === s.key).length}
          </button>
        ))}
      </div>

      {scan.data && (
        <p className="text-[8px]" style={{ color: '#8A8F45' }}>
          {scan.data.data?.accounts_examined} accounts examined · {scan.data.data?.flagged_accounts} carrying marks ·{' '}
          {scan.data.data?.new_suspicions} new grounds raised.
        </p>
      )}
      {error && (
        <p className="text-[8px]" style={{ color: '#D08A6A' }}>{error?.response?.data?.error || error.message}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : visible.length === 0 ? (
        <p className="text-[8px] py-3 text-center" style={{ color: '#6B6155' }}>
          Nothing in this state. Gather grounds to look again.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-2">
          {visible.map((l) => (
            <IdentityLinkCard key={l.id} link={l} pending={rule.isPending} onRule={(p) => rule.mutate(p)} />
          ))}
        </div>
      )}
    </div>
  );
}