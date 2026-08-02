import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { notify } from '../../shared/notices.js';
import { TRADE_AWARD, recomputeTradeStanding } from '../../shared/trade.js';

/**
 * Both parties say the goods changed hands.
 *
 * Settlement happens in-game. FSIS records the trade; it does not hold the item, does not hold the
 * money, and cannot make either move. That is stated to both comrades at the point they win and
 * again here, because a hall that lets people believe they are protected has done them more harm
 * than one that admits it cannot protect them.
 *
 * So it takes both. One party's word is a claim; two is a record. Until both have confirmed, the lot
 * stands as `won` and unsettled — visible to the council as something that may need a ruling.
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
    const lot = await svc.hall_lot.get(lotId);
    if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });
    if (lot.status === 'settled') {
      return Response.json({ error: 'That trade is already settled.' }, { status: 409 });
    }
    if (lot.status === 'disputed') {
      return Response.json({
        error: 'That lot is in dispute. An Owner rules on it before it can be settled.',
      }, { status: 409 });
    }
    if (lot.status !== 'won') {
      return Response.json({ error: 'That lot has no sale to settle.' }, { status: 409 });
    }

    const isSeller = lot.seller_user_id === user.id;
    const isBuyer = lot.current_bidder_user_id === user.id;
    if (!isSeller && !isBuyer) {
      return Response.json({ error: 'This trade is not yours to confirm.' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};
    if (isSeller) {
      if (lot.seller_confirmed_at) return Response.json({ error: 'You have already confirmed.' }, { status: 409 });
      patch.seller_confirmed_at = now;
    } else {
      if (lot.buyer_confirmed_at) return Response.json({ error: 'You have already confirmed.' }, { status: 409 });
      patch.buyer_confirmed_at = now;
    }

    const bothConfirmed = isSeller
      ? !!lot.buyer_confirmed_at
      : !!lot.seller_confirmed_at;
    if (bothConfirmed) patch.status = 'settled';

    const updated = await svc.hall_lot.update(lotId, patch);

    const otherId = isSeller ? lot.current_bidder_user_id : lot.seller_user_id;
    const otherHandle = isSeller ? lot.current_bidder_handle : lot.seller_handle;

    if (!bothConfirmed && otherId) {
      await notify(base44, {
        recipient_user_id: otherId,
        recipient_handle: otherHandle,
        kind: 'order_update',
        title: `Confirm the handoff: ${lot.title}`,
        body: [
          `${user.handle || user.email} has confirmed that the goods changed hands on this lot.`,
          'Confirm it too and the trade is settled. If it did NOT happen, say so instead and raise a dispute — an Owner will rule on it, and confirming something that did not happen helps nobody.',
        ].join('\n\n'),
        source_type: 'hall_lot',
        source_id: lotId,
        source_name: lot.title,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });
    }

    // Both turned up and did what they said. That is exactly what trade standing records.
    if (bothConfirmed) {
      for (const party of [
        { id: lot.seller_user_id, handle: lot.seller_handle },
        { id: lot.current_bidder_user_id, handle: lot.current_bidder_handle },
      ]) {
        if (!party.id) continue;
        await svc.trade_event.create({
          patron_user_id: party.id,
          patron_handle: party.handle,
          kind: 'handoff_completed',
          delta: TRADE_AWARD.handoffCompleted,
          effective_delta: TRADE_AWARD.handoffCompleted,
          reason: `Handoff completed in the hall: ${lot.title}`,
          actor_email: 'FSIS.bot',
        });
        await recomputeTradeStanding(base44, party.id);
      }
    }

    await svc.ops_log.create({
      action: bothConfirmed ? 'hall.lot_settled' : 'hall.settlement_confirmed',
      entity_type: 'hall_lot',
      entity_id: lotId,
      entity_name: lot.title,
      actor: user.email,
      after: { by: isSeller ? 'seller' : 'buyer', settled: bothConfirmed },
      notes: bothConfirmed
        ? 'Both parties confirmed the goods changed hands.'
        : `Confirmed by the ${isSeller ? 'seller' : 'buyer'}; awaiting the other.`,
    });

    return Response.json({
      ok: true,
      lot: updated,
      settled: bothConfirmed,
      awaiting: bothConfirmed ? '' : (isSeller ? 'buyer' : 'seller'),
      note: bothConfirmed
        ? 'Settled. Both of you turned up and did what you said, and both trade records say so.'
        : `Recorded. The trade settles when the ${isSeller ? 'buyer' : 'seller'} confirms too — one party's word is a claim, two is a record.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
