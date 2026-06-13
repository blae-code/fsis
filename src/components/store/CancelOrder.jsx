import React, { useState, useEffect } from 'react';
import { cancelOrder } from '@/functions/cancelOrder';
import { useMutation } from '@tanstack/react-query';
import { Loader2, XCircle } from 'lucide-react';

/** Two-step buyer cancellation — only shown while the order is still 'new'. */
export default function CancelOrder({ trackingCode, onCancelled }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const mutation = useMutation({
    mutationFn: () => cancelOrder({ tracking_code: trackingCode }),
    onSuccess: () => onCancelled?.(),
  });

  const handleClick = () => {
    if (!confirming) { setConfirming(true); return; }
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className="px-2.5 py-1 font-mono text-[9px] font-bold border inline-flex items-center gap-1 hover:brightness-125 transition-all disabled:opacity-50"
      style={{
        borderColor: confirming ? '#C05050' : '#4A2A2A',
        color: confirming ? '#E07070' : '#A05858',
        background: confirming ? 'rgba(192, 80, 80, 0.08)' : '#141010',
      }}
    >
      {mutation.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <XCircle className="w-2.5 h-2.5" />}
      {confirming ? 'CONFIRM CANCEL?' : 'CANCEL'}
    </button>
  );
}