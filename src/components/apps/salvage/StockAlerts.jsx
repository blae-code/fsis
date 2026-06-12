import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageSearch, PackageX, Plus, Trash2, RotateCcw, Loader2 } from 'lucide-react';

const panel = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' };
const fieldStyle = { borderColor: 'hsl(33, 18%, 18%)' };

export default function StockAlerts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ product_id: '', threshold_qty: '' });

  const { data: products = [] } = useQuery({
    queryKey: ['products_all'],
    queryFn: () => base44.entities.product.list('sort_order', 200),
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['stock_alerts'],
    queryFn: () => base44.entities.stock_alert.list('-created_date', 100),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stock_alerts'] });

  const createMutation = useMutation({
    mutationFn: () => {
      const p = products.find((x) => x.id === form.product_id);
      return base44.entities.stock_alert.create({
        product_id: p.id,
        product_name: p.product_name,
        code: p.code,
        threshold_qty: parseFloat(form.threshold_qty),
        status: 'armed',
        notify_email: true,
      });
    },
    onSuccess: () => {
      invalidate();
      setForm({ ...form, threshold_qty: '' });
    },
  });

  const rearmMutation = useMutation({
    mutationFn: (id) => base44.entities.stock_alert.update(id, { status: 'armed' }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.stock_alert.delete(id),
    onSuccess: invalidate,
  });

  const selected = products.find((p) => p.id === form.product_id);

  return (
    <div className="space-y-4 font-mono">
      {/* New alert */}
      <div className="border rounded p-3 space-y-2" style={panel}>
        <p className="text-[9px] tracking-[0.2em] text-muted-foreground">NEW STOCK ALERT</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
            <SelectTrigger className="h-8 text-xs font-mono col-span-2" style={fieldStyle}>
              <SelectValue placeholder="Select ware" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code ? `${p.code} — ` : ''}{p.product_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={`Min ${selected?.unit || 'SCU'}`}
            value={form.threshold_qty}
            onChange={(e) => setForm({ ...form, threshold_qty: e.target.value })}
            className="h-8 text-xs font-mono"
            style={fieldStyle}
          />
          <Button
            size="sm"
            className="h-8 text-[10px] font-mono gap-1"
            disabled={!form.product_id || !parseFloat(form.threshold_qty) || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            ARM ALERT
          </Button>
        </div>
        {selected && (
          <p className="text-[10px] text-muted-foreground">
            Current stock: <span className="text-primary">{(selected.stock ?? 0).toLocaleString()} {selected.unit || 'SCU'}</span>
          </p>
        )}
        <p className="text-[9px] text-muted-foreground">
          Checked automatically whenever stock changes — you'll get an email when a ware falls below its threshold.
        </p>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10">
          <PackageSearch className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No stock alerts armed. Set a threshold above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const triggered = a.status === 'triggered';
            const product = products.find((p) => p.id === a.product_id);
            return (
              <div
                key={a.id}
                className="border rounded p-3 flex items-center gap-3"
                style={{
                  ...panel,
                  borderColor: triggered ? 'hsl(0, 60%, 50%, 0.5)' : 'hsl(33, 18%, 18%)',
                }}
              >
                {triggered
                  ? <PackageX className="w-4 h-4 shrink-0" style={{ color: 'hsl(0, 60%, 55%)' }} />
                  : <PackageSearch className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="text-primary font-bold">{a.code || a.product_name}</span>
                    {' '}falls below{' '}
                    <span className="font-bold">{a.threshold_qty.toLocaleString()} {product?.unit || 'SCU'}</span>
                  </p>
                  {triggered ? (
                    <p className="text-[10px]" style={{ color: 'hsl(0, 60%, 55%)' }}>
                      TRIGGERED @ {(a.triggered_stock ?? 0).toLocaleString()} {product?.unit || 'SCU'}
                      {a.triggered_at ? ` • ${new Date(a.triggered_at).toLocaleString()}` : ''}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      ARMED — current stock {(product?.stock ?? 0).toLocaleString()} {product?.unit || 'SCU'}
                    </p>
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