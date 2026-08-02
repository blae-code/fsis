import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * A game patch has moved the ground under the hall.
 *
 * An economy pass or a wipe makes every open reserve, every appraisal and every standing bid a
 * figure from a world that no longer exists. Leaving them live would mean lots closing at prices
 * nobody would now agree to, and buyback offers the collective would be held to at a fraction of a
 * market that has moved.
 *
 * So open lots are VOIDED rather than closed: closing them would name winners at obsolete prices and
 * raise commission on sales nobody meant to make. Bids are set aside with the reason recorded — never
 * deleted, so the run of bidding on a lot can still be read back honestly. Everybody affected is
 * told, and everything can simply be relisted at figures that mean something again.
 *
 * Nothing already SETTLED is touched. Those trades happened, in the world as it was.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const patchName = String(body?.patch_name || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!patchName) return Response.json({ error: 'Name the patch.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const now = new Date();
    const note = reason || `Prices reset by patch ${patchName}.`;
    const dryRun = body?.dry_run === true;

    const openLots = [
      ...(await svc.hall_lot.filter({ status: 'listed' }, '-created_date', 500)),
      ...(await svc.hall_lot.filter({ status: 'bidding' }, '-created_date', 500)),
      ...(await svc.hall_lot.filter({ status: 'draft' }, '-created_date', 500)),
    ];
    const liveOffers = await svc.buyback_offer.filter({ status: 'offered' }, '-created_date', 500);

    // Say what would happen before it happens. A sweep this broad should be previewable.
    if (dryRun) {
      return Response.json({
        ok: true,
        dry_run: true,
        would_void_lots: openLots.length,
        would_expire_offers: liveOffers.length,
        note: 'Nothing has been changed. Run again without dry_run to apply it.',
      });
    }

    const notices: any[] = [];

    if (openLots.length > 0) {
      await svc.hall_lot.bulkUpdate(openLots.map((lot: any) => ({
        id: lot.id,
        status: 'void',
        closed_at: now.toISOString(),
        void_reason: note,
      })));

      for (const lot of openLots) {
        // Bids set aside, never deleted — the record of what was offered stands.
        const bids = await svc.hall_bid.filter({ lot_id: lot.id, withdrawn: false }, '-placed_at', 100);
        if (bids.length > 0) {
          await svc.hall_bid.bulkUpdate(bids.map((bid: any) => ({
            id: bid.id, withdrawn: true, withdrawn_reason: note,
          })));
        }

        const told = [...new Set([
          lot.seller_user_id,
          ...bids.map((b: any) => b.bidder_user_id),
          ...(lot.watcher_user_ids || []),
        ].filter(Boolean))];

        for (const userId of told) {
          notices.push({
            recipient_user_id: userId,
            kind: 'order_update',
            title: `Set aside after ${patchName}: ${lot.title}`,
            body: [
              `This lot has been voided because ${patchName} moved prices under it.`,
              'Reserves and bids set before a patch are figures from a world that no longer exists. Closing the lot would have named a winner at a price nobody would now agree to, and raised commission on a sale nobody meant to make.',
              'Nothing is owed, no bid stands, and nothing is held against anybody. Relist it at figures that mean something again.',
            ].join('\n\n'),
            source_type: 'hall_lot',
            source_id: lot.id,
            source_name: lot.title,
            actor_email: user.email,
            actor_role: fsisRole(user),
          });
        }
      }
    }

    if (liveOffers.length > 0) {
      await svc.buyback_offer.bulkUpdate(liveOffers.map((offer: any) => ({
        id: offer.id, status: 'expired',
      })));

      for (const offer of liveOffers) {
        notices.push({
          recipient_user_id: offer.seller_user_id,
          recipient_handle: offer.seller_handle,
          kind: 'order_update',
          title: `Offer withdrawn after ${patchName}: ${offer.item_name}`,
          body: [
            `The offer of ${Number(offer.offer_auec).toLocaleString()} aUEC for this was based on a market ${patchName} has changed.`,
            'It has been set aside rather than left standing — honouring it would mean one of us being short on a figure neither of us would agree to now.',
            'Ask the council to appraise it again and you will get a figure that means something.',
          ].join('\n\n'),
          source_type: 'buyback_offer',
          source_id: offer.id,
          source_name: offer.item_name,
          actor_email: user.email,
          actor_role: fsisRole(user),
        });
      }
    }

    await notifyMany(base44, notices);

    await svc.ops_log.create({
      action: 'hall.patch_reset',
      entity_type: 'hall_lot',
      entity_name: patchName,
      actor: user.email,
      after: { lots_voided: openLots.length, offers_expired: liveOffers.length, told: notices.length },
      notes: note,
    });

    return Response.json({
      ok: true,
      patch_name: patchName,
      lots_voided: openLots.length,
      offers_expired: liveOffers.length,
      comrades_told: notices.length,
      settled_untouched: 'Trades already settled were not touched — those happened, in the world as it was.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
