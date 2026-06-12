import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Boxes, Loader2, CheckCircle2, Bot } from 'lucide-react';
import ScanUploader from './ScanUploader';
import ScanResult from './ScanResult';

const border = { borderColor: 'hsl(33, 18%, 18%)' };

// Cargo OCR: screenshot your ship's cargo readout and the OD3ICA background
// agent auto-applies detected RMC/CMR/CMS quantities to your active session.
export default function CargoScanner() {
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  // Poll the scan record until the background agent reports back
  const { data: scan } = useQuery({
    queryKey: ['cargo_scan', result?.scan_id],
    queryFn: async () => {
      const rows = await base44.entities.salvage_scan.filter({ id: result.scan_id });
      return rows[0] || null;
    },
    enabled: !!result?.scan_id,
    refetchInterval: (q) => (q.state.data?.applied_changes ? false : 2500),
  });

  const agentDone = !!scan?.applied_changes;
  if (agentDone && scan.auto_applied) {
    queryClient.invalidateQueries({ queryKey: ['salvage_sessions_inventory'] });
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(30, 10%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" /> Cargo Auto-Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] font-mono text-muted-foreground">
            Upload a screenshot of your ship's cargo readout or manifest. The OD3ICA background agent reads RMC/CMR/CMS quantities and syncs them to your active salvage session automatically — check the STOCK tab afterwards.
          </p>
          <ScanUploader
            scanType="ship-hud"
            hint="Ship HUD cargo readout / cargo manifest screen"
            onResult={setResult}
          />
          <ScanResult result={result} />

          {result?.scan_id && (
            <div
              className="flex items-start gap-2 p-2.5 rounded font-mono text-[10px]"
              style={{ background: 'hsl(30, 10%, 12%)', border: '1px solid hsl(33, 18%, 18%)' }}
            >
              {agentDone ? (
                scan.auto_applied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0 mt-0.5" />
              )}
              <span className={agentDone && scan.auto_applied ? 'text-primary' : 'text-muted-foreground'}>
                {agentDone ? scan.applied_changes : 'OD3ICA agent processing scan in background…'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}