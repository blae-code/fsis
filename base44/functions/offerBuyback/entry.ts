import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { LIVE_STATES } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { appraise, appraisalBasis, standingBonusFor } from '../../shared/buyback.js';
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

    // The appraisal, reckoned HERE rather than in a form. Condition factors and the standing bonus
    // are pricing policy: a factor typed into a component is a rule nobody voted on, that nothing
    // records, and that cannot be explained when a member asks why their offer was what it was.
    const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1));
    const market = roundAuec(body?.market_reference_auec);
    const appraisal = appraise({
      // A market reference may be given per item or as a total; per item is the useful form.
      market_each_auec: Number(body?.market_each_auec) > 0
        ? Number(body.market_each_auec)
        : (quantity > 0 ? market / quantity : market),
      quantity,
      base_fraction_percent: Number(body?.base_fraction_percent) || Number(body?.fraction_percent) || undefined,
      condition_key: String(body?.condition_key || '').trim(),
      // Drawn from the seller's LABOUR standing, never from a storefront buyer pricing tier —
      // what a buyer pays for a product and what we pay a seller for their gear are unrelated.
      standing_bonus_percent: body?.ignore_standing === true ? 0 : standingBonusFor(seller),
    });

    const stated = roundAuec(body?.offer_auec);
    // A council member may still state a figure outright, and that stands — but then the fraction
    // recorded is the one that figure ACTUALLY represents, not the headline rate. Telling a member
    // "60% of market" while paying them 48% would break the one rule this feature rests on.
    const offer = stated > 0 ? stated : appraisal.offer_auec;
    const effectiveFraction = stated > 0 && appraisal.market_total_auec > 0
      ? Math.round((stated / appraisal.market_total_auec) * 100)
      : appraisal.fraction_percent;

    if (offer <= 0) {
      return Response.json({ error: 'An offer of nothing is not an offer. State a figure, or a market reference to take a fraction of.' }, { status: 400 });
    }

    const basis = stated > 0
      ? (appraisal.market_total_auec > 0
        ? `Stated outright at ${offer.toLocaleString()} aUEC, which is ${effectiveFraction}% of the ${appraisal.market_total_auec.toLocaleString()} aUEC market reference.`
        : 'Stated outright rather than reckoned from a market figure.')
      : appraisalBasis(appraisal);

    const hours = Number(body?.valid_hours);
    const validFor = Number.isFinite(hours) && hours > 0 && hours <= MAX_VALID_HOURS ? Math.floor(hours) : DEFAULT_VALID_HOURS;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validFor * 3600000);

    const offerRecord = await svc.buyback_offer.create({
      item_name: itemName,
      item_type: String(body?.item_type || 'other').trim(),
      condition_grade: String(body?.condition_grade || '').trim(),
      condition_pct: Number(body?.condition_pct) || 0,
      quantity,
      seller_user_id: sellerId,
      seller_handle: seller.handle || seller.email,
      market_reference_auec: market || appraisal.market_total_auec,
      market_reference_source: String(body?.market_reference_source || '').trim(),
      // The fraction recorded is the one the member ACTUALLY gets.
      fraction_percent: effectiveFraction,
      base_fraction_percent: appraisal.base_fraction_percent,
      condition_key: appraisal.condition_key,
      condition_factor: appraisal.condition_factor,
      standing_bonus_percent: appraisal.standing_bonus_percent,
      basis,
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
        `${basis}${offerRecord.market_reference_source ? ` Market figure from ${offerRecord.market_reference_source}.` : ''}`,
        appraisal.standing_bonus_percent > 0
          ? `The ${appraisal.standing_bonus_percent} points for standing are yours because of labour you have already given. The collective returns value to those who make it.`
          : '',
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
      after: { offer_auec: offer, fraction_percent: effectiveFraction, base_fraction_percent: appraisal.base_fraction_percent, condition_key: appraisal.condition_key, standing_bonus_percent: appraisal.standing_bonus_percent, expires_at: expiresAt.toISOString() },
      notes: offerRecord.appraisal_notes || `Appraised by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, offer: offerRecord, expires_at: expiresAt.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
