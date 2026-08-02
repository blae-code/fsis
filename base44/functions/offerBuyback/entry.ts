import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { LIVE_STATES } from '../../shared/hall.js';
import { roundAuec, percentOfAuec } from '../../shared/money.js';
import { notify } from '../../shared/notices.js';

/** An offer stands this long unless the council says otherwise. */
const DEFAULT_VALID_HOURS = 72;
const MAX_VALID_HOURS = 24 * 14;

/**
 * FSIS offers to buy a member's gear outright.
 *
 * Stated plainly as what it is: stock bought for resale, at an openly-declared fraction of what the
 * market is paying. The fraction is a field rather than arithmetic hidden inside a number, because a
 * member deciding between the hall and a quick sale deserves to see exactly what the convenience is
 * costing them — and if the fraction is one we would be embarrassed to show, that is a fact about
 * the fraction.
 *
 * The market figure used is recorded with its source. An offer checked a month later should be
 * checkable against the market as it stood at appraisal, not as it stands now.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to appraise.' }, { status: 403 });
    }

    const body = await req.json();
    const itemName = String(body?.item_name || '').trim();
    const sellerId = String(body?.seller_user_id || '').trim();
    if (!itemName) return Response.json({ error: 'Say what is being bought.' }, { status: 400 });
    if (!sellerId) return Response.json({ error: 'seller_user_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const seller = await svc.User.get(sellerId).catch(() => null);
    if (!seller) return Response.json({ error: 'No such comrade.' }, { status: 404 });

    // One item, one live commitment — the same guard the hall uses.
    const lootItemId = String(body?.loot_item_id || '').trim();
    if (lootItemId) {
      const inHall = await svc.hall_lot.filter({ loot_item_id: lootItemId, status: { $in: LIVE_STATES } }, '-created_date', 5);
      if (inHall.length > 0) {
        return Response.json({
          error: 'That item is live in the hall. It cannot be offered to buyback at the same time — one item, one live commitment.',
          lot_id: inHall[0].id,
        }, { status: 409 });
      }
    }

    const market = roundAuec(body?.market_reference_auec);
    const rawFraction = Number(body?.fraction_percent);
    const fraction = Number.isFinite(rawFraction) && rawFraction > 0 && rawFraction <= 100 ? rawFraction : 60;
    const stated = roundAuec(body?.offer_auec);
    // Where the council states a figure, that stands; otherwise it follows from the fraction, so
    // the arithmetic on the page always closes.
    const offer = stated > 0 ? stated : percentOfAuec(market, fraction);

    if (offer <= 0) {
      return Response.json({ error: 'An offer of nothing is not an offer. State a figure, or a market reference to take a fraction of.' }, { status: 400 });
    }

    const hours = Number(body?.valid_hours);
    const validFor = Number.isFinite(hours) && hours > 0 && hours <= MAX_VALID_HOURS ? Math.floor(hours) : DEFAULT_VALID_HOURS;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validFor * 3600000);

    const offerRecord = await svc.buyback_offer.create({
      item_name: itemName,
      item_type: String(body?.item_type || 'other').trim(),
      condition_grade: String(body?.condition_grade || '').trim(),
      condition_pct: Number(body?.condition_pct) || 0,
      quantity: Math.max(1, Math.floor(Number(body?.quantity) || 1)),
      seller_user_id: sellerId,
      seller_handle: seller.handle || seller.email,
      market_reference_auec: market,
      market_reference_source: String(body?.market_reference_source || '').trim(),
      fraction_percent: fraction,
      offer_auec: offer,
      expires_at: expiresAt.toISOString(),
      status: 'offered',
      appraised_by_email: user.email,
      appraisal_notes: String(body?.appraisal_notes || '').trim(),
      evidence_image_url: String(body?.evidence_image_url || '').trim(),
      loot_item_id: lootItemId,
    });

    await notify(base44, {
      recipient_user_id: sellerId,
      recipient_handle: seller.handle,
      kind: 'order_update',
      title: `An offer for your ${itemName}`,
      body: [
        `FSIS offers ${offer.toLocaleString()} aUEC for this.`,
        market > 0
          ? `That is ${fraction}% of the ${market.toLocaleString()} aUEC the market was paying when it was appraised${offerRecord.market_reference_source ? ` (${offerRecord.market_reference_source})` : ''}.`
          : `The fraction offered is ${fraction}% of market.`,
        'This is stock bought for resale, and the fraction is stated rather than hidden inside the number. You will very likely get more selling it yourself in the hall — what you are being offered here is the certainty and the speed.',
        offerRecord.appraisal_notes,
        `The offer stands until ${expiresAt.toISOString().slice(0, 16).replace('T', ' ')} UTC. Market prices move, so it cannot stand indefinitely.`,
      ].filter(Boolean).join('\n\n'),
      source_type: 'buyback_offer',
      source_id: offerRecord.id,
      source_name: itemName,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: 'buyback.offered',
      entity_type: 'buyback_offer',
      entity_id: offerRecord.id,
      entity_name: itemName,
      actor: user.email,
      after: { offer_auec: offer, fraction_percent: fraction, market_reference_auec: market, expires_at: expiresAt.toISOString() },
      notes: offerRecord.appraisal_notes || `Appraised by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, offer: offerRecord, expires_at: expiresAt.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
