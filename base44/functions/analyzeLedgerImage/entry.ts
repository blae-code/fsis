import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { image_url } = await req.json();
        if (!image_url) {
            return Response.json({ error: 'image_url is required' }, { status: 400 });
        }

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an OCR/data-extraction system for Star Citizen financial screenshots.
Analyze this in-game screenshot. It may show: a mobiGlas wallet/balance screen, a commodity terminal sale receipt, a transaction history list, a mission payout notification, refinery/repair/refuel fees, or any other aUEC credit movement.

Extract every distinct aUEC transaction visible:
- entry_type: "income" if credits were received, "expense" if credits were spent
- category: best fit from: salvage_sale, order_fulfillment, hauling, fuel, repairs, fees_fines, equipment, crew_pay, ship_rental, other
- amount_auec: positive number (the transaction amount, NOT the wallet balance)
- description: short human-readable description of what the transaction was
- counterparty: terminal, shop, NPC, or entity on the other side, if visible
- entry_date: date in YYYY-MM-DD if visible on screen, otherwise omit

Also report:
- wallet_balance: the current aUEC wallet balance if shown on screen, else null
- summary: 1-2 sentence description of what the screenshot shows
- confidence: "high", "medium" or "low" based on legibility

Only extract transactions you can actually read. Do not invent values.`,
            file_urls: [image_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    transactions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                entry_type: { type: 'string', enum: ['income', 'expense'] },
                                category: { type: 'string' },
                                amount_auec: { type: 'number' },
                                description: { type: 'string' },
                                counterparty: { type: 'string' },
                                entry_date: { type: 'string' }
                            }
                        }
                    },
                    wallet_balance: { type: ['number', 'null'] },
                    summary: { type: 'string' },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
            }
        });

        return Response.json(result);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});