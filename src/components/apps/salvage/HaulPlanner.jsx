import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ship, Boxes, AlertCircle } from 'lucide-react';

const border = { borderColor: 'hsl(170, 25%, 18%)' };

// Rough RMC yield per hull and cargo capacity (SCU) for common salvage ships.
const SHIPS = {
  Vulture: { capacity: 12, rmcPerHull: 4 },
  SRV: { capacity: 0, rmcPerHull: 0 },
  Reclaimer: { capacity: 420, rmcPerHull: 18 },
};

function Row({ label, value, color = 'text-foreground', bold }) {
  return (
    <div className={`flex justify-between pb-2 border-b ${bold ? 'pt-2' : ''}`} style={border}>
      <span className={bold ? 'font-semibold text-primary' : 'text-muted-foreground'}>{label}</span>
      <span className={`${color} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

// Plan a salvage haul: hull count + ship -> expected RMC fill + value at best price.
export default function HaulPlanner({ bestPrices }) {
  const [ship, setShip] = useState('Vulture');
  const [hulls, setHulls] = useState(3);

  const spec = SHIPS[ship];
  const rmcPrice = bestPrices?.RMC?.price_sell || 0;

  const rawYield = hulls * spec.rmcPerHull;
  const cargoCap = spec.capacity;
  const carried = cargoCap > 0 ? Math.min(rawYield, cargoCap) : rawYield;
  const trips = cargoCap > 0 ? Math.ceil(rawYield / cargoCap) : 1;
  const overflow = Math.max(0, rawYield - cargoCap);
  const value = carried * rmcPrice;
  const fullHaulValue = rawYield * rmcPrice;

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(180, 12%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" /> Haul Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Ship className="w-3 h-3" /> Salvage Ship
              </Label>
              <Select value={ship} onValueChange={setShip}>
                <SelectTrigger className="h-8 text-xs font-mono" style={border}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SHIPS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-mono text-muted-foreground">Hulls to Scrape</Label>
              <Input
                type="number"
                min="1"
                value={hulls}
                onChange={(e) => setHulls(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 text-xs font-mono"
                style={border}
              />
            </div>
          </div>

          {rmcPrice === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-mono text-muted-foreground">No RMC market price loaded</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">Run a UEX sync or OCR a terminal</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs space-y-2 p-3 rounded"
              style={{ background: 'hsl(180, 12%, 8%)', border: '1px solid hsl(170, 25%, 18%)' }}
            >
              <Row label="Est. RMC Yield" value={`${rawYield} SCU`} color="text-primary" />
              <Row label="Cargo Capacity" value={cargoCap > 0 ? `${cargoCap} SCU` : 'External (no hold)'} />
              <Row label="Carried per Trip" value={`${carried} SCU`} />
              {overflow > 0 && <Row label="Overflow (needs extra trip)" value={`${overflow} SCU`} color="text-accent" />}
              <Row label="Trips Required" value={`${trips}`} />
              <Row label="Best RMC Sell" value={`${rmcPrice.toFixed(2)} aUEC/SCU`} />
              <div className="flex justify-between pt-3 mt-2 border-t text-lg" style={border}>
                <span className="font-bold text-primary">FULL HAUL VALUE</span>
                <span className="font-bold text-primary xian-glow-subtle">{fullHaulValue.toFixed(0)} aUEC</span>
              </div>
              <p className="text-[9px] text-muted-foreground pt-1">
                Yield estimates are approximate per hull class — actual RMC varies with hull size and condition.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}