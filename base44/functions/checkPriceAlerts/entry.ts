import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot market watch: runs on a schedule after UEX price syncs. Compares the
// best cached sell price per commodity against armed price alerts; when a
// threshold is crossed, marks the alert triggered and emails the alert owner.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const alerts = await base44.asServiceRole.entities.price_alert.filter({ status: 'armed' }, '-created_date', 100);
    if (alerts.length === 0) {
      return Response.json({ checked: 0, triggered: 0 });
    }

    // Build best sell price per commodity from the UEX cache
    const prices = await base44.asServiceRole.entities.commodity_price.list('-price_sell', 1000);
    const best = {};
    for (const p of prices) {
      if (!p.commodity_code || !(p.price_sell > 0)) continue;
      if (!best[p.commodity_code] || p.price_sell > best[p.commodity_code].price_sell) {
        best[p.commodity_code] = p;
      }
    }

    let triggered = 0;
    for (const alert of alerts) {
      const market = best[(alert.commodity_code || '').toUpperCase()];
      if (!market) continue;

      const hit = alert.direction === 'below'
        ? market.price_sell <= alert.target_price_auec
        : market.price_sell >= alert.target_price_auec;
      if (!hit) continue;

      await base44.asServiceRole.entities.price_alert.update(alert.id, {
        status: 'triggered',
        triggered_price: market.price_sell,
        triggered_terminal: market.terminal_name || '',
        triggered_at: new Date().toISOString(),
      });
      triggered++;

      if (alert.notify_email !== false && alert.created_by) {
        const dirWord = alert.direction === 'below' ? 'dropped below' : 'hit';
        const commodityLabel = market.commodity_name ? `${market.commodity_name} (${alert.commodity_code})` : alert.commodity_code;
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'FSIS.bot Market Watch',
          to: alert.created_by,
          subject: `⚠ ${alert.commodity_code} ${dirWord} ${alert.target_price_auec.toLocaleString()} aUEC — market alert`,
          body: [
            `FSIS.bot MARKET ALERT — ${commodityLabel}`,
            ``,
            `Best sell price ${dirWord} your target of ${alert.target_price_auec.toLocaleString()} aUEC.`,
            ``,
            `Current best: ${market.price_sell.toLocaleString()} aUEC/unit`,
            `Terminal: ${market.terminal_name || 'Unknown'}${market.star_system ? ` — ${market.star_system}` : ''}`,
            `Patch: ${market.patch_version || 'unknown'}`,
            ``,
            `Open the Salvage app → ALERTS tab to re-arm or delete this alert.`,
            ``,
            `"Every credit accounted for."`,
          ].join('\n'),
        });
      }
      console.log(`Alert ${alert.id} triggered: ${alert.commodity_code} @ ${market.price_sell}`);
    }

    return Response.json({ checked: alerts.length, triggered });
  } catch (error) {
    console.error('checkPriceAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});