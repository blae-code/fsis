import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanText } from 'lucide-react';
import ScanUploader from './ScanUploader';
import ScanResult from './ScanResult';

const border = { borderColor: 'hsl(170, 25%, 18%)' };

// OCR a commodity terminal screenshot to auto-read live prices in-game.
export default function OcrTerminal() {
  const [result, setResult] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(180, 12%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <ScanText className="w-4 h-4 text-primary" /> Terminal OCR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] font-mono text-muted-foreground">
            Upload a screenshot of any in-game commodity kiosk. The AI reads the prices directly off the screen — useful when UEX data lags the live server.
          </p>
          <ScanUploader
            scanType="terminal"
            hint="Commodity terminal / trade kiosk screen"
            onResult={setResult}
          />
          <ScanResult result={result} />
        </CardContent>
      </Card>
    </div>
  );
}