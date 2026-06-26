import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FairShare pricing policy: every commodity-coded product is anchored to the
// current UEX best sell price plus one consistent, published margin.
// "Show the math" — the reference, margin, and timestamp are stored on the product.
const DEFAULT_MARGIN_PERCENT = 8;
const roundPrice = (value) => Math.round((Number(value) || 0) / 100) * 100;

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        let payload = {};
        try { payload = await req.json(); } catch { /* empty body ok */ }
        const marginPercent = typeof payload.margin_percent === 'number' ? payload.margin_percent : DEFAULT_MARGIN_PERCENT;

        const [products, prices] = await Promise.all([
            base44.asServiceRole.entities.product.list(null, 200),
            base44.asServiceRole.entities.commodity_price.list(null, 500),
        ]);

        // Best sell price per commodity code
        const bestByCode = {};
        for (const p of prices) {
            if (!p.commodity_code || !p.price_sell) continue;
            if (!bestByCode[p.commodity_code] || p.price_sell > bestByCode[p.commodity_code].price_sell) {
                bestByCode[p.commodity_code] = p;
            }
        }

        const now = new Date().toISOString();
        const updates = [];
        for (const product of products) {
            const code = (product.code || '').toUpperCase();
            const best = bestByCode[code];
            if (!best) continue;

            const perUnitRef = best.price_sell; // UEX price_sell is per SCU
            const marketRef = roundPrice(perUnitRef);
            const newPrice = roundPrice(perUnitRef * (1 + marginPercent / 100));

            await base44.asServiceRole.entities.product.update(product.id, {
                price_auec: newPrice,
                market_ref_auec: marketRef,
                margin_percent: marginPercent,
                repriced_at: now,
            });
            updates.push({
                code,
                product_name: product.product_name,
                market_ref_auec: marketRef,
                new_price_auec: newPrice,
                best_terminal: best.terminal_name,
            });
        }

        return Response.json({
            repriced: updates.length,
            margin_percent: marginPercent,
            updates,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});