import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const SALVAGE_COMMODITIES = ['RMC', 'CMR', 'CMS'];

const border = { borderColor: 'hsl(33, 18%, 18%)' };

function CostInput({ label, value, onChange, suffix }) {
  return (
    <div>
      <Label className="text-[10px] font-mono text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="h-8 text-xs font-mono"
          style={border}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color = 'text-foreground', bold }) {
  return (
    <div className={`flex justify-between pb-2 border-b ${bold ? 'pt-2' : ''}`} style={border}>
      <span className={bold ? 'font-semibold text-primary' : 'text-muted-foreground'}>{label}</span>
      <span className={`${color} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

export default function MarginCalculator({ bestPrices }) {
  const [commodity, setCommodity] = useState('RMC');
  const [quantity, setQuantity] = useState(100);
  const [fuel, setFuel] = useState(0);
  const [repairs, setRepairs] = useState(0);
  const [crewPercent, setCrewPercent] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  const best = bestPrices[commodity];
  const sellPrice = best?.price_sell || 0;

  const grossRevenue = sellPrice * quantity;
  const crewCut = grossRevenue * (crewPercent / 100);
  const fixedCosts = fuel + repairs + otherCost;
  const totalCosts = fixedCosts + crewCut;
  const netProfit = grossRevenue - totalCosts;
  const netPerScu = quantity > 0 ? netProfit / quantity : 0;
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const positive = netProfit >= 0;

  return (
    <div className="p-4 space-y-4">
      <Card className="border bg-transparent" style={{ ...border, background: 'hsl(30, 10%, 8%)' }}>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-mono">Profit Margin Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-mono text-muted-foreground">Commodity</Label>
              <Select value={commodity} onValueChange={setCommodity}>
                <SelectTrigger className="h-8 text-xs font-mono" style={border}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALVAGE_COMMODITIES.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CostInput label="Quantity (SCU)" value={quantity} onChange={setQuantity} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CostInput label="Fuel Cost" value={fuel} onChange={setFuel} suffix="aUEC" />
            <CostInput label="Repairs / Restock" value={repairs} onChange={setRepairs} suffix="aUEC" />
            <CostInput label="Crew Cut" value={crewPercent} onChange={setCrewPercent} suffix="%" />
            <CostInput label="Other Costs" value={otherCost} onChange={setOtherCost} suffix="aUEC" />
          </div>

          {sellPrice === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-mono text-muted-foreground">No market sell price for {commodity}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">Run a UEX sync to load prices</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs space-y-2 p-3 rounded"
              style={{ background: 'hsl(30, 10%, 8%)', border: '1px solid hsl(33, 18%, 18%)' }}
            >
              <Row label="Best Market Sell" value={`${sellPrice.toFixed(2)} aUEC/SCU`} />
              <Row label={`Gross Revenue (${quantity} SCU)`} value={`${grossRevenue.toFixed(2)} aUEC`} color="text-primary" />
              <Row label="Fuel + Repairs + Other" value={`-${fixedCosts.toFixed(2)} aUEC`} color="text-accent" />
              <Row label={`Crew Cut (${crewPercent}%)`} value={`-${crewCut.toFixed(2)} aUEC`} color="text-accent" />
              <Row label="Total Operating Costs" value={`-${totalCosts.toFixed(2)} aUEC`} color="text-accent" />

              <div className="flex justify-between pt-2 border-b" style={border}>
                <span className="text-muted-foreground">Net Profit / SCU</span>
                <span className={positive ? 'text-primary' : 'text-destructive'}>
                  {netPerScu.toFixed(2)} aUEC
                </span>
              </div>

              <div className="flex justify-between pt-3 mt-2 border-t text-lg items-center" style={border}>
                <span className="font-bold text-primary flex items-center gap-1.5">
                  {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  NET PROFIT
                </span>
                <span className={`font-bold ${positive ? 'text-primary xian-glow-subtle' : 'text-destructive'}`}>
                  {netProfit.toFixed(2)} aUEC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className={positive ? 'text-primary' : 'text-destructive'}>
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}