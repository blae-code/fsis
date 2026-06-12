import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI vision + OCR for aUEC financial records: mobiGlas wallet/transaction screens,
// commodity sell receipts, kiosk purchase confirmations, fines, etc.
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
      prompt: `You are an OCR and data-extraction engine for a Star Citizen business's financial ledger. This screenshot shows an in-game aUEC transaction record — it could be a mobiGlas wallet/transaction history, a commodity terminal sell receipt, a purchase/rental kiosk confirmation, a fine notice, or a player-to-player transfer.

Extract every distinct aUEC transaction you can read. For each transaction determine:
- entry_type: "income" if credits were received, "expense" if credits were spent
- category: best fit from exactly this list: salvage_sale, order_fulfillment, hauling, fuel, repairs, fees_fines, equipment, crew_pay, ship_rental, other
- amount_auec: the positive aUEC amount
- description: a short human-readable label, e.g. "RMC sale at TDD Orison"
- counterparty: terminal, shop, NPC, or player handle involved if visible
- entry_date: date in YYYY-MM-DD if visible on screen, otherwise omit

Also read the wallet balance shown on screen (wallet_balance), if visible.
Provide a concise summary and a confidence rating. If you cannot read a value, omit it rather than guessing.`,
      file_urls: [image_url],
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          wallet_balance: { type: 'number' },
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
                entry_date: { type: 'string' },
              },
              required: ['entry_type', 'amount_auec'],
            },
          },
        },
        required: ['summary', 'confidence'],
      },
    });

    return Response.json({ status: 'success', ...result });
  } catch (error) {
    console.error('analyzeLedgerImage error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});