import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The other party gives their account, or the complainant withdraws.
 *
 * This was a promise the code could not keep. `raiseHallDispute` tells the accused, in as many
 * words: "Give your account of it. An Owner will read both before ruling, and a ruling made without
 * hearing you would not be a ruling." The `answer` and `answered_at` fields have been sitting on the
 * record since the day it was written, and NOTHING COULD WRITE THEM. A comrade was asked to defend
 * themselves through a door that did not exist, and an Owner then ruled on one side of the story
 * while believing they had asked for the other.
 *
 * Withdrawal lives here too, because a complaint raised in the heat of a bad handoff is often
 * settled between two comrades an hour later, and there was no way to say so. Withdrawing is not an
 * admission and nothing is recorded against anybody for it.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const disputeId = String(body?.dispute_id || '').trim();
    const account = String(body?.answer || '').trim();
    const withdraw = body?.withdraw === true;
    if (!disputeId) return Response.json({ error: 'dispute_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const dispute = await svc.hall_dispute.get(disputeId);
    if (!dispute) return Response.json({ error: 'No such dispute.' }, { status: 404 });
    if (['ruled', 'withdrawn'].includes(dispute.status)) {
      return Response.json({ error: `That dispute is already ${dispute.status}.` }, { status: 409 });
    }

    const isAccused = dispute.against_user_id === user.id;
    const isComplainant = dispute.raised_by_user_id === user.id;
    if (!isAccused && !isComplainant) {
      return Response.json({ error: 'That dispute is not yours.' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Only the comrade who raised it may take it back.
    if (withdraw) {
      if (!isComplainant) {
        return Response.json({
          error: 'Only the comrade who raised a dispute may withdraw it. Give your account instead — an Owner will read both.',
        }, { status: 403 });
      }
      await svc.hall_dispute.update(disputeId, {
        status: 'withdrawn',
        ...(account ? { answer: account, answered_at: now } : {}),
      });
      // The lot goes back to what it was, so a withdrawn complaint does not leave it stuck.
      const lot = await svc.hall_lot.get(dispute.lot_id).catch(() => null);
      if (lot && lot.status === 'disputed') {
        await svc.hall_lot.update(dispute.lot_id, {
          status: lot.seller_confirmed_at && lot.buyer_confirmed_at ? 'settled' : 'won',
        });
      }
      if (dispute.against_user_id) {
        await notify(base44, {
          recipient_user_id: dispute.against_user_id,
          recipient_handle: dispute.against_handle,
          kind: 'order_update',
          title: `Dispute withdrawn: ${dispute.lot_title}`,
          body: [
            `${dispute.raised_by_handle} has withdrawn the dispute over this trade.`,
            account ? `What they said: ${account}` : '',
            'Nothing is recorded against you, and nothing was ever ruled. Withdrawing is not an admission by anybody.',
          ].filter(Boolean).join('\n\n'),
          source_type: 'hall_dispute',
          source_id: disputeId,
          source_name: dispute.lot_title,
          actor_email: user.email,
          actor_role: fsisRole(user),
        });
      }
      await svc.ops_log.create({
        action: 'hall.dispute_withdrawn',
        entity_type: 'hall_dispute',
        entity_id: disputeId,
        entity_name: dispute.lot_title,
        actor: user.email,
        after: { status: 'withdrawn' },
        notes: account || 'Withdrawn by the comrade who raised it.',
      });
      return Response.json({ ok: true, status: 'withdrawn' });
    }

    // The answer itself.
    if (!isAccused) {
      return Response.json({
        error: 'This is for the other party to answer. If you want to add to your own account, raise it with the council.',
      }, { status: 403 });
    }
    if (!account) {
      return Response.json({
        error: 'Say what happened, in your own words. An Owner will read it beside the complaint before ruling.',
      }, { status: 400 });
    }
    if (dispute.answered_at) {
      return Response.json({ error: 'You have already given your account.' }, { status: 409 });
    }

    const updated = await svc.hall_dispute.update(disputeId, {
      answer: account,
      answered_at: now,
      status: 'answered',
    });

    await notify(base44, {
      recipient_user_id: dispute.raised_by_user_id,
      recipient_handle: dispute.raised_by_handle,
      kind: 'order_update',
      title: `Answered: ${dispute.lot_title}`,
      body: [
        `${user.handle || user.email} has given their account of this trade.`,
        `What they say: ${account}`,
        'An Owner will now read both and rule. If this changes how you see it, you can withdraw the dispute — that is an ordinary outcome and nothing is recorded against anybody for it.',
      ].join('\n\n'),
      source_type: 'hall_dispute',
      source_id: disputeId,
      source_name: dispute.lot_title,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: 'hall.dispute_answered',
      entity_type: 'hall_dispute',
      entity_id: disputeId,
      entity_name: dispute.lot_title,
      actor: user.email,
      before: { status: dispute.status },
      after: { status: 'answered' },
      notes: account,
    });

    return Response.json({ ok: true, dispute: updated, status: 'answered' });
  } catch (error) {
    await reportError(base44, { source: 'answerHallDispute', error, route: 'answerHallDispute' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
