import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';
import MarginCalculator from '@/components/apps/salvage/MarginCalculator';
import OcrTerminal from '@/components/apps/salvage/OcrTerminal';
import SignatureScanner from '@/components/apps/salvage/SignatureScanner';
import SalvageAdvisor from '@/components/apps/salvage/SalvageAdvisor';
import HaulPlanner from '@/components/apps/salvage/HaulPlanner';
import SalvageAnalytics from '@/components/apps/salvage/SalvageAnalytics';
import InventoryView from '@/components/apps/salvage/InventoryView';
import CargoScanner from '@/components/apps/salvage/CargoScanner';
import PriceHistory from '@/components/apps/salvage/PriceHistory';
import ScanLog from '@/components/apps/salvage/ScanLog';
import StockTrend from '@/components/apps/salvage/StockTrend';
import HaulBoard from '@/components/apps/salvage/HaulBoard';
import PriceAlerts from '@/components/apps/salvage/PriceAlerts';

const SALVAGE_COMMODITIES = ['RMC', 'CMR', 'CMS'];

export default function SalvageContent() {
  const [activeTab, setActiveTab] = useState('market');
  const [selectedCommodity, setSelectedCommodity] = useState('RMC');
  const [quantity, setQuantity] = useState(1);
  const [selectedTier, setSelectedTier] = useState(null);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const queryClient = useQueryClient();

  // Fetch data
  const { data: prices = [], isLoading: pricesLoading, refetch: refetchPrices } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.route.list(),
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricing_tiers'],
    queryFn: () => base44.entities.pricing_tier.filter({ active: true }),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncUex', {}),
    onSuccess: (data) => {
      setSyncStatus(data);
      queryClient.invalidateQueries({ queryKey: ['commodity_prices'] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setTimeout(() => setSyncStatus(null), 5000);
    },
  });

  // Group prices by commodity
  const pricesByCommodity = prices.reduce((acc, price) => {
    if (!acc[price.commodity_code]) acc[price.commodity_code] = [];
    acc[price.commodity_code].push(price);
    return acc;
  }, {});

  // Get best prices per commodity
  const bestPrices = {};
  Object.keys(pricesByCommodity).forEach(code => {
    const commodityPrices = pricesByCommodity[code];
    const best = commodityPrices.find(p => p.is_best_sell) || 
                 commodityPrices.reduce((max, p) => p.price_sell > max.price_sell ? p : max, commodityPrices[0]);
    if (best) bestPrices[code] = best;
  });

  // Sort routes by profit
  const sortedRoutes = [...routes].sort((a, b) => b.profit_per_scu - a.profit_per_scu).slice(0, 10);

  // Calculate quote
  const calculateQuote = () => {
    if (!selectedTier || !bestPrices[selectedCommodity]) return null;
    
    const uexReferencePrice = bestPrices[selectedCommodity].price_sell;
    const fsisMarginPercent = selectedTier.base_margin_percent;
    const tierDiscountPercent = selectedTier.tier_discount_percent;
    
    const fsisMargin = uexReferencePrice * (fsisMarginPercent / 100);
    const markedUpPrice = uexReferencePrice + fsisMargin;
    const tierDiscount = markedUpPrice * (tierDiscountPercent / 100);
    const perScuPrice = markedUpPrice - tierDiscount;
    const total = perScuPrice * quantity;

    return {
      uexReferencePrice,
      fsisMarginPercent,
      fsisMargin,
      markedUpPrice,
      tier: selectedTier.tier_name,
      tierDiscountPercent,
      tierDiscount,
      perScuPrice,
      quantity,
      total,
    };
  };

  const quote = calculateQuote();

  const copyQuote = () => {
    if (!quote) return;
    const text = `FSIS FairShare Quote — ${selectedCommodity}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UEX Market Reference: ${quote.uexReferencePrice.toFixed(2)} aUEC/unit
FSIS Margin (+${quote.fsisMarginPercent}%): +${quote.fsisMargin.toFixed(2)} aUEC/unit
Subtotal: ${quote.markedUpPrice.toFixed(2)} aUEC/unit
${quote.tier} Discount (-${quote.tierDiscountPercent}%): -${quote.tierDiscount.toFixed(2)} aUEC/unit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Per SCU Price: ${quote.perScuPrice.toFixed(2)} aUEC
TOTAL (${quote.quantity} SCU): ${quote.total.toFixed(2)} aUEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Every credit accounted for."`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSyncTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      {/* Header with sync status */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          <span className="font-mono text-xs text-muted-foreground">
            {syncMutation.isPending ? 'Syncing from UEX...' : syncStatus ? `Synced: ${syncStatus.summary?.prices_synced || 0} prices` : 'Live from UEX'}
          </span>
        </div>
        {user?.role === 'admin' && (
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-mono gap-1.5"
            style={{ borderColor: 'hsl(33, 18%, 18%)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Sync Now
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto flex-nowrap" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <TabsTrigger
            value="market"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            MARKET
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            STOCK
          </TabsTrigger>
          <TabsTrigger
            value="trend"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            TREND
          </TabsTrigger>
          <TabsTrigger
            value="cargo"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            CARGO
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            ALERTS
          </TabsTrigger>
          <TabsTrigger
            value="board"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            BOARD
          </TabsTrigger>
          <TabsTrigger
            value="routes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            ROUTES
          </TabsTrigger>
          <TabsTrigger
            value="quote"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            QUOTE
          </TabsTrigger>
          <TabsTrigger
            value="margin"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            MARGIN
          </TabsTrigger>
          <TabsTrigger
            value="haul"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            HAUL
          </TabsTrigger>
          <TabsTrigger
            value="advisor"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            ADVISOR
          </TabsTrigger>
          <TabsTrigger
            value="ocr"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            OCR
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            SCANNER
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            STATS
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            HISTORY
          </TabsTrigger>
          <TabsTrigger
            value="scanlog"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap"
          >
            LOG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-4">
            {SALVAGE_COMMODITIES.map(code => {
              const commodityPrices = pricesByCommodity[code] || [];
              const best = bestPrices[code];
              
              return (
                <Card key={code} className="border bg-transparent" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-mono flex items-center gap-2">
                      <span className="text-primary">{code}</span>
                      {best && (
                        <Badge variant="outline" className="text-[9px] h-5 border-primary/30 text-primary">
                          Best: {best.price_sell.toFixed(2)} aUEC
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {commodityPrices.length === 0 ? (
                      <div className="text-center py-6">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs font-mono text-muted-foreground">No price data yet</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">
                          Add UEX_API_KEY secret and run sync
                        </p>
                      </div>
                    ) : (
                      commodityPrices.slice(0, 5).map((price, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[10px] font-mono p-2 rounded"
                          style={{ background: price.is_best_sell ? 'hsl(38, 72%, 52%, 0.1)' : 'hsl(30, 10%, 12%)' }}
                        >
                          <div className="flex items-center gap-2">
                            {price.is_best_sell && <Check className="w-3 h-3 text-primary" />}
                            <div>
                              <div className="text-foreground">{price.terminal_name}</div>
                              <div className="text-muted-foreground">{price.star_system}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-primary font-semibold">{price.price_sell.toFixed(2)} aUEC</div>
                            <div className="text-[9px] text-muted-foreground">
                              UEX: {price.uex_updated_at ? new Date(price.uex_updated_at).toLocaleDateString() : 'N/A'}
                              {' • '}
                              Synced: {formatSyncTime(price.synced_at)}
                            </div>
                            {price.confidence && (
                              <div className="text-[9px] text-muted-foreground">Confidence: {price.confidence}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="stock" className="flex-1 overflow-auto m-0">
          <InventoryView bestPrices={bestPrices} />
        </TabsContent>

        <TabsContent value="trend" className="flex-1 overflow-auto m-0">
          <StockTrend />
        </TabsContent>

        <TabsContent value="cargo" className="flex-1 overflow-auto m-0">
          <CargoScanner />
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 overflow-auto m-0">
          <PriceAlerts bestPrices={bestPrices} />
        </TabsContent>

        <TabsContent value="board" className="flex-1 overflow-auto m-0">
          <HaulBoard />
        </TabsContent>

        <TabsContent value="routes" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-2">
            {sortedRoutes.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">No route data available</p>
              </div>
            ) : (
              sortedRoutes.map((route, i) => (
                <Card key={i} className="border bg-transparent" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-foreground">
                          {route.origin_terminal} → {route.destination_terminal}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {route.commodity_code} • {route.distance?.toFixed(0) || 'N/A'} ly • Score: {route.score?.toFixed(0) || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-mono font-semibold">
                          {route.profit_per_scu?.toFixed(2) || 'N/A'} aUEC/SCU
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground">
                          Dest: {route.price_destination_sell?.toFixed(2) || 'N/A'} aUEC
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="quote" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-4">
            <Card className="border bg-transparent" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-mono">FairShare Quote Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground">Commodity</Label>
                    <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                      <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALVAGE_COMMODITIES.map(code => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground">Quantity (SCU)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-8 text-xs font-mono"
                      style={{ borderColor: 'hsl(33, 18%, 18%)' }}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-mono text-muted-foreground">Pricing Tier</Label>
                  <Select 
                    value={selectedTier?.tier_name || ''} 
                    onValueChange={(name) => setSelectedTier(tiers.find(t => t.tier_name === name))}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map(tier => (
                        <SelectItem key={tier.id} value={tier.tier_name}>
                          {tier.tier_name} (+{tier.base_margin_percent}% / -{tier.tier_discount_percent}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {quote && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-mono text-xs space-y-2 p-3 rounded"
                    style={{ background: 'hsl(30, 10%, 8%)', border: '1px solid hsl(33, 18%, 18%)' }}
                  >
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <span className="text-muted-foreground">UEX Market Reference</span>
                      <span className="text-foreground">{quote.uexReferencePrice.toFixed(2)} aUEC/unit</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <span className="text-muted-foreground">FSIS Margin (+{quote.fsisMarginPercent}%)</span>
                      <span className="text-primary">+{quote.fsisMargin.toFixed(2)} aUEC/unit</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{quote.markedUpPrice.toFixed(2)} aUEC/unit</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <span className="text-muted-foreground">{quote.tier} Discount (-{quote.tierDiscountPercent}%)</span>
                      <span className="text-accent">-{quote.tierDiscount.toFixed(2)} aUEC/unit</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold text-primary">Per SCU Price</span>
                      <span className="font-semibold text-primary">{quote.perScuPrice.toFixed(2)} aUEC</span>
                    </div>
                    <div className="flex justify-between pt-3 mt-2 border-t text-lg" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                      <span className="font-bold text-primary">TOTAL ({quote.quantity} SCU)</span>
                      <span className="font-bold text-primary xian-glow-subtle">{quote.total.toFixed(2)} aUEC</span>
                    </div>

                    <Button
                      onClick={copyQuote}
                      variant="outline"
                      size="sm"
                      className="w-full mt-4 font-mono text-xs gap-2"
                      style={{ borderColor: 'hsl(33, 18%, 18%)' }}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Quote'}
                    </Button>
                  </motion.div>
                )}

                {!selectedTier && (
                  <div className="text-center py-4 text-muted-foreground font-mono text-xs">
                    Select a pricing tier to calculate your FairShare quote
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="margin" className="flex-1 overflow-auto m-0">
          <MarginCalculator bestPrices={bestPrices} />
        </TabsContent>

        <TabsContent value="haul" className="flex-1 overflow-auto m-0">
          <HaulPlanner bestPrices={bestPrices} />
        </TabsContent>

        <TabsContent value="advisor" className="flex-1 overflow-auto m-0">
          <SalvageAdvisor />
        </TabsContent>

        <TabsContent value="ocr" className="flex-1 overflow-auto m-0">
          <OcrTerminal />
        </TabsContent>

        <TabsContent value="scanner" className="flex-1 overflow-auto m-0">
          <SignatureScanner />
        </TabsContent>

        <TabsContent value="stats" className="flex-1 overflow-auto m-0">
          <SalvageAnalytics bestPrices={bestPrices} />
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto m-0">
          <PriceHistory />
        </TabsContent>

        <TabsContent value="scanlog" className="flex-1 overflow-auto m-0">
          <ScanLog />
        </TabsContent>
      </Tabs>

      {/* Footer disclaimer */}
      <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 6%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground">
          Prices are crowdsourced via UEX and may lag the live server — always verify in game. Unofficial fan project, not affiliated with Cloud Imperium Games.
        </p>
      </div>
    </div>
  );
}