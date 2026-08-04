import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { callsignFor } from '../../shared/callsigns.js';
import { latestSignature, mayProceed } from '../../shared/instruments.js';
import { LIVE_STATES, DEFAULT_COMMISSION_PERCENT, DEFAULT_TERM_DAYS, minimumShelfPrice } from '../../shared/consignment.js';
import { LIVE_STATES as HALL_LIVE } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * A comrade offers the yard something to sell on their behalf.
 *
 * This is the better deal for them and it should be said plainly: consignment keeps the item theirs
 * and sells it at a retail price, where buyback hands them a fraction of market tonight. Buyback
 * exists for the comrade who needs credits now — nobody should drift into it because it was the
 * only door they could find.
 *
 * They set a floor: the least they will take in their own hand. The council prices the shelf above
 * it, never through it.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (fsisRole(user) === 'patron') {
      return Response.json({ error: 'Consignment is for members of the outfit.' }, { status: 403 });
    }

    const body = await req.json();
    const itemName = String(body?.item_name || '').trim();
    if (!itemName) return Response.json({ error: 'Say what you are leaving with us.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;

    // The agreement, if the council has published one. Goods left with somebody on terms nobody can
    // point to is how a favour becomes a grievance.
    const agreements = await svc.instrument.filter({ kind: 'consignment_agreement', active: true }, '-effective_from', 1);
    const agreement = agreements[0] || null;
    let signatureId = '';
    if (agreement) {
      const sigs = await svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 100);
      const mine = latestSignature(sigs, user.id, agreement.id);
      const gate = mayProceed(mine, agreement);
      if (!gate.allowed) {
        return Response.json({ error: gate.reason, instrument_id: agreement.id, instrument_version: agreement.version }, { status: 409 });
      }
      signatureId = mine.id;
    }

    // One item, one live commitment — across the hall, buyback and here alike.
    const lootItemId = String(body?.loot_item_id || '').trim();
    if (lootItemId) {
      const [inHall, inConsignment] = await Promise.all([
        svc.hall_lot.filter({ loot_item_id: lootItemId, status: { $in: HALL_LIVE } }, '-created_date', 3),
        svc.consignment.filter({ loot_item_id: lootItemId, status: { $in: LIVE_STATES } }, '-created_date', 3),
      ]);
      if (inHall.length > 0 || inConsignment.length > 0) {
        return Response.json({ error: 'That item is already committed. One item, one live commitment.' }, { status: 409 });
      }
    }

    const floor = roundAuec(body?.floor_auec);
    const commission = Number(body?.commission_percent) > 0
      ? Math.min(50, Number(body.commission_percent))
      : DEFAULT_COMMISSION_PERCENT;
    const termDays = Number(body?.term_days) > 0 ? Number(body.term_days) : DEFAULT_TERM_DAYS;

    const consignment = await svc.consignment.create({
      item_name: itemName,
      item_type: String(body?.item_type || 'other').trim(),
      condition_grade: String(body?.condition_grade || '').trim(),
      condition_pct: Number(body?.condition_pct) || 0,
      quantity: Math.max(1, Math.floor(Number(body?.quantity) || 1)),
      description: String(body?.description || '').trim(),
      consignor_user_id: user.id,
      consignor_callsign: callsignFor(user),
      floor_auec: floor,
      commission_percent: commission,
      term_days: termDays,
      status: 'proposed',
      loot_item_id: lootItemId,
      agreement_signature_id: signatureId,
    });

    await svc.ops_log.create({
      action: 'consignment.proposed',
      entity_type: 'consignment',
      entity_id: consignment.id,
      entity_name: itemName,
      actor: user.email,
      after: { floor_auec: floor, commission_percent: commission, term_days: termDays },
      notes: 'Offered to the yard to sell on their behalf.',
    });

    return Response.json({
      ok: true,
      consignment,
      minimum_shelf_price_auec: minimumShelfPrice(floor, commission),
      note: floor > 0
        ? `The council will price this above ${minimumShelfPrice(floor, commission).toLocaleString()} aUEC, which is what it takes to leave you ${floor.toLocaleString()} after the ${commission}% cut. It stays yours until it sells, and you can take it back at any time.`
        : `It stays yours until it sells, and you can take it back at any time. You set no floor, so the council will price it as they judge the market.`,
    });
  } catch (error) {
    await reportError(base44, { source: 'proposeConsignment', error, route: 'proposeConsignment' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
