import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { hasClosed, minimumIncrement, isOpen, LIVE_STATES } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';

/**
 * The hall as a member may see it.
 *
 * This exists because of a hole the rest of the hall was carefully built around: `placeHallBid`
 * never mentions the reserve in a refusal, and the schema says it is never shown to bidders — but
 * the lot row itself was readable by any authenticated member, so anybody could simply read every
 * reserve straight off the record. Every careful refusal message in the world does not matter if the
 * number is one query away.
 *
 * So the row is now readable only by its seller and the council, and everybody else reads the hall
 * through here — the same shape as `listMusters`, for the same reason. What comes back is the lot as
 * a bidder is entitled to see it: what it is, what it stands at, when it closes, what the next bid
 * must be. Never the reserve, and never whether a bid has met it.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'The hall is for members of the outfit. Patrons buy at the storefront.' }, { status: 403 });
    }
    const council = isCouncil(user) || user.role === 'admin';

    const body = await req.json().catch(() => ({}));
    const lotId = String(body?.lot_id || '').trim();
    const scope = String(body?.scope || 'open').trim();
    const limit = Math.min(200, Math.max(1, Math.floor(Number(body?.limit) || 60)));

    const svc = base44.asServiceRole.entities;
    const now = new Date();

    /** A lot as the person asking is entitled to see it. */
    const view = (lot: any) => {
      const mine = lot.seller_user_id === user.id;
      const standing = roundAuec(lot.current_bid_auec);
      return {
        id: lot.id,
        title: lot.title,
        description: lot.description,
        item_type: lot.item_type,
        condition_grade: lot.condition_grade,
        condition_pct: lot.condition_pct,
        quantity: lot.quantity,
        manufacturer: lot.manufacturer,
        size_class: lot.size_class,
        seller_handle: lot.seller_handle,
        seller_is_you: mine,
        status: lot.status,
        opens_at: lot.opens_at,
        closes_at: lot.closes_at,
        closed: hasClosed(lot, now),
        open_for_bids: isOpen(lot.status) && !hasClosed(lot, now),
        start_auec: roundAuec(lot.start_auec),
        current_bid_auec: standing,
        bid_count: Number(lot.bid_count) || 0,
        next_bid_at_least: standing > 0 ? standing + minimumIncrement(standing) : roundAuec(lot.start_auec),
        leading_bidder_handle: lot.current_bidder_handle || '',
        you_are_leading: lot.current_bidder_user_id === user.id,
        you_are_watching: (lot.watcher_user_ids || []).includes(user.id),
        watchers: (lot.watcher_user_ids || []).length,
        commission_percent: lot.commission_percent,
        evidence_image_url: lot.evidence_image_url || '',
        // Stated openly, because the council can read reserves and must not bid.
        council_interest: lot.council_interest || '',
        held_for_appraisal: !!lot.held_for_appraisal,
        relisted_from_lot_id: lot.relisted_from_lot_id || '',

        // The reserve is NEVER in this payload. Not the figure, not whether it has been met,
        // not a "reserve met" flag — each of those lets it be found by probing.

        // Only the seller and the council see their own reserve and the settlement state.
        ...(mine || council
          ? {
            reserve_auec: roundAuec(lot.reserve_auec),
            seller_confirmed_at: lot.seller_confirmed_at || '',
            buyer_confirmed_at: lot.buyer_confirmed_at || '',
            commission_auec: roundAuec(lot.commission_auec),
          }
          : {}),
      };
    };

    if (lotId) {
      const lot = await svc.hall_lot.get(lotId);
      if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });
      // Bids are public in an auction — that is what makes the run of bidding checkable.
      const bids = await svc.hall_bid.filter({ lot_id: lotId, withdrawn: false }, '-placed_at', 50);
      return Response.json({
        lot: view(lot),
        bids: bids.map((b: any) => ({
          handle: b.bidder_handle,
          amount_auec: roundAuec(b.amount_auec),
          placed_at: b.placed_at,
          was_you: b.bidder_user_id === user.id,
        })),
      });
    }

    let lots: any[] = [];
    if (scope === 'mine') {
      lots = await svc.hall_lot.filter({ seller_user_id: user.id }, '-created_date', limit);
    } else if (scope === 'watching') {
      const all = await svc.hall_lot.filter({ status: { $in: LIVE_STATES } }, '-closes_at', 200);
      lots = all.filter((lot: any) => (lot.watcher_user_ids || []).includes(user.id));
    } else {
      // The hall proper: what a member can actually bid on, soonest to close first.
      const listed = await svc.hall_lot.filter({ status: 'listed' }, 'closes_at', limit);
      const bidding = await svc.hall_lot.filter({ status: 'bidding' }, 'closes_at', limit);
      lots = [...listed, ...bidding]
        .filter((lot: any) => !hasClosed(lot, now))
        .sort((a: any, b: any) => String(a.closes_at || '').localeCompare(String(b.closes_at || '')));
    }

    return Response.json({
      scope,
      lots: lots.map(view),
      you_may_bid: !council,
      note: council
        ? 'You can read reserves, so you may not bid in the hall. Anything you want, buy at the storefront.'
        : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
