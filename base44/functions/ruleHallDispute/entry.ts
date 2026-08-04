import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { DISPUTE_REMEDIES } from '../../shared/hall.js';
import { TRADE_COST, TRADE_MARK_LIFETIME_DAYS, recomputeTradeStanding } from '../../shared/trade.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * An Owner rules on a dispute.
 *
 * Every remedy here is something the hall can actually do. It cannot reverse a payment, recover an
 * item or compel anybody, so it does not offer to — the choices are to set the sale aside, waive
 * what the hall would have taken, let the seller relist at no further cost, or say the complaint
 * does not stand.
 *
 * Whether the ruling touches standing is decided EXPLICITLY and separately. Most disputes are two
 * comrades describing the same evening differently; if every one produced a mark, the trade record
 * would stop meaning "this person leaves people waiting" and start meaning "this person trades a
 * lot". A mark carries the ordinary reason, appeal route and expiry.
 *
 * Both parties get the ruling in full. The one it goes against is owed the reasoning most of all.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Owner standing or above is required to rule on a dispute.' }, { status: 403 });
    }

    const body = await req.json();
    const disputeId = String(body?.dispute_id || '').trim();
    const remedy = String(body?.remedy || '').trim();
    const ruling = String(body?.ruling || '').trim();
    const touchesStanding = body?.touches_standing === true;
    const markUserId = String(body?.marked_user_id || '').trim();

    if (!disputeId) return Response.json({ error: 'dispute_id is required.' }, { status: 400 });
    if (!DISPUTE_REMEDIES.includes(remedy)) {
      return Response.json({ error: `remedy must be one of: ${DISPUTE_REMEDIES.join(', ')}.` }, { status: 400 });
    }
    if (!ruling) {
      return Response.json({ error: 'Give your reasoning. Both parties will read it, and the one it goes against is owed it most.' }, { status: 400 });
    }
    if (touchesStanding && !markUserId) {
      return Response.json({ error: 'Say whose standing this touches. A mark with nobody named is not a ruling.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const dispute = await svc.hall_dispute.get(disputeId);
    if (!dispute) return Response.json({ error: 'No such dispute.' }, { status: 404 });
    if (dispute.status === 'ruled') {
      return Response.json({ error: 'That dispute has already been ruled on.' }, { status: 409 });
    }
    if (touchesStanding && ![dispute.raised_by_user_id, dispute.against_user_id].includes(markUserId)) {
      return Response.json({ error: 'A mark may only fall on a party to the trade.' }, { status: 400 });
    }

    const now = new Date();
    const lot = await svc.hall_lot.get(dispute.lot_id).catch(() => null);

    // Carry out the remedy, so far as the hall is actually able.
    let lotStatus = 'settled';
    if (remedy === 'void_sale') lotStatus = 'void';
    else if (remedy === 'relist') lotStatus = 'reserve_not_met';
    else if (remedy === 'no_action') lotStatus = lot?.seller_confirmed_at && lot?.buyer_confirmed_at ? 'settled' : 'won';
    else if (remedy === 'settled_between') lotStatus = 'settled';

    if (lot) {
      await svc.hall_lot.update(dispute.lot_id, {
        status: lotStatus,
        ...(remedy === 'void_sale' ? { void_reason: `Sale set aside on a dispute ruling: ${ruling}` } : {}),
      });
    }

    // The hall takes nothing where the sale was set aside or the commission waived.
    if (['void_sale', 'commission_waived'].includes(remedy)) {
      const debts = await svc.hall_obligation.filter({ lot_id: dispute.lot_id }, '-incurred_at', 10);
      for (const debt of debts.filter((d: any) => ['owed', 'overdue'].includes(d.status))) {
        await svc.hall_obligation.update(debt.id, {
          status: remedy === 'void_sale' ? 'void' : 'waived',
          listing_suspended: false,
          waived_reason: `Dispute ruling: ${ruling}`,
        });
      }
    }

    if (touchesStanding && markUserId) {
      const markedHandle = markUserId === dispute.raised_by_user_id ? dispute.raised_by_handle : dispute.against_handle;
      await svc.trade_event.create({
        patron_user_id: markUserId,
        patron_handle: markedHandle,
        kind: 'council_adjustment',
        delta: TRADE_COST.handoff_no_show,
        effective_delta: TRADE_COST.handoff_no_show,
        reason: `Dispute upheld on "${dispute.lot_title}": ${ruling}`,
        expires_at: new Date(now.getTime() + TRADE_MARK_LIFETIME_DAYS * 86400000).toISOString(),
        actor_email: user.email,
      });
      await recomputeTradeStanding(base44, markUserId);
    }

    const updated = await svc.hall_dispute.update(disputeId, {
      status: 'ruled',
      remedy,
      ruling,
      touches_standing: touchesStanding,
      marked_user_id: touchesStanding ? markUserId : '',
      ruled_by_email: user.email,
      ruled_at: now.toISOString(),
    });

    const remedySays: Record<string, string> = {
      no_action: 'The complaint does not stand, and the trade is left as it was. Nothing is marked against anybody for having raised it.',
      relist: 'The sale is set aside and the seller may put the lot back in the hall at no further cost.',
      void_sale: 'The sale is void. Nothing is owed to the hall on it.',
      commission_waived: 'The sale stands, and the hall takes nothing on it.',
      settled_between: 'The two of you sorted it out between yourselves, which the record now says.',
    };

    const parties = [
      { id: dispute.raised_by_user_id, handle: dispute.raised_by_handle },
      { id: dispute.against_user_id, handle: dispute.against_handle },
    ].filter((p) => p.id);

    await notifyMany(base44, parties.map((party) => ({
      recipient_user_id: party.id,
      recipient_handle: party.handle,
      kind: touchesStanding && party.id === markUserId ? 'trade_marked' : 'order_update',
      title: `Ruled: ${dispute.lot_title}`,
      body: [
        `An Owner has ruled on the dispute over this lot.`,
        `The reasoning, in full: ${ruling}`,
        remedySays[remedy],
        touchesStanding && party.id === markUserId
          ? 'A mark has been recorded on your trade standing over this. It carries the ordinary appeal route and lapses on its own, like any other.'
          : touchesStanding
            ? ''
            : 'No mark has been recorded against either of you. Most disputes are two people describing the same evening differently.',
        'The hall records trades; it does not hold them. Anything owed between you is still between you.',
      ].filter(Boolean).join('\n\n'),
      source_type: 'hall_dispute',
      source_id: disputeId,
      source_name: dispute.lot_title,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    await svc.ops_log.create({
      action: 'hall.dispute_ruled',
      entity_type: 'hall_dispute',
      entity_id: disputeId,
      entity_name: dispute.lot_title,
      actor: user.email,
      before: { status: dispute.status },
      after: { remedy, touches_standing: touchesStanding, lot_status: lotStatus },
      notes: ruling,
    });

    return Response.json({ ok: true, dispute: updated, lot_status: lotStatus });
  } catch (error) {
    await reportError(base44, { source: 'ruleHallDispute', error, route: 'ruleHallDispute' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
