import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { applyScanToInventory } from '@/functions/applyScanToInventory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCw, Bot, ScanLine, Loader2 } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const TYPE_LABEL = {
  terminal: 'TERMINAL',
  contract: 'CONTRACT',
  'ship-hud': 'SHIP HUD',
  signature: 'SIGNATURE',
  manifest: 'MANIFEST',
  other: 'OTHER',
};

const CONF_STYLE = {
  high: 'border-green-600/40 text-green-500',
  medium: 'border-yellow-500/40 text-yellow-400',
  low: 'border-destructive/40 text-destructive',
};

// OD3ICA scan log: every OCR pass and what the background agent did with it.
export default function ScanLog() {
  const queryClient = useQueryClient();
  const [rerunningId, setRerunningId] = useState(null);

  const { data: scans = [] } = useQuery({
    queryKey: ['salvage_scans'],
    queryFn: () => base44.entities.salvage_scan.list('-created_date', 30),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.salvage_scan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salvage_scans'] }),
  });

  const rerunMutation = useMutation({
    mutationFn: (scan) => applyScanToInventory({
      event: { type: 'create', entity_name: 'salvage_scan', entity_id: scan.id },
      payload_too_large: true,
    }),
    onSuccess: () => {
      setRerunningId(null);
      queryClient.invalidateQueries({ queryKey: ['salvage_scans'] });
      queryClient.invalidateQueries({ queryKey: ['salvage_sessions_inventory'] });
      queryClient.invalidateQueries({ queryKey: ['price_snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: () => setRerunningId(null),
  });

  if (scans.length === 0) {
    return (
      <div className="text-center py-8">
        <ScanLine className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-[10px] font-mono text-muted-foreground">No scans logged yet — run an OCR pass above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono">
      <div className="text-[10px] text-muted-foreground tracking-[0.2em]">SCAN LOG ({scans.length})</div>
      {scans.map((scan) => (
        <div key={scan.id} className="p-2.5 rounded border space-y-1.5" style={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Badge variant="outline" className="text-[9px] h-4" style={border}>{TYPE_LABEL[scan.scan_type] || scan.scan_type}</Badge>
              {scan.confidence && (
                <Badge variant="outline" className={`text-[9px] h-4 ${CONF_STYLE[scan.confidence] || ''}`}>
                  {scan.confidence.toUpperCase()}
                </Badge>
              )}
              <span className="text-[9px] text-muted-foreground">
                {new Date(scan.created_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!scan.auto_applied && (
                <button
                  onClick={() => { setRerunningId(scan.id); rerunMutation.mutate(scan); }}
                  disabled={rerunMutation.isPending}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Re-run OD3ICA agent on this scan"
                >
                  {rerunningId === scan.id ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <RotateCw className="w-3 h-3" />}
                </button>
              )}
              <button onClick={() => deleteMutation.mutate(scan.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {scan.summary && <p className="text-[10px] text-foreground/80 line-clamp-2">{scan.summary}</p>}

          {scan.applied_changes && (
            <div className="flex items-start gap-1.5 text-[9px] p-1.5 rounded" style={{ background: 'hsl(30, 10%, 12%)' }}>
              <Bot className={`w-3 h-3 shrink-0 mt-px ${scan.auto_applied ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={scan.auto_applied ? 'text-primary' : 'text-muted-foreground'}>{scan.applied_changes}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}