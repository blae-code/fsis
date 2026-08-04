import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The member accepts or declines the offer.
 *
 * Accepting creates the stock record and passes ownership under the buyback release, so the item can
 * be followed from a comrade's hold to the shelf. Declining costs nothing and is recorded as the
 * ordinary outcome it is — a member who holds out for a better price in the hall has done exactly
 * what the hall is for.
 *
 * An expired offer cannot be accepted, and says so rather than quietly honouring a price that has
 * stopped making sense.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const offerId = String(body?.offer_id || '').trim();
    const decision = String(body?.decision || '').trim();
    if (!offerId) return Response.json({ error: 'offer_id is required.' }, { status: 400 });
    if (!['accept', 'decline'].includes(decision)) {
      return Response.json({ error: "decision must be 'accept' or 'decline'." }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const offer = await svc.buyback_offer.get(offerId);
    if (!offer) return Response.json({ error: 'No such offer.' }, { status: 404 });
    if (offer.seller_user_id !== user.id) {
      return Response.json({ error: 'That offer was not made to you.' }, { status: 403 });
    }
    if (offer.status !== 'offered') {
      return Response.json({ error: `That offer is already ${offer.status}.` }, { status: 409 });
    }

    const now = new Date();
    if (offer.expires_at && new Date(offer.expires_at) <= now) {
      await svc.buyback_offer.update(offerId, { status: 'expired' });
      return Response.json({
        error: 'That offer has expired. Ask the council to appraise it again — market prices move, and honouring a stale figure would mean one of us being short.',
      }, { status: 409 });
    }

    // Claim it, so a double submission cannot create two stock records for one item.
    const claim = await svc.buyback_offer.updateMany(
      { id: offerId, status: 'offered' },
      { $set: { status: decision === 'accept' ? 'accepted' : 'declined', responded_at: now.toISOString() } },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That offer was just answered elsewhere.' }, { status: 409 });
    }

    let lootItemId = offer.loot_item_id || '';

    if (decision === 'accept') {
      // Into stock, so it can be followed from a comrade's hold to the shelf.
      if (!lootItemId) {
        const loot = await svc.loot_item.create({
          item_name: offer.item_name,
          item_type: offer.item_type,
          condition_grade: offer.condition_grade,
          condition_pct: offer.condition_pct,
          quantity: offer.quantity || 1,
          crew_handle: offer.seller_handle,
          source_op: `Buyback from ${offer.seller_handle}`,
          status: 'held',
          est_sell_auec: offer.market_reference_auec || 0,
          // What we paid, as a FIELD. It used to live only inside the sentence below, which meant
          // the yard could not tell whether it made money on anything without reading prose.
          acquisition_cost_auec: Number(offer.offer_auec) || 0,
          acquisition_source: 'buyback',
          acquired_at: now.toISOString(),
          notes: `Bought back for ${Number(offer.offer_auec).toLocaleString()} aUEC at ${offer.fraction_percent}% of a ${Number(offer.market_reference_auec).toLocaleString()} market reference.`,
        });
        lootItemId = loot.id;
        await svc.buyback_offer.update(offerId, { loot_item_id: lootItemId });
      }

      // What the collective paid, recorded as the purchase it is.
      await svc.ledger_entry.create({
        entry_type: 'expense',
        category: 'stock_purchase',
        amount_auec: Number(offer.offer_auec) || 0,
        counterparty: offer.seller_handle,
        description: `Buyback — ${offer.item_name} from ${offer.seller_handle}`,
        entry_date: now.toISOString().slice(0, 10),
        source: 'automation',
      });
    }

    await svc.ops_log.create({
      action: `buyback.${decision}ed`,
      entity_type: 'buyback_offer',
      entity_id: offerId,
      entity_name: offer.item_name,
      actor: user.email,
      before: { status: 'offered' },
      after: { status: decision === 'accept' ? 'accepted' : 'declined', loot_item_id: lootItemId },
      notes: decision === 'accept'
        ? `Accepted at ${Number(offer.offer_auec).toLocaleString()} aUEC.`
        : 'Declined.',
    });

    await notify(base44, {
      recipient_user_id: user.id,
      recipient_handle: user.handle,
      kind: 'order_update',
      title: decision === 'accept'
        ? `Buyback agreed: ${offer.item_name}`
        : `Offer declined: ${offer.item_name}`,
      body: decision === 'accept'
        ? [
          `${Number(offer.offer_auec).toLocaleString()} aUEC is owed to you for this, and the item passes to FSIS under the buyback release.`,
          'Payment happens in-game like everything else — the council will settle with you directly and record it when it lands.',
          'It goes into stock from here and on to the storefront. What it eventually sells for does not change what you were offered; you took the certainty, and that was the deal.',
        ].join('\n\n')
        : [
          'You have declined the offer, which costs you nothing and is recorded as the ordinary thing it is.',
          'The item is still yours. If you would rather take your chances on a better price, the hall is there — that is what it is for.',
        ].join('\n\n'),
      source_type: 'buyback_offer',
      source_id: offerId,
      source_name: offer.item_name,
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    });

    return Response.json({ ok: true, decision, loot_item_id: lootItemId });
  } catch (error) {
    await reportError(base44, { source: 'respondToBuyback', error, route: 'respondToBuyback' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
