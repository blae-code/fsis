import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { salvageAdvisor } from '@/functions/salvageAdvisor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Loader2, Route as RouteIcon, Lightbulb } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 17%)' };
const CODES = ['RMC', 'CMR', 'CMS'];

// AI agent that recommends the optimal sell strategy for the cargo on hand.
export default function SalvageAdvisor() {
  const [cargo, setCargo] = useState({ RMC: 0, CMR: 0, CMS: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salvageAdvisor({ cargo });
      setResult(res.data);
    } catch (e) {
      setError(e?.message || 'Advisor failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(30, 12%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Salvage Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] font-mono text-muted-foreground">
            Enter the cargo you're holding. The AI weighs live market terminals and recommends where to sell for the best return.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CODES.map((code) => (
              <div key={code}>
                <Label className="text-[10px] font-mono text-muted-foreground">{code} (SCU)</Label>
                <Input
                  type="number"
                  min="0"
                  value={cargo[code]}
                  onChange={(e) => setCargo({ ...cargo, [code]: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="h-8 text-xs font-mono"
                  style={border}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={run}
            disabled={loading}
            className="w-full h-8 text-xs font-mono gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? 'Analyzing market…' : 'Get AI Recommendation'}
          </Button>

          {error && <p className="text-[10px] font-mono text-destructive text-center">{error}</p>}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs space-y-3 p-3 rounded"
              style={{ background: 'hsl(30, 12%, 8%)', border: '1px solid hsl(33, 18%, 17%)' }}
            >
              <p className="text-primary font-semibold xian-glow-subtle">{result.headline}</p>

              {(result.recommendations || []).map((r, i) => (
                <div key={i} className="flex items-center justify-between pb-2 border-b" style={border}>
                  <div>
                    <span className="text-primary font-semibold">{r.code}</span>
                    <span className="text-muted-foreground"> → {r.best_terminal}{r.system ? ` (${r.system})` : ''}</span>
                  </div>
                  <div className="text-right">
                    {r.price_sell != null && <div className="text-foreground">{Number(r.price_sell).toFixed(2)} aUEC</div>}
                    {r.expected_total != null && <div className="text-[9px] text-primary">≈ {Number(r.expected_total).toFixed(0)} total</div>}
                  </div>
                </div>
              ))}

              {result.optimal_route && (
                <div className="flex gap-2 items-start pt-1">
                  <RouteIcon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{result.optimal_route}</span>
                </div>
              )}

              {result.tip && (
                <div className="flex gap-2 items-start">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{result.tip}</span>
                </div>
              )}

              {result.grand_total != null && (
                <div className="flex justify-between pt-2 border-t text-base" style={border}>
                  <span className="font-bold text-primary">EST. GRAND TOTAL</span>
                  <span className="font-bold text-primary xian-glow-subtle">{Number(result.grand_total).toFixed(0)} aUEC</span>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}