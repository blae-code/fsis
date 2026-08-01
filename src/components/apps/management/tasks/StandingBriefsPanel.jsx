import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postFromTemplate } from '@/functions/postFromTemplate';
import { Loader2 } from 'lucide-react';
import StandingBriefForm from '@/components/apps/management/tasks/StandingBriefForm';
import StandingBriefRow from '@/components/apps/management/tasks/StandingBriefRow';

/** The standing briefs: terms written once, put on the board whenever the work comes round. */
export default function StandingBriefsPanel({ actorEmail }) {
  const qc = useQueryClient();
  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['task_templates'],
    queryFn: () => base44.entities.task_template.list('-created_date', 100),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['task_templates'] });
    qc.invalidateQueries({ queryKey: ['labour_tasks'] });
  };
  const post = useMutation({ mutationFn: (brief) => postFromTemplate({ template_id: brief.id, count: 1 }), onSuccess: refresh });
  const toggle = useMutation({
    mutationFn: (brief) => base44.entities.task_template.update(brief.id, { active: brief.active === false }),
    onSuccess: refresh,
  });
  const error = post.error || toggle.error;

  return (
    <div className="space-y-2">
      <div className="text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>STANDING BRIEFS — {briefs.length}</div>
      {error && (
        <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
          {error?.response?.data?.error || error.message}
        </p>
      )}

      <StandingBriefForm actorEmail={actorEmail} />

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#C8A05B' }} /></div>
      ) : briefs.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          No standing briefs yet. Write one for any work that comes round more than once.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {briefs.map((b) => (
            <StandingBriefRow
              key={b.id}
              brief={b}
              pending={post.isPending || toggle.isPending}
              onPost={(brief) => post.mutate(brief)}
              onToggle={(brief) => toggle.mutate(brief)}
            />
          ))}
        </div>
      )}
    </div>
  );
}