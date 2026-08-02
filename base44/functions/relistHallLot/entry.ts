import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { LIVE_STATES, liveLotAllowance, suspendsListing } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';

/** A relisted lot runs for this long unless the seller says otherwise. */
const DEFAULT_HOURS = 48;
const MAX_HOURS = 24 * 14;

/**
 * A second attempt at a lot that did not sell.
 *
 * A lot that closed under its reserve or without a bid is not a failure with nothing to be done
 * about it — usually the reserve was optimistic, or nobody was looking that evening. Relisting
 * carries the history forward rather than starting a fresh lot with no past, so a buyer can see the
 * thing has been round before and a seller can see what it did not sell at.
 *
 * The original is never rewritten. It keeps its own terminal state and the new lot points back at
 * it, because a lot that quietly becomes a different lot is how a hall's record stops being one.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const lotId = String(body?.lot_id || '').trim();
    if (!lotId) return Response.json({ error: 'lot_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const original = await svc.hall_lot.get(lotId);
    if (!original) return Response.json({ error: 'No such lot.' }, { status: 404 });
    if (original.seller_user_id !== user.id) {
      return Response.json({ error: 'That lot is not yours to relist.' }, { status: 403 });
    }
    if (!['reserve_not_met', 'no_bids', 'withdrawn', 'expired'].includes(original.status)) {
      return Response.json({
        error: 'Only a lot that closed without selling can be relisted. A lot that sold is settled between you and the buyer.',
      }, { status: 409 });
    }

    // The same guards as any listing: nothing owed, nothing already committed, not flooding.
    const debts = await svc.hall_obligation.filter({ debtor_user_id: user.id }, '-due_at', 50);
    const suspending = debts.find((debt: any) => suspendsListing(debt));
    if (suspending) {
      return Response.json({
        error: `Listing is suspended while ${Number(suspending.amount_auec).toLocaleString()} aUEC is outstanding on "${suspending.lot_title}".`,
      }, { status: 409 });
    }

    if (original.loot_item_id) {
      const live = await svc.hall_lot.filter(
        { loot_item_id: original.loot_item_id, status: { $in: LIVE_STATES } }, '-created_date', 5,
      );
      if (live.length > 0) {
        return Response.json({
          error: 'That item is already committed in the hall.',
          lot_id: live[0].id,
        }, { status: 409 });
      }
    }

    const allowance = liveLotAllowance(user);
    const mineLive = await svc.hall_lot.filter({ seller_user_id: user.id, status: { $in: LIVE_STATES } }, '-created_date', 50);
    if (mineLive.length >= allowance) {
      return Response.json({
        error: `You have ${allowance} lots live already, which is the limit for now.`,
      }, { status: 409 });
    }

    const hours = Number(body?.hours);
    const runFor = Number.isFinite(hours) && hours > 0 && hours <= MAX_HOURS ? Math.floor(hours) : DEFAULT_HOURS;
    const now = new Date();

    // The seller may move the price. Most relistings exist because the reserve was optimistic.
    const start = body?.start_auec !== undefined ? roundAuec(body.start_auec) : roundAuec(original.start_auec);
    const reserve = body?.reserve_auec !== undefined ? roundAuec(body.reserve_auec) : roundAuec(original.reserve_auec);
    if (reserve > 0 && start > reserve) {
      return Response.json({ error: 'Bidding cannot open above your own reserve.' }, { status: 400 });
    }

    const relisted = await svc.hall_lot.create({
      title: original.title,
      description: original.description,
      seller_user_id: user.id,
      seller_handle: user.handle || user.full_name || user.email,
      item_type: original.item_type,
      condition_grade: original.condition_grade,
      condition_pct: original.condition_pct,
      quantity: original.quantity,
      manufacturer: original.manufacturer,
      size_class: original.size_class,
      loot_item_id: original.loot_item_id || '',
      start_auec: start,
      reserve_auec: reserve,
      current_bid_auec: 0,
      bid_count: 0,
      opens_at: now.toISOString(),
      closes_at: new Date(now.getTime() + runFor * 3600000).toISOString(),
      status: 'listed',
      watcher_user_ids: [],
      commission_percent: original.commission_percent,
      listing_signature_id: original.listing_signature_id,
      evidence_image_url: original.evidence_image_url,
      extraction_confirmed: original.extraction_confirmed,
      // The link back. The original keeps its own terminal state and is not rewritten.
      relisted_from_lot_id: lotId,
    });

    await svc.ops_log.create({
      action: 'hall.lot_relisted',
      entity_type: 'hall_lot',
      entity_id: relisted.id,
      entity_name: original.title,
      actor: user.email,
      before: { from_lot: lotId, from_status: original.status, reserve_auec: original.reserve_auec },
      after: { lot_id: relisted.id, reserve_auec: reserve },
      notes: `Relisted from a lot that closed as ${original.status}.`,
    });

    return Response.json({
      ok: true,
      lot: relisted,
      relisted_from: lotId,
      previous_outcome: original.status,
      note: original.status === 'reserve_not_met'
        ? `It last closed with a best bid of ${roundAuec(original.current_bid_auec).toLocaleString()} aUEC, under your reserve. Worth knowing when setting this one.`
        : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
