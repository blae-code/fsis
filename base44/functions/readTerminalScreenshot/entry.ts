import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const MAT_CATS = ['salvage_output', 'raw_ore', 'refined_metal', 'component', 'fuel_gas', 'other'];
const LEDGER_CATS = ['salvage_sale', 'order_fulfillment', 'hauling', 'fuel', 'repairs', 'fees_fines', 'equipment', 'crew_pay', 'ship_rental', 'other'];

/**
 * One reader for any in-game screen worth recording: a trade terminal, an inventory or hold
 * listing, or a transaction/wallet screen. It reads and it compares against what is already
 * on the books — it writes nothing. Every proposal goes back for a human to correct first,
 * because a misread price silently repriced is worse than a price nobody entered.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Council standing required.' }, { status: 403 });

    const body = await req.json();
    const imageUrl = String(body?.image_url || '').trim();
    if (!imageUrl) return Response.json({ error: 'Attach a screenshot first.' }, { status: 400 });

    const read = await base44.integrations.Core.InvokeLLM({
      prompt: `You are reading a screenshot from Star Citizen for a salvage and trading outfit's records. Decide what the screen is and extract only what you can actually read.

Screen kinds:
- trade_terminal: a commodity buy/sell terminal. Extract every commodity row as a material: name, short code (RMC, CMR, CMS, QUAN, etc.), the price per unit shown, and the unit.
- inventory: a hold, local inventory, or personal storage listing. Extract each item as a material with its quantity.
- transaction: a wallet, receipt, payout, refuel, repair or fine screen. Extract each money movement as a ledger line: whether it is money in (income) or money out (expense), the amount in aUEC, what it was for, and the wallet balance afterwards if shown.
- other: anything else — read what numbers and names you can.

Material categories: ${MAT_CATS.join(', ')}. Ledger categories: ${LEDGER_CATS.join(', ')}.
Omit any value you cannot read rather than guessing. Never invent a price or an amount.`,
      file_urls: [imageUrl],
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['trade_terminal', 'inventory', 'transaction', 'other'] },
          station: { type: 'string' },
          summary: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          materials: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                material_name: { type: 'string' },
                code: { type: 'string' },
                category: { type: 'string', enum: MAT_CATS },
                unit: { type: 'string' },
                ref_value_auec: { type: 'number' },
                quantity: { type: 'number' },
              },
              required: ['material_name'],
            },
          },
          ledger: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entry_type: { type: 'string', enum: ['income', 'expense'] },
                category: { type: 'string', enum: LEDGER_CATS },
                amount_auec: { type: 'number' },
                description: { type: 'string' },
                counterparty: { type: 'string' },
                balance_after: { type: 'number' },
              },
              required: ['entry_type', 'amount_auec'],
            },
          },
        },
        required: ['kind', 'confidence'],
      },
    });

    // Compare against the catalogue we already keep, so the desk can say plainly what is new,
    // what merely moved in price, and what already agrees with the books.
    const known = await base44.asServiceRole.entities.material.list('material_name', 400);
    const materials = (read.materials || [])
      .filter((m) => m.material_name)
      .map((m) => {
        const match = known.find((k) => norm(k.material_name) === norm(m.material_name))
          || (m.code ? known.find((k) => norm(k.code) === norm(m.code)) : null);
        const price = Number(m.ref_value_auec) > 0 ? Math.round(Number(m.ref_value_auec)) : null;
        const onBook = match && Number(match.ref_value_auec) > 0 ? Math.round(Number(match.ref_value_auec)) : null;
        return {
          material_name: match?.material_name || m.material_name,
          code: m.code || match?.code || '',
          category: MAT_CATS.includes(m.category) ? m.category : (match?.category || 'other'),
          unit: m.unit || match?.unit || 'SCU',
          ref_value_auec: price,
          quantity: Number(m.quantity) > 0 ? Number(m.quantity) : null,
          existing_id: match?.id || null,
          on_book_value: onBook,
          delta: price !== null && onBook !== null ? price - onBook : null,
        };
      });

    const ledger = (read.ledger || [])
      .filter((l) => Number(l.amount_auec) > 0)
      .map((l) => ({
        entry_type: l.entry_type === 'income' ? 'income' : 'expense',
        category: LEDGER_CATS.includes(l.category) ? l.category : 'other',
        amount_auec: Math.round(Number(l.amount_auec)),
        description: String(l.description || 'Read from a screenshot').trim(),
        counterparty: String(l.counterparty || read.station || '').trim(),
        balance_after: Number(l.balance_after) > 0 ? Math.round(Number(l.balance_after)) : null,
      }));

    return Response.json({
      ok: true,
      kind: read.kind,
      station: read.station || '',
      summary: read.summary || '',
      confidence: read.confidence,
      materials,
      ledger,
      counts: {
        materials: materials.length,
        new_materials: materials.filter((m) => !m.existing_id).length,
        repriced: materials.filter((m) => m.delta !== null && m.delta !== 0).length,
        ledger: ledger.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}