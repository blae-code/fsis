import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Trash2, UserCheck, UserX } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const JOB_TYPES = ['salvage', 'hauling', 'fabrication', 'security', 'mining', 'other'];
const STATUS_CYCLE = { open: 'filled', filled: 'closed', closed: 'open' };

/** Internal job board management — post contractor openings shown on the public storefront. */
export default function JobBoardAdmin() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [jobType, setJobType] = useState('salvage');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  const [slots, setSlots] = useState('1');

  const { data: postings = [] } = useQuery({
    queryKey: ['job_postings'],
    queryFn: () => base44.entities.job_posting.list('-created_date'),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['job_applications'],
    queryFn: () => base44.entities.job_application.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (p) => base44.entities.job_posting.create(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_postings'] });
      setTitle(''); setSkills(''); setDescription(''); setSlots('1');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.job_posting.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job_postings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.job_posting.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job_postings'] }),
  });

  const appMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.job_application.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job_applications'] }),
  });

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Post a job */}
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <Megaphone className="w-3 h-3" /> POST A CONTRACTOR OPENING
        </div>
        <div className="grid grid-cols-[1fr_9rem_4rem] gap-2">
          <Input placeholder="Job title, e.g. Hull scraper — Reclaimer crew" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" style={border} />
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="h-8 text-xs" style={border}><SelectValue /></SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs font-mono">{t.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min="1" value={slots} onChange={(e) => setSlots(e.target.value)} className="h-8 text-xs" style={border} title="Slots" />
        </div>
        <Input placeholder="Skills, comma-separated, e.g. Multi-tool scraping, Tractor beam ops" value={skills} onChange={(e) => setSkills(e.target.value)} className="h-8 text-xs" style={border} />
        <Textarea placeholder="What the work involves, schedule expectations…" value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs h-16" style={border} />
        <Button size="sm" className="h-8 text-[10px]" disabled={!title || createMutation.isPending}
          onClick={() => createMutation.mutate({
            title,
            job_type: jobType,
            skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
            description,
            slots: parseInt(slots) || 1,
            status: 'open',
          })}>
          POST TO PUBLIC BOARD
        </Button>
        <p className="text-[9px] text-muted-foreground">
          All postings state the standard rate up front: 1 share per 20 min confirmed participation, cashed every Friday.
        </p>
      </div>

      {/* Postings */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">POSTINGS ({postings.length})</div>
        {postings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No postings yet.</p>
        ) : postings.map((p) => (
          <div key={p.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground">{p.title}</div>
              <div className="text-[9px] text-muted-foreground truncate">
                {p.job_type?.toUpperCase()} • {p.slots} slot{p.slots === 1 ? '' : 's'} {(p.skills || []).length > 0 && `• ${p.skills.join(', ')}`}
              </div>
            </div>
            <button onClick={() => updateMutation.mutate({ id: p.id, data: { status: STATUS_CYCLE[p.status] || 'open' } })} title="Cycle status">
              <Badge variant="outline" className={`text-[9px] h-4 cursor-pointer ${p.status === 'open' ? 'border-primary/40 text-primary' : 'border-muted text-muted-foreground'}`}>
                {p.status?.toUpperCase()}
              </Badge>
            </button>
            <button onClick={() => deleteMutation.mutate(p.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Applications */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">APPLICATIONS ({applications.length})</div>
        {applications.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No applications yet.</p>
        ) : applications.map((a) => (
          <div key={a.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground">{a.handle} → {a.posting_title}</div>
              <div className="text-[9px] text-muted-foreground truncate">{a.contact && `${a.contact} • `}{a.pitch}</div>
            </div>
            <Badge variant="outline" className={`text-[9px] h-4 ${a.status === 'accepted' ? 'border-primary/40 text-primary' : a.status === 'declined' ? 'border-destructive/40 text-destructive' : 'border-muted text-muted-foreground'}`}>
              {a.status?.toUpperCase()}
            </Badge>
            {a.status === 'new' && (
              <>
                <button onClick={() => appMutation.mutate({ id: a.id, status: 'accepted' })} className="text-muted-foreground hover:text-primary" title="Accept">
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => appMutation.mutate({ id: a.id, status: 'declined' })} className="text-muted-foreground hover:text-destructive" title="Decline">
                  <UserX className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}