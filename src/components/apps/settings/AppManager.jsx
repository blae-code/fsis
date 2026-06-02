import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = ['active', 'coming-online', 'offline'];

export default function AppManager() {
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery({
    queryKey: ['apps_all'],
    queryFn: () => base44.entities.app.list('sort_order'),
  });

  const update = async (id, patch) => {
    await base44.entities.app.update(id, patch);
    queryClient.invalidateQueries({ queryKey: ['apps_all'] });
    queryClient.invalidateQueries({ queryKey: ['apps'] });
  };

  return (
    <div className="p-4 space-y-2 font-mono">
      <p className="text-[10px] text-muted-foreground mb-3">
        Enable, disable, or change the status of OS modules. Changes apply to the dock instantly.
      </p>
      {apps.map((app) => (
        <div
          key={app.id}
          className="flex items-center justify-between p-3 rounded"
          style={{ background: 'hsl(180, 12%, 8%)', border: '1px solid hsl(170, 25%, 18%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: app.color || 'hsl(168,65%,45%)' }} />
            <div>
              <div className="text-xs text-foreground">{app.name}</div>
              <div className="text-[10px] text-muted-foreground">{app.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={app.status} onValueChange={(v) => update(app.id, { status: v })}>
              <SelectTrigger className="h-7 text-[10px] font-mono w-32" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Switch
              checked={app.enabled !== false}
              onCheckedChange={(checked) => update(app.id, { enabled: checked })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}