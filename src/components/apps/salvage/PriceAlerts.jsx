import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellRing, Plus, Trash2, RotateCcw, Loader2 } from 'lucide-react';

const COMMODITIES = ['RMC', 'CMR', 'CMS'];
const panel = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' };
const fieldStyle = { borderColor: 'hsl(33, 18%, 18%)' };

export default function PriceAlerts({ bestPrices = {} }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ commodity_code: 'RMC', direction: 'above', target_price_auec: '' });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['price_alerts'],
    queryFn: () => base44.entities.price_alert.list('-created_date', 100),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['price_alerts'] });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.price_alert.create({
        commodity_code: form.commodity_code,
        direction: form.direction,
        target_price_auec: parseFloat(form.target_price_auec),
        status: 'armed',
        notify_email: true,
      }),
    onSuccess: () => {
      invalidate();
      setForm({ ...form, target_price_auec: '' });
    },
  });

  const rearmMutation = useMutation({
    mutationFn: (id) => base44.entities.price_alert.update(id, { status: 'armed' }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.price_alert.delete(id),
    onSuccess: invalidate,
  });

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* New alert */}
      <div className="border rounded p-3 space-y-2" style={panel}>
        <p className="text-[9px] tracking-[0.2em] text-muted-foreground">NEW PRICE ALERT</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={form.commodity_code} onValueChange={(v) => setForm({ ...form, commodity_code: v })}>
            <SelectTrigger className="h-8 text-xs font-mono" style={fieldStyle}><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMODITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
            <SelectTrigger className="h-8 text-xs font-mono" style={fieldStyle}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="above">RISES ABOVE</SelectItem>
              <SelectItem value="below">DROPS BELOW</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Target aUEC/unit"
            value={form.target_price_auec}
            onChange={(e) => setForm({ ...form, target_price_auec: e.target.value })}
            className="h-8 text-xs font-mono"
            style={fieldStyle}
          />
          <Button
            size="sm"
            className="h-8 text-[10px] font-mono gap-1"
            disabled={!parseFloat(form.target_price_auec) || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            ARM ALERT
          </Button>
        </div>
        {bestPrices[form.commodity_code] && (
          <p className="text-[10px] text-muted-foreground">
            Current best {form.commodity_code}: <span className="text-primary">{bestPrices[form.commodity_code].price_sell.toLocaleString()} aUEC</span> @ {bestPrices[form.commodity_code].terminal_name}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground">
          Checked automatically after every UEX price sync — you'll get an email when a threshold is crossed.
        </p>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10">
          <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No alerts armed. Set a target above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const triggered = a.status === 'triggered';
            return (
              <div
                key={a.id}
                className="border rounded p-3 flex items-center gap-3"
                style={{
                  ...panel,
                  borderColor: triggered ? 'hsl(140, 45%, 50%, 0.5)' : 'hsl(33, 18%, 18%)',
                }}
              >
                {triggered
                  ? <BellRing className="w-4 h-4 shrink-0" style={{ color: 'hsl(140, 45%, 50%)' }} />
                  : <Bell className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="text-primary font-bold">{a.commodity_code}</span>
                    {' '}{a.direction === 'below' ? 'drops below' : 'rises above'}{' '}
                    <span className="font-bold">{a.target_price_auec.toLocaleString()} aUEC</span>
                  </p>
                  {triggered ? (
                    <p className="text-[10px]" style={{ color: 'hsl(140, 45%, 50%)' }}>
                      TRIGGERED @ {(a.triggered_price || 0).toLocaleString()} aUEC{a.triggered_terminal ? ` — ${a.triggered_terminal}` : ''}
                      {a.triggered_at ? ` • ${new Date(a.triggered_at).toLocaleString()}` : ''}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">ARMED — watching market</p>
                  )}
                </div>
                {triggered && (
                  <button
                    onClick={() => rearmMutation.mutate(a.id)}
                    className="inline-flex items-center gap-1 text-[9px] px-2 py-1 border hover:bg-secondary/50 transition-colors shrink-0"
                    style={{ borderColor: 'hsl(38, 72%, 52%, 0.4)', color: 'hsl(38, 72%, 52%)' }}
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> RE-ARM
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(a.id)} className="hover:opacity-70 text-muted-foreground shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}