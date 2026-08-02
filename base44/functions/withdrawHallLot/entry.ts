import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * Pulling a lot out of the hall.
 *
 * Freely, while nobody has bid: it is the seller's property and no one has committed anything.
 *
 * Once bids stand, it is not free. Somebody has said what they will pay and has been waiting for the
 * close, and a seller who pulls the lot because the bidding went the wrong way is doing to bidders
 * exactly what a no-show does to a hand at a handoff. So a bid-on lot may only be withdrawn by the
 * council, with a reason, and every bidder is told what happened and why.
 *
 * That is a deliberate friction rather than an oversight. A hall where lots vanish once the price is
 * inconvenient is a hall nobody bids in seriously, and bidders are the thing a hall is hardest to
 * attract and easiest to lose.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const lotId = String(body?.lot_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!lotId) return Response.json({ error: 'lot_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const lot = await svc.hall_lot.get(lotId);
    if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });

    const council = isCouncil(user) || user.role === 'admin';
    const isSeller = lot.seller_user_id === user.id;
    if (!isSeller && !council) {
      return Response.json({ error: 'That lot is not yours to withdraw.' }, { status: 403 });
    }
    if (!['draft', 'listed', 'bidding'].includes(lot.status)) {
      return Response.json({ error: 'That lot is no longer open, so there is nothing to withdraw.' }, { status: 409 });
    }

    const bidCount = Number(lot.bid_count) || 0;

    if (bidCount > 0 && !council) {
      return Response.json({
        error: 'Comrades have bid on this and have been waiting for the close. A lot with bids standing can only be withdrawn by an Owner, and they will want a reason — pulling a lot because the bidding went the wrong way is what a no-show does to a hand at a handoff.',
        bids: bidCount,
        standing_bid_auec: Number(lot.current_bid_auec) || 0,
      }, { status: 403 });
    }
    if (bidCount > 0 && !reason) {
      return Response.json({
        error: 'Give a reason. Every comrade who bid will be told it.',
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const claim = await svc.hall_lot.updateMany(
      { id: lotId, status: lot.status },
      {
        $set: {
          status: 'withdrawn',
          closed_at: now,
          void_reason: reason || (bidCount === 0 ? 'Withdrawn by the seller before any bid.' : ''),
        },
      },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That lot changed while you were reading it. Look again.' }, { status: 409 });
    }

    // Everyone with anything invested is told: bidders first, then watchers.
    const bids = bidCount > 0
      ? await svc.hall_bid.filter({ lot_id: lotId }, '-placed_at', 200)
      : [];
    const bidders = [...new Set(bids.map((b: any) => b.bidder_user_id).filter(Boolean))];
    const watchers = (lot.watcher_user_ids || []).filter((id: string) => !bidders.includes(id));

    await notifyMany(base44, [
      ...bidders.map((bidderId: string) => ({
        recipient_user_id: bidderId,
        kind: 'order_update',
        title: `Withdrawn: ${lot.title}`,
        body: [
          'A lot you bid on has been withdrawn from the hall before it closed.',
          reason ? `The reason given: ${reason}` : '',
          'You owe nothing and nothing is held against you. If you think this was done to avoid a price, say so to the council — a lot withdrawn after bidding is something they should hear about.',
        ].filter(Boolean).join('\n\n'),
        source_type: 'hall_lot',
        source_id: lotId,
        source_name: lot.title,
        actor_email: user.email,
        actor_role: fsisRole(user),
      })),
      ...watchers.map((watcherId: string) => ({
        recipient_user_id: watcherId,
        kind: 'order_update',
        title: `Withdrawn: ${lot.title}`,
        body: 'A lot you were watching has been withdrawn from the hall.',
        source_type: 'hall_lot',
        source_id: lotId,
        source_name: lot.title,
        actor_email: user.email,
        actor_role: fsisRole(user),
      })),
    ]);

    await svc.ops_log.create({
      action: 'hall.lot_withdrawn',
      entity_type: 'hall_lot',
      entity_id: lotId,
      entity_name: lot.title,
      actor: user.email,
      before: { status: lot.status, bid_count: bidCount },
      after: { status: 'withdrawn' },
      notes: reason || 'Withdrawn before any bid.',
    });

    return Response.json({ ok: true, withdrawn: true, bidders_told: bidders.length, watchers_told: watchers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
