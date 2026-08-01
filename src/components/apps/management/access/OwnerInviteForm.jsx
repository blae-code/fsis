import React, { useState } from 'react';
import { inviteOwner } from '@/functions/inviteOwner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2 } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** Owner seats are extended, never applied for — proprietor authority only. */
export default function OwnerInviteForm() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const invite = useMutation({
    mutationFn: () => inviteOwner({ email: email.trim(), notes: notes.trim() }),
    onSuccess: () => {
      setEmail(''); setNotes('');
      qc.invalidateQueries({ queryKey: ['access_roster'] });
      qc.invalidateQueries({ queryKey: ['access_grants'] });
    },
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <UserPlus className="w-3.5 h-3.5" /> EXTEND AN OWNER SEAT
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Ownership of the means of production is shared, not sold. No one applies for a seat — the proprietor
        extends it to a comrade who has already carried the work.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="comrade@email" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for the record" className="h-9 border px-2 text-[10px]" style={box} />
      </div>
      {invite.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{invite.error?.response?.data?.error || invite.error.message}</p>}
      {invite.data?.data?.ok && <p className="text-[9px]" style={{ color: '#8A8F45' }}>SEAT EXTENDED — the invitation is on its way.</p>}
      <button
        onClick={() => invite.mutate()}
        disabled={invite.isPending || !email.includes('@')}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {invite.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} EXTEND SEAT
      </button>
    </div>
  );
}