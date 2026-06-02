import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const border = { borderColor: 'hsl(170, 25%, 18%)' };

const confidenceColor = {
  high: 'border-primary/40 text-primary',
  medium: 'border-yellow-500/40 text-yellow-400',
  low: 'border-destructive/40 text-destructive',
};

// Renders the structured output of an AI salvage scan.
export default function ScanResult({ result }) {
  if (!result) return null;
  const commodities = result.detected_commodities || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-3 rounded font-mono text-xs"
      style={{ ...border, background: 'hsl(180, 12%, 8%)', border: '1px solid hsl(170, 25%, 18%)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-primary font-semibold">AI ANALYSIS</span>
        {result.confidence && (
          <Badge variant="outline" className={`text-[9px] h-5 ${confidenceColor[result.confidence] || ''}`}>
            {result.confidence.toUpperCase()} CONFIDENCE
          </Badge>
        )}
      </div>

      <p className="text-foreground/80 leading-relaxed">{result.summary}</p>

      {commodities.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t" style={border}>
          {commodities.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'hsl(180, 10%, 12%)' }}>
              <div>
                <span className="text-primary font-semibold">{c.code || c.name || '—'}</span>
                {c.terminal_name && <span className="text-muted-foreground"> · {c.terminal_name}</span>}
              </div>
              <div className="text-right">
                {c.price_sell != null && <div className="text-primary">{Number(c.price_sell).toFixed(2)} aUEC</div>}
                {c.quantity_scu != null && <div className="text-[9px] text-muted-foreground">{c.quantity_scu} SCU</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}