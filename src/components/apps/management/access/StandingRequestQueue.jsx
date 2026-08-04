import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { reviewStandingRequest } from '@/functions/reviewStandingRequest';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardHat, Loader2 } from 'lucide-react';

/** Comrades who have offered their labour, awaiting the council's answer. */
export default function StandingRequestQueue() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['standing_requests'],
    queryFn: () => base44.entities.standing_request.filter({ status: 'pending' }, '-created_date', 50),
    refetchInterval: 60000,
  });

  const answer = useMutation({
    mutationFn: ({ request, accept }) => reviewStandingRequest({
      request_id: request.id,
      decision: accept ? 'accept' : 'decline',
      review_notes: notes[request.id] || '',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['standing_requests'] });
      qc.invalidateQueries({ queryKey: ['access_roster'] });
      qc.invalidateQueries({ queryKey: ['access_grants'] });
    },
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#6FA0C8' }}>
        <HardHat className="w-3.5 h-3.5" /> LABOUR OFFERED — {requests.length} AWAITING ANSWER
      </div>
      {answer.error && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>{answer.error?.response?.data?.error || answer.error.message}</p>
      )}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : requests.length === 0 ? (
        <p className="text-[9px] py-3 text-center" style={{ color: '#6B6155' }}>Nobody waiting — the door is open all the same.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="border p-2 space-y-1.5" style={{ borderColor: '#2E2519', background: '#0B0906' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px]" style={{ color: '#EDE5D6' }}>{r.handle}</span>
                <span className="text-[8px]" style={{ color: '#6B6155' }}>
                  {new Date(r.created_date).toLocaleDateString([], { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="text-[9px] space-y-0.5" style={{ color: '#8A7E6C' }}>
                {r.skills && <div>OFFERS: {r.skills}</div>}
                {r.availability && <div>AVAILABLE: {r.availability}{r.timezone ? ` (${r.timezone})` : ''}</div>}
                {r.note && <div style={{ color: '#9C9080' }}>“{r.note}”</div>}
              </div>
              <input
                value={notes[r.id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                placeholder="Answer to the comrade — required to decline, and shown to them in full"
                className="h-8 w-full border px-2 text-[10px]"
                style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
              />
              <div className="flex gap-1">
                <button
                  disabled={answer.isPending}
                  onClick={() => answer.mutate({ request: r, accept: true })}
                  className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
                  style={{ borderColor: '#8A8F45', color: '#8A8F45', background: '#0D130D' }}
                >
                  ADMIT AS CONTRACTOR
                </button>
                <button
                  disabled={answer.isPending || !(notes[r.id] || '').trim()}
                  onClick={() => answer.mutate({ request: r, accept: false })}
                  className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
                  style={{ borderColor: '#5A2A2A', color: '#C05050', background: '#140A0A' }}
                >
                  DECLINE FOR NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}