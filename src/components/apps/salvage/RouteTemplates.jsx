import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Trash2, MapPin, ArrowRight, Loader2, Download } from 'lucide-react';

// Saved haul route templates: store frequent routes (origin → destination,
// commodity, expected payout) and load them into the new-lot form in one click.
export default function RouteTemplates({ form, onLoad }) {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['route_templates'],
    queryFn: () => base44.entities.route_template.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.entities.route_template.create({
        template_name: form.lot_name || `${form.origin || '?'} → ${form.destination || '?'}`,
        commodity_code: form.commodity_code,
        origin: form.origin,
        destination: form.destination,
        expected_payout_auec: parseFloat(form.est_value_auec) || 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['route_templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.route_template.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['route_templates'] }),
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground">SAVED ROUTES</p>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[9px] font-mono gap-1"
          style={{ borderColor: 'hsl(33, 18%, 18%)' }}
          disabled={(!form.origin && !form.destination) || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkPlus className="w-3 h-3" />}
          SAVE CURRENT ROUTE
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground py-2">
          No saved routes yet — fill in the form above and save your frequent runs.
        </p>
      ) : (
        <div className="space-y-1.5">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border px-2 py-1.5" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 9%)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-foreground truncate">{t.template_name}</p>
                <p className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                  {t.commodity_code && <span className="text-primary">{t.commodity_code}</span>}
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{t.origin || '?'}</span>
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{t.destination || '?'}</span>
                </p>
              </div>
              {t.expected_payout_auec > 0 && (
                <span className="text-[10px] font-mono text-primary shrink-0">
                  ~{t.expected_payout_auec.toLocaleString()} aUEC
                </span>
              )}
              <button
                onClick={() => onLoad(t)}
                className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-1 border hover:bg-secondary/50 transition-colors shrink-0"
                style={{ borderColor: 'hsl(38, 72%, 52%, 0.4)', color: 'hsl(38, 72%, 52%)' }}
              >
                <Download className="w-2.5 h-2.5" /> LOAD
              </button>
              <button onClick={() => deleteMutation.mutate(t.id)} className="hover:opacity-70 text-muted-foreground shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}