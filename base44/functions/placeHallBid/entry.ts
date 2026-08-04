import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { bidRefusal, closeAfterBid, minimumIncrement } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * A bid in the hall.
 *
 * The bid is claimed atomically against the bid count: two comrades bidding the same figure at the
 * same instant must not both become the standing bidder, or the hall owes an item to two people.
 *
 * A bid inside the last two minutes pushes the close out. A hall that can be sniped is not trusted,
 * and the lot should go to whoever wants it most rather than whoever timed a click best.
 *
 * The reserve is never revealed, and bidding under it is allowed. A hall that rejects bids below the
 * reserve tells bidders where it sits just as surely as printing it would.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'The hall is for members of the outfit.' }, { status: 403 });
    }

    const body = await req.json();
    const lotId = String(body?.lot_id || '').trim();
    const amount = roundAuec(body?.amount_auec);
    if (!lotId) return Response.json({ error: 'lot_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const lot = await svc.hall_lot.get(lotId);
    if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });

    // The council sees reserves. They do not bid on what they can see through.
    if (isCouncil(user) || user.role === 'admin') {
      return Response.json({
        error: 'The council can read reserves, so no council member bids in the hall. Anything you want, buy at the storefront or ask a comrade to bid on their own account — not yours.',
      }, { status: 403 });
    }

    const now = new Date();
    const refusal = bidRefusal(lot, user, amount, now);
    if (refusal) return Response.json({ error: refusal }, { status: 409 });

    const previousBidder = lot.current_bidder_user_id || '';
    const extendedClose = closeAfterBid(lot.closes_at, now);
    // Compared as instants, not as strings: closeAfterBid normalises the format, so a string
    // comparison would report every single bid as having extended the close.
    const closeMoved = !!extendedClose
      && new Date(extendedClose).getTime() !== new Date(lot.closes_at).getTime();

    // Compare-and-swap on the bid count. A bid that lands between our read and our write moves the
    // count, and this matches nothing rather than overwriting a higher offer.
    const claim = await svc.hall_lot.updateMany(
      { id: lotId, bid_count: Number(lot.bid_count) || 0 },
      {
        $set: {
          current_bid_auec: amount,
          current_bidder_user_id: user.id,
          current_bidder_handle: callsignFor(user),
          bid_count: (Number(lot.bid_count) || 0) + 1,
          status: 'bidding',
          closes_at: extendedClose || lot.closes_at,
        },
      },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({
        error: 'Somebody bid while you were reading. Look at the standing bid and try again.',
      }, { status: 409 });
    }

    await svc.hall_bid.create({
      lot_id: lotId,
      lot_title: lot.title,
      bidder_user_id: user.id,
      bidder_handle: callsignFor(user),
      amount_auec: amount,
      placed_at: now.toISOString(),
    });

    // The comrade who has just been outbid is told at once — finding out when the lot closes is
    // finding out too late to do anything about it.
    if (previousBidder && previousBidder !== user.id) {
      await notify(base44, {
        recipient_user_id: previousBidder,
        recipient_handle: lot.current_bidder_handle,
        kind: 'order_update',
        title: `Outbid: ${lot.title}`,
        body: [
          `The standing bid on this lot is now ${amount.toLocaleString()} aUEC.`,
          `If you want it, the next bid must be at least ${(amount + minimumIncrement(amount)).toLocaleString()} aUEC.`,
          closeMoved
            ? 'The close was pushed out by this bid — a late bid always extends it, so you have not lost your chance to a clock.'
            : '',
        ].filter(Boolean).join('\n\n'),
        source_type: 'hall_lot',
        source_id: lotId,
        source_name: lot.title,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });
    }

    return Response.json({
      ok: true,
      standing_bid_auec: amount,
      next_bid_at_least: amount + minimumIncrement(amount),
      closes_at: extendedClose || lot.closes_at,
      close_extended: closeMoved,
      note: closeMoved
        ? 'Your bid landed inside the closing window, so the close was pushed out. A lot that can be sniped is not a hall anybody trusts.'
        : '',
    });
  } catch (error) {
    await reportError(base44, { source: 'placeHallBid', error, route: 'placeHallBid' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
