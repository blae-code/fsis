import React from 'react';
import { Link } from 'react-router-dom';
import { claimOrder } from '@/functions/claimOrder';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2 } from 'lucide-react';

/**
 * Guest orders live on the device that placed them. A patron with an account can bind
 * them to that account so the record follows them, not the browser.
 */
export default function ClaimOrdersPanel({ user, orders }) {
  const qc = useQueryClient();
  const unclaimed = orders.filter((o) => o.tracking_code && o.claimed_by_user_id !== user?.id);

  const claim = useMutation({
    mutationFn: () => claimOrder({ tracking_codes: unclaimed.map((o) => o.tracking_code) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_account_orders'] });
      qc.invalidateQueries({ queryKey: ['tracked_orders'] });
    },
  });

  if (orders.length === 0) return null;

  if (!user) {
    return (
      <div className="border p-3 space-y-1 font-mono" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#6FA0C8' }}>
          <Link2 className="w-3.5 h-3.5" /> KEEP YOUR RECORD
        </div>
        <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
          These orders are held on this device alone. An account is never required to trade with us — but with
          one, your record follows you instead of the browser.{' '}
          <Link to="/register" className="underline" style={{ color: '#C8A05B' }}>Create an account</Link> or{' '}
          <Link to="/login" className="underline" style={{ color: '#C8A05B' }}>sign in</Link> to bind them.
        </p>
      </div>
    );
  }

  if (unclaimed.length === 0) return null;

  return (
    <div className="border p-3 space-y-2 font-mono" style={{ borderColor: '#3A2F20', background: '#100E0B' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#6FA0C8' }}>
        <Link2 className="w-3.5 h-3.5" /> {unclaimed.length} ORDER(S) NOT YET BOUND TO YOUR ACCOUNT
      </div>
      {claim.error && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>{claim.error?.response?.data?.error || claim.error.message}</p>
      )}
      {claim.data?.data?.skipped?.length > 0 && (
        <p className="text-[9px]" style={{ color: '#C8893B' }}>
          {claim.data.data.skipped.map((s) => `${s.code} — ${s.reason}`).join(' · ')}
        </p>
      )}
      <button
        onClick={() => claim.mutate()}
        disabled={claim.isPending}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}
      >
        {claim.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} BIND TO MY ACCOUNT
      </button>
    </div>
  );
}