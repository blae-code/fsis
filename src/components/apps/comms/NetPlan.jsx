import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Lock, Siren } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };

export default function NetPlan() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ channel_name: '', frequency_mhz: '', modulation: 'FM', purpose: '' });

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === 'admin';

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['comm_channels'],
    queryFn: () => base44.entities.comm_channel.filter({ active: true }, 'sort_order'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['comm_channels'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.comm_channel.create(data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ channel_name: '', frequency_mhz: '', modulation: 'FM', purpose: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.comm_channel.delete(id),
    onSuccess: invalidate,
  });

  const handleAdd = () => {
    if (!form.channel_name || !form.frequency_mhz) return;
    createMutation.mutate({
      ...form,
      frequency_mhz: parseFloat(form.frequency_mhz),
      sort_order: channels.length + 1,
    });
  };

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground tracking-[0.2em]">FSIS NET PLAN — OD3ICA SRS</span>
        {isAdmin && (
          <Button size="sm" variant="outline" className="h-7 text-[10px]" style={border} onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" /> ADD NET
          </Button>
        )}
      </div>

      {showForm && (
        <div className="p-3 rounded border space-y-2" style={{ ...border, background: 'hsl(30, 10%, 8%)' }}>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Net name (e.g. SALVAGE NET)"
              value={form.channel_name}
              onChange={(e) => setForm({ ...form, channel_name: e.target.value })}
              className="h-8 text-xs" style={border}
            />
            <Input
              placeholder="Frequency MHz"
              type="number"
              value={form.frequency_mhz}
              onChange={(e) => setForm({ ...form, frequency_mhz: e.target.value })}
              className="h-8 text-xs" style={border}
            />
            <Select value={form.modulation} onValueChange={(v) => setForm({ ...form, modulation: v })}>
              <SelectTrigger className="h-8 text-xs" style={border}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FM">FM</SelectItem>
                <SelectItem value="AM">AM</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Purpose"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="h-8 text-xs" style={border}
            />
          </div>
          <Button size="sm" className="h-7 text-[10px] w-full" onClick={handleAdd} disabled={createMutation.isPending}>
            COMMIT TO NET PLAN
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-6 text-center">Loading net plan…</p>
      ) : channels.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No nets configured</p>
      ) : (
        <div className="rounded border overflow-hidden" style={border}>
          {channels.map((ch, i) => (
            <div
              key={ch.id}
              className="flex items-center gap-3 px-3 py-2.5 text-xs"
              style={{
                borderTop: i > 0 ? '1px solid hsl(33, 18%, 18%)' : 'none',
                background: ch.is_guard ? 'hsl(0, 40%, 8%)' : 'hsl(30, 10%, 8%)',
              }}
            >
              <span className={`w-24 font-bold tracking-wider ${ch.is_guard ? 'text-destructive' : 'text-primary'}`}>
                {ch.channel_name}
              </span>
              <span className="text-foreground/90 w-28">
                {ch.frequency_mhz.toFixed(3)} <span className="text-muted-foreground">{ch.modulation}</span>
              </span>
              <span className="flex-1 text-muted-foreground truncate">{ch.purpose}</span>
              {ch.is_guard && (
                <Badge variant="outline" className="text-[9px] gap-1 border-destructive/50 text-destructive">
                  <Siren className="w-2.5 h-2.5" /> GUARD
                </Badge>
              )}
              {ch.encrypted && (
                <Badge variant="outline" className="text-[9px] gap-1" style={border}>
                  <Lock className="w-2.5 h-2.5" /> ENC
                </Badge>
              )}
              {isAdmin && !ch.is_guard && (
                <button
                  onClick={() => deleteMutation.mutate(ch.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-muted-foreground">
        Tune these frequencies in your SRS client connected to main.od3ica-srs.space. Radio 1 is recommended for GUARD.
      </p>
    </div>
  );
}