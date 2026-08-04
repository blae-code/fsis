import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DISPUTE_KINDS, disputeWindowOpen, DISPUTE_WINDOW_DAYS } from '../../shared/hall.js';
import { notify } from '../../shared/notices.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * Something went wrong, and a comrade says so.
 *
 * The hall cannot reverse a payment, recover an item, or compel anybody — settlement happens
 * in-game. So this is not a claims process pretending to be one. What it does is real and worth
 * having: it puts the complaint on record, requires the other party to be heard, gets an Owner to
 * say what they think happened, and lets both trade standings carry the outcome.
 *
 * Both sides are named and both are told at once. A complaint the other party learns about only
 * when the ruling lands is not a process, and the person best placed to explain a missing handoff
 * is usually the one being complained about.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const lotId = String(body?.lot_id || '').trim();
    const kind = String(body?.kind || 'other').trim();
    const account = String(body?.account || '').trim();
    if (!lotId) return Response.json({ error: 'lot_id is required.' }, { status: 400 });
    if (!DISPUTE_KINDS.includes(kind)) {
      return Response.json({ error: `kind must be one of: ${DISPUTE_KINDS.join(', ')}.` }, { status: 400 });
    }
    if (!account) {
      return Response.json({ error: 'Say what happened, in your own words. An Owner will read it and so will the other party.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const lot = await svc.hall_lot.get(lotId);
    if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });

    const isSeller = lot.seller_user_id === user.id;
    const isBuyer = lot.current_bidder_user_id === user.id;
    if (!isSeller && !isBuyer) {
      return Response.json({ error: 'That trade is not yours to dispute.' }, { status: 403 });
    }
    if (!disputeWindowOpen(lot, new Date())) {
      return Response.json({
        error: `Disputes may be raised within ${DISPUTE_WINDOW_DAYS} days of a lot closing. Past that, take it up with the council directly — a counterparty should not be answerable for a trade indefinitely.`,
      }, { status: 409 });
    }

    const open = await svc.hall_dispute.filter({ lot_id: lotId, status: 'open' }, '-raised_at', 5);
    if (open.length > 0) {
      return Response.json({ error: 'A dispute on this lot is already open.', dispute_id: open[0].id }, { status: 409 });
    }

    const againstId = isSeller ? lot.current_bidder_user_id : lot.seller_user_id;
    const againstHandle = isSeller ? lot.current_bidder_handle : lot.seller_handle;
    const now = new Date().toISOString();

    const dispute = await svc.hall_dispute.create({
      lot_id: lotId,
      lot_title: lot.title,
      raised_by_user_id: user.id,
      raised_by_handle: callsignFor(user),
      against_user_id: againstId || '',
      against_handle: againstHandle || '',
      kind,
      account,
      evidence_url: String(body?.evidence_url || '').trim(),
      status: 'open',
      raised_at: now,
    });

    await svc.hall_lot.update(lotId, { status: 'disputed' });

    // The other party hears it now, in full, and is asked for their side before anybody rules.
    if (againstId) {
      await notify(base44, {
        recipient_user_id: againstId,
        recipient_handle: againstHandle,
        kind: 'order_update',
        title: `A dispute was raised on: ${lot.title}`,
        body: [
          `${callsignFor(user)} has raised a dispute over this trade.`,
          `What they say happened: ${account}`,
          'Give your account of it. An Owner will read both before ruling, and a ruling made without hearing you would not be a ruling.',
          'If this is a misunderstanding, it very often is — most disputes are two people describing the same evening differently, and nothing is marked against anybody by default.',
        ].join('\n\n'),
        source_type: 'hall_dispute',
        source_id: dispute.id,
        source_name: lot.title,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });
    }

    await svc.ops_log.create({
      action: 'hall.dispute_raised',
      entity_type: 'hall_dispute',
      entity_id: dispute.id,
      entity_name: lot.title,
      actor: user.email,
      after: { kind, against: againstHandle },
      notes: account,
    });

    return Response.json({
      ok: true,
      dispute,
      note: 'Recorded, and the other party has been told and asked for their account. The hall cannot reverse a payment or recover an item — settlement happens in-game — but an Owner will rule on what happened, and both trade records will carry it.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
