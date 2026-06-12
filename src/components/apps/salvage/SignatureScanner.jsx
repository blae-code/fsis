import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar } from 'lucide-react';
import ScanUploader from './ScanUploader';
import ScanResult from './ScanResult';

const border = { borderColor: 'hsl(33, 18%, 18%)' };

// Analyze a wreck/ship scan or signature screenshot to identify the hull and estimate yield.
export default function SignatureScanner() {
  const [result, setResult] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(30, 10%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" /> Signature & Hull Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] font-mono text-muted-foreground">
            Upload a scan/HUD shot of a wreck or ship. The AI identifies the hull class and estimates expected RMC / CMR salvage yield so you can prioritize targets.
          </p>
          <ScanUploader
            scanType="signature"
            hint="Wreck scan, ship HUD, or signature readout"
            onResult={setResult}
          />
          <ScanResult result={result} />
        </CardContent>
      </Card>
    </div>
  );
}