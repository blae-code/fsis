import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startProcessingTimer } from '@/functions/startProcessingTimer';
import { Loader2, FlaskConical } from 'lucide-react';
import ProcessingStartForm from '@/components/apps/management/processing/ProcessingStartForm';
import ProcessingJobRow from '@/components/apps/management/processing/ProcessingJobRow';

/** Hoppers: what is cooking, what is out and waiting, and what has been collected. */
export default function ProcessingTimersPanel() {
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['processing_jobs'],
    queryFn: () => base44.entities.processing_job.list('-started_at', 100),
    refetchInterval: 60000,
  });

  const start = useMutation({
    mutationFn: (payload) => startProcessingTimer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processing_jobs'] }),
  });

  const close = useMutation({
    mutationFn: ({ job, status }) => base44.entities.processing_job.update(job.id, {
      status,
      ...(status === 'collected'
        ? { collected_at: new Date().toISOString(), collected_by_handle: user?.full_name || user?.email || '' }
        : {}),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processing_jobs'] }),
  });

  const live = jobs.filter((j) => !['collected', 'abandoned'].includes(j.status));
  const closed = jobs.filter((j) => ['collected', 'abandoned'].includes(j.status));
  const out = live.filter((j) => new Date(j.ready_at).getTime() <= Date.now()).length;
  const startErr = start.error?.response?.data?.error || start.error?.message;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <FlaskConical className="w-3.5 h-3.5" /> HOPPERS — {live.length} RUNNING
        {out > 0 && <span style={{ color: '#8A8F45' }}>· {out} OUT AND WAITING</span>}
      </div>

      <ProcessingStartForm onStart={(payload, reset) => start.mutate(payload, { onSuccess: reset })} pending={start.isPending} error={startErr} />

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : jobs.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          Nothing is being processed. A hopper set going here is one nobody has to remember.
        </p>
      ) : (
        <div className="space-y-2">
          {live.map((j) => (
            <ProcessingJobRow
              key={j.id}
              job={j}
              pending={close.isPending}
              onCollect={(job) => close.mutate({ job, status: 'collected' })}
              onAbandon={(job) => close.mutate({ job, status: 'abandoned' })}
            />
          ))}
          {closed.length > 0 && (
            <>
              <div className="text-[7px] font-bold tracking-[0.2em] pt-2" style={{ color: '#6B6155' }}>FINISHED WITH</div>
              {closed.map((j) => (
                <ProcessingJobRow key={j.id} job={j} pending={false} onCollect={() => {}} onAbandon={() => {}} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}