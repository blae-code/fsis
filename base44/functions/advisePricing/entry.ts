import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { roundPrice } from '../../shared/money.js';

/**
 * The pricing desk's reading. It gathers what is actually known — market reference,
 * present price, stock on hand, what has sold, what buyers have asked to be restocked —
 * and proposes a price per ware with the reasoning stated in plain words.
 *
 * It never writes a price. Nothing changes until the proprietor approves it, because a
 * price a buyer cannot have explained to them is a price the yard cannot defend.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: council access required' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch { /* empty body is fine */ }
    const floorMargin = Number.isFinite(payload.floor_margin_percent) ? payload.floor_margin_percent : 5;
    const stance = ['clear_stock', 'balanced', 'hold_value'].includes(payload.stance) ? payload.stance : 'balanced';
    const only = Array.isArray(payload.product_ids) ? payload.product_ids : null;

    const [products, prices, orders, restocks] = await Promise.all([
      base44.asServiceRole.entities.product.list('-updated_date', 200),
      base44.asServiceRole.entities.commodity_price.list('-updated_date', 500),
      base44.asServiceRole.entities.order.list('-created_date', 120),
      base44.asServiceRole.entities.restock_notify.filter({ reserve_status: 'open' }, '-created_date', 120),
    ]);

    const wares = (only ? products.filter((p) => only.includes(p.id)) : products).slice(0, 60);
    if (!wares.length) return Response.json({ proposals: [], note: 'No wares in the catalogue to price.' });

    /** Best market sell price per commodity code, so a proposal has something to sit against. */
    const bestByCode = {};
    for (const p of prices) {
      const code = String(p.commodity_code || '').toUpperCase();
      if (!code || !p.price_sell) continue;
      if (!bestByCode[code] || p.price_sell > bestByCode[code].price_sell) bestByCode[code] = p;
    }

    /** What has actually sold, and what buyers have asked for and not got. */
    const sold = {};
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      for (const line of o.items || []) {
        const key = String(line.product_name || '').toLowerCase();
        if (!key) continue;
        sold[key] = (sold[key] || 0) + (Number(line.quantity) || 0);
      }
    }
    const wanted = {};
    for (const r of restocks) {
      const key = String(r.product_name || '').toLowerCase();
      if (!key) continue;
      wanted[key] = (wanted[key] || 0) + (Number(r.desired_quantity) || 1);
    }

    const rows = wares.map((p) => {
      const code = String(p.code || '').toUpperCase();
      const best = bestByCode[code];
      const key = String(p.product_name || '').toLowerCase();
      return {
        id: p.id,
        product_name: p.product_name,
        code: code || null,
        category: p.category,
        condition_grade: p.condition_grade || null,
        condition_pct: p.condition_pct ?? null,
        unit: p.unit || 'SCU',
        stock: Number(p.stock || 0),
        current_price_auec: Number(p.price_auec || 0),
        market_ref_auec: best ? roundPrice(best.price_sell) : Number(p.market_ref_auec || 0) || null,
        best_terminal: best?.terminal_name || null,
        units_sold_recently: sold[key] || 0,
        units_awaiting_restock: wanted[key] || 0,
        repriced_at: p.repriced_at || null,
      };
    });

    const advice = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the pricing desk of FSIS, a small Star Citizen salvage co-operative that sells to players in aUEC.
Propose a price per ware. The house rule is transparency: every proposal must carry a reason a buyer could be shown without embarrassment.

Rules you must follow:
- Where a market reference exists, the proposed price must be at least the reference plus ${floorMargin}% — the yard does not sell below its own floor.
- Where no market reference exists (looted gear, components, fabricated goods), reason from condition, stock on hand, and demand instead, and say so.
- Stance is "${stance}": clear_stock leans on moving idle stock, hold_value leans on protecting margin, balanced sits between.
- Heavy stock with no recent sales argues for a lower price. Buyers waiting on restock, or thin stock, argues for a higher one.
- Round every proposed price to the nearest 100 aUEC.
- confidence: high when a fresh market reference and real sales back the figure, low when you are largely guessing.
- reason: one plain sentence, no jargon, naming the actual evidence (e.g. "12 SCU sat unsold for a week against a market reference of 4,200").

The catalogue, with everything known about each ware:
${JSON.stringify(rows)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          proposals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                proposed_price_auec: { type: 'number' },
                margin_percent: { type: 'number' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                reason: { type: 'string' },
                signal: { type: 'string', enum: ['raise', 'hold', 'lower'] },
              },
              required: ['id', 'proposed_price_auec', 'reason'],
            },
          },
          summary: { type: 'string' },
        },
        required: ['proposals'],
      },
    });

    const byId = {};
    for (const r of rows) byId[r.id] = r;
    const proposals = (advice.proposals || [])
      .filter((p) => byId[p.id])
      .map((p) => {
        const row = byId[p.id];
        const floor = row.market_ref_auec ? roundPrice(row.market_ref_auec * (1 + floorMargin / 100)) : 0;
        const proposed = Math.max(roundPrice(p.proposed_price_auec), floor);
        const delta = row.current_price_auec ? Math.round(((proposed - row.current_price_auec) / row.current_price_auec) * 1000) / 10 : 0;
        return {
          ...row,
          proposed_price_auec: proposed,
          floor_auec: floor || null,
          delta_percent: delta,
          margin_percent: row.market_ref_auec ? Math.round(((proposed - row.market_ref_auec) / row.market_ref_auec) * 1000) / 10 : (p.margin_percent ?? null),
          confidence: p.confidence || 'medium',
          signal: p.signal || (delta > 1 ? 'raise' : delta < -1 ? 'lower' : 'hold'),
          reason: p.reason,
          clamped: floor > roundPrice(p.proposed_price_auec),
        };
      });

    return Response.json({
      stance,
      floor_margin_percent: floorMargin,
      considered: rows.length,
      summary: advice.summary || null,
      proposals,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}