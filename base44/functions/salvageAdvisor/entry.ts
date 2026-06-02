import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// AI strategy agent: analyzes live UEX salvage prices + the operator's current cargo
// and recommends where/what to sell for maximum return.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const cargo = body.cargo || {}; // { RMC: scu, CMR: scu, CMS: scu }
    const homeSystem = body.home_system || user.home_system || null;

    const salvageCodes = ['RMC', 'CMR', 'CMS'];
    const prices = await base44.entities.commodity_price.filter({
      commodity_code: { $in: salvageCodes },
    });

    // Compact the market into the top few terminals per commodity to keep the prompt lean
    const byCode = {};
    for (const p of prices) {
      (byCode[p.commodity_code] ||= []).push({
        terminal: p.terminal_name,
        system: p.star_system,
        sell: p.price_sell,
      });
    }
    for (const code of Object.keys(byCode)) {
      byCode[code] = byCode[code].sort((a, b) => b.sell - a.sell).slice(0, 5);
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are FSIS Salvage Advisor, an expert Star Citizen salvage logistics AI. Based on the live market below and the operator's current cargo, recommend the optimal selling strategy.

Operator home system: ${homeSystem || 'unknown'}
Current cargo (SCU): ${JSON.stringify(cargo)}

Live salvage market (top terminals per commodity, aUEC/unit):
${JSON.stringify(byCode, null, 2)}

Give: (1) a short headline recommendation, (2) per-commodity best terminal + expected total aUEC for the cargo held, (3) a single optimal sell route if one terminal/system covers multiple commodities well, and (4) one concise tactical tip. Be specific and numeric. If there is no price data, say so plainly.`,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                best_terminal: { type: 'string' },
                system: { type: 'string' },
                price_sell: { type: 'number' },
                expected_total: { type: 'number' },
              },
            },
          },
          optimal_route: { type: 'string' },
          tip: { type: 'string' },
          grand_total: { type: 'number' },
        },
        required: ['headline'],
      },
    });

    return Response.json({ status: 'success', ...result });
  } catch (error) {
    console.error('salvageAdvisor error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});