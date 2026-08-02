import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyMany } from '../../shared/notices.js';

/**
 * Offers that have run their course.
 *
 * An offer that never expires is one the collective can be held to at a price that has stopped
 * making sense — and equally, one a member might accept believing it still stands. Closing it
 * honestly protects both sides of the same transaction.
 *
 * Each is claimed before anybody is told, so an overlapping sweep cannot expire one twice.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const live = await svc.buyback_offer.filter({ status: 'offered' }, 'expires_at', 200);
    const lapsed = live.filter((offer: any) => offer.expires_at && new Date(offer.expires_at) <= now);

    if (lapsed.length === 0) {
      return Response.json({ ok: true, expired: 0, live: live.length });
    }

    const expired = [];
    for (const offer of lapsed) {
      const claim = await svc.buyback_offer.updateMany(
        { id: offer.id, status: 'offered' },
        { $set: { status: 'expired' } },
      );
      if (!claim || claim.updated === 0) continue;
      expired.push(offer);
    }

    await notifyMany(base44, expired.map((offer: any) => ({
      recipient_user_id: offer.seller_user_id,
      recipient_handle: offer.seller_handle,
      kind: 'order_update',
      title: `Offer expired: ${offer.item_name}`,
      body: [
        `The offer of ${Number(offer.offer_auec).toLocaleString()} aUEC for this has run out.`,
        'Nothing is owed either way and the item is still yours. Ask the council to appraise it again if you would like a fresh figure — market prices move, which is why an offer cannot stand forever.',
      ].join('\n\n'),
      source_type: 'buyback_offer',
      source_id: offer.id,
      source_name: offer.item_name,
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    })));

    if (expired.length > 0) {
      await svc.ops_log.create({
        action: 'buyback.offers_expired',
        entity_type: 'buyback_offer',
        entity_name: `${expired.length} offer(s)`,
        actor: 'FSIS.bot',
        after: { expired: expired.length },
        notes: expired.map((o: any) => o.item_name).join('; '),
      });
    }

    return Response.json({ ok: true, expired: expired.length, live: live.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
