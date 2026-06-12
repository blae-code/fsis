import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Trash2 } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const sharesFor = (mins) => Math.round((mins / 20) * 100) / 100;

/** Confirmed-participation time clock: 1 share per 20 minutes, for everyone — including the Proprietor. */
export default function TimeLogs() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['time_logs'],
    queryFn: () => base44.entities.time_log.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (l) => base44.entities.time_log.create(l),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      setMinutes(''); setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.time_log.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_logs'] }),
  });

  // Outstanding (uncashed) share balance per handle
  const balances = {};
  logs.filter((l) => l.status !== 'cashed').forEach((l) => {
    balances[l.handle] = (balances[l.handle] || 0) + (l.shares || 0);
  });

  const mins = parseFloat(minutes) || 0;

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <Timer className="w-3 h-3" /> LOG CONFIRMED PARTICIPATION — 1 SHARE / 20 MIN
        </div>
        <div className="grid grid-cols-[10rem_6rem_1fr_auto] gap-2">
          <Select value={handle} onValueChange={setHandle}>
            <SelectTrigger className="h-8 text-xs" style={border}>
              <SelectValue placeholder="Crew member" />
            </SelectTrigger>
            <SelectContent>
              {crew.map((m) => (
                <SelectItem key={m.id} value={m.handle} className="text-xs font-mono">{m.handle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" min="0" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="h-8 text-xs" style={border} />
          <Input placeholder="Work performed, e.g. Hull scraping — Aaron Halo" value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs" style={border} />
          <Button size="sm" className="h-8 text-[10px]" disabled={!handle || mins <= 0 || createMutation.isPending}
            onClick={() => createMutation.mutate({
              handle,
              minutes: mins,
              shares: sharesFor(mins),
              description,
              work_date: new Date().toISOString().slice(0, 10),
              status: 'confirmed',
            })}>
            LOG {mins > 0 ? `(+${sharesFor(mins)} SH)` : ''}
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground">
          Same rate for everyone — the Proprietor's hours earn shares like any contractor's. Shares cash in on pay day (Fridays).
        </p>
      </div>

      {/* Outstanding balances */}
      {Object.keys(balances).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(balances).map(([h, sh]) => (
            <Badge key={h} variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
              {h}: {Math.round(sh * 100) / 100} SHARES OUTSTANDING
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">TIME LOG ({logs.length})</div>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No confirmed time logged yet.</p>
        ) : logs.map((l) => (
          <div key={l.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground">{l.handle} — {l.minutes} min → <span className="text-primary">{l.shares} share{l.shares === 1 ? '' : 's'}</span></div>
              <div className="text-[9px] text-muted-foreground truncate">{l.work_date} {l.description && `• ${l.description}`}</div>
            </div>
            <Badge variant="outline" className={`text-[9px] h-4 ${l.status === 'cashed' ? 'border-muted text-muted-foreground' : 'border-primary/40 text-primary'}`}>
              {l.status === 'cashed' ? `CASHED ${l.payday_date || ''}` : 'CONFIRMED'}
            </Badge>
            {l.status !== 'cashed' && (
              <button onClick={() => deleteMutation.mutate(l.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}