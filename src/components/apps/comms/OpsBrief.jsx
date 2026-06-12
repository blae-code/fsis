import React from 'react';
import { base44 } from '@/api/base44Client';
import { dailyBriefing } from '@/functions/dailyBriefing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Radio, RefreshCw, Loader2 } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

// FSIS.bot daily ops briefings — AI-composed each morning, on-demand refresh for admins.
export default function OpsBrief() {
  const queryClient = useQueryClient();

  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['ops_briefs'],
    queryFn: () => base44.entities.ops_brief.list('-created_date', 7),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const generateMutation = useMutation({
    mutationFn: () => dailyBriefing({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops_briefs'] }),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Decrypting briefings…</div>;
  }

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.2em]">
          <Radio className="w-3.5 h-3.5 text-primary" /> FSIS.bot OPS BRIEFINGS
        </div>
        {user?.role === 'admin' && (
          <Button
            variant="outline" size="sm"
            className="h-7 text-[10px] gap-1.5" style={border}
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {generateMutation.isPending ? 'COMPOSING…' : 'BRIEF ME NOW'}
          </Button>
        )}
      </div>

      {briefs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No briefings on file — FSIS.bot composes one every morning at 07:00, or hit BRIEF ME NOW.
        </p>
      ) : briefs.map((b, i) => (
        <div key={b.id} className="p-3 rounded border space-y-2" style={panel}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary">{b.headline}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{b.brief_date}{i === 0 ? ' • LATEST' : ''}</span>
          </div>
          {b.body && (
            <ReactMarkdown className="text-[10px] text-foreground/80 prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none">
              {b.body}
            </ReactMarkdown>
          )}
          {b.stats && (
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t" style={border}>
              {[
                ['SESSIONS', b.stats.active_sessions],
                ['NEW ORDERS', b.stats.new_orders],
                ['CONTRACTS', b.stats.open_contracts],
                ['UNSETTLED WO', b.stats.unsettled_work_orders],
              ].map(([label, val]) => (
                <span key={label} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(30, 10%, 12%)', color: 'hsl(42, 85%, 60%)' }}>
                  {label}: {val ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}