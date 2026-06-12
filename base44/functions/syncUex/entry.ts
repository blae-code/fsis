import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access for manual sync
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKey = Deno.env.get('UEX_API_KEY');
    if (!apiKey) {
      console.log('UEX_API_KEY not configured - skipping sync');
      return Response.json({ 
        status: 'skipped', 
        message: 'UEX_API_KEY secret not configured. Add it in dashboard settings to enable UEX sync.' 
      });
    }

    const UEX_BASE = 'https://api.uexcorp.uk/2.0';
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    };

    // Fetch patch version
    let patchVersion = 'unknown';
    try {
      const gameVersionsRes = await fetch(`${UEX_BASE}/game_versions`, { headers });
      if (gameVersionsRes.ok) {
        const gameVersions = await gameVersionsRes.json();
        patchVersion = gameVersions[0]?.name || 'unknown';
      }
    } catch (e) {
      console.log('Could not fetch game version:', e.message);
    }

    const now = new Date().toISOString();
    const salvageCommodities = ['RMC', 'CMR', 'CMS'];
    
    // Fetch commodity prices
    const pricesRes = await fetch(`${UEX_BASE}/commodities_prices`, { headers });
    if (!pricesRes.ok) {
      throw new Error(`Failed to fetch prices: ${pricesRes.status}`);
    }
    const pricesData = await pricesRes.json();
    
    // Filter for salvage commodities and transform
    const priceRecords = [];
    const bestPricesByCommodity = {};
    
    pricesData.forEach(price => {
      if (salvageCommodities.includes(price.commodity_code)) {
        const record = {
          commodity_name: price.commodity_name,
          commodity_code: price.commodity_code,
          is_salvage_output: true,
          terminal_name: price.terminal_name,
          terminal_code: price.terminal_code,
          star_system: price.star_system,
          price_sell: price.price_sell,
          price_buy: price.price_buy || null,
          is_best_sell: false,
          uex_updated_at: price.uex_updated_at,
          confidence: price.confidence,
          patch_version: patchVersion,
          synced_at: now
        };
        priceRecords.push(record);
        
        // Track best price per commodity
        if (!bestPricesByCommodity[price.commodity_code] || 
            price.price_sell > bestPricesByCommodity[price.commodity_code].price_sell) {
          bestPricesByCommodity[price.commodity_code] = record;
        }
      }
    });

    // Mark best prices
    priceRecords.forEach(record => {
      const best = bestPricesByCommodity[record.commodity_code];
      if (best && record.terminal_code === best.terminal_code) {
        record.is_best_sell = true;
      }
    });

    // Fetch terminals
    const terminalsRes = await fetch(`${UEX_BASE}/terminals`, { headers });
    const terminalsData = terminalsRes.ok ? await terminalsRes.json() : [];
    
    const terminalRecords = terminalsData.map(t => ({
      terminal_name: t.terminal_name,
      terminal_code: t.terminal_code,
      terminal_type: t.terminal_type,
      star_system: t.star_system,
      planet: t.planet,
      moon: t.moon,
      uex_terminal_id: t.id?.toString() || null,
      is_salvage_relevant: salvageCommodities.some(code => 
        terminalsData.some(p => p.terminal_code === t.terminal_code && salvageCommodities.includes(p.commodity_code))
      )
    }));

    // Fetch routes
    const routesRes = await fetch(`${UEX_BASE}/routes`, { headers });
    const routesData = routesRes.ok ? await routesRes.json() : [];
    
    const routeRecords = routesData
      .filter(r => salvageCommodities.includes(r.commodity_code))
      .map(r => ({
        commodity_code: r.commodity_code,
        origin_terminal: r.origin_terminal,
        origin_system: r.origin_system,
        destination_terminal: r.destination_terminal,
        destination_system: r.destination_system,
        profit_per_scu: r.profit_per_scu,
        distance: r.distance,
        score: r.score,
        price_destination_sell: r.price_destination_sell,
        patch_version: patchVersion,
        synced_at: now
      }));

    // Upsert data using bulk operations
    // First, clear existing data for these commodities
    const existingPrices = await base44.asServiceRole.entities.commodity_price.filter({
      commodity_code: { $in: salvageCommodities }
    });
    
    for (const price of existingPrices) {
      await base44.asServiceRole.entities.commodity_price.delete(price.id);
    }

    // Bulk create new prices
    if (priceRecords.length > 0) {
      await base44.asServiceRole.entities.commodity_price.bulkCreate(priceRecords);
    }

    // Upsert terminals (merge with existing)
    for (const terminal of terminalRecords) {
      const existing = await base44.asServiceRole.entities.terminal.filter({ 
        terminal_code: terminal.terminal_code 
      });
      
      if (existing.length > 0) {
        await base44.asServiceRole.entities.terminal.update(existing[0].id, terminal);
      } else {
        await base44.asServiceRole.entities.terminal.create(terminal);
      }
    }

    // Clear and recreate routes
    const existingRoutes = await base44.asServiceRole.entities.route.filter({
      commodity_code: { $in: salvageCommodities }
    });
    
    for (const route of existingRoutes) {
      await base44.asServiceRole.entities.route.delete(route.id);
    }

    if (routeRecords.length > 0) {
      await base44.asServiceRole.entities.route.bulkCreate(routeRecords);
    }

    // Record price history snapshots for trend charting
    const snapshotRecords = salvageCommodities.map(code => {
      const rows = priceRecords.filter(r => r.commodity_code === code);
      if (rows.length === 0) return null;
      const best = bestPricesByCommodity[code];
      const avg = rows.reduce((s, r) => s + (r.price_sell || 0), 0) / rows.length;
      return {
        commodity_code: code,
        best_sell_auec: best?.price_sell || 0,
        avg_sell_auec: Math.round(avg * 100) / 100,
        terminal_name: best?.terminal_name || '',
        patch_version: patchVersion,
        captured_at: now,
      };
    }).filter(Boolean);
    if (snapshotRecords.length > 0) {
      await base44.asServiceRole.entities.price_snapshot.bulkCreate(snapshotRecords);
    }

    return Response.json({
      status: 'success',
      summary: {
        prices_synced: priceRecords.length,
        terminals_synced: terminalRecords.length,
        routes_synced: routeRecords.length,
        patch_version: patchVersion,
        synced_at: now
      }
    });
  } catch (error) {
    console.error('UEX sync error:', error);
    return Response.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
});