import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notify } from '../../shared/notices.js';

/**
 * A debt to the hall is settled, or forgiven.
 *
 * Payment happens in-game, so somebody confirms it landed and their name goes on it — the same rule
 * as everywhere else money moves. Waiving is a first-class outcome rather than an exception: a
 * comrade who cannot pay is not the problem the collections ladder exists for, and an Owner should
 * be able to say so plainly and end it.
 *
 * Settling or waiving lifts any listing suspension at once. A suspension that outlives the debt is a
 * punishment nobody decided to impose.
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
    const obligationId = String(body?.obligation_id || '').trim();
    const outcome = String(body?.outcome || 'paid').trim();
    const reason = String(body?.reason || '').trim();
    if (!obligationId) return Response.json({ error: 'obligation_id is required.' }, { status: 400 });
    if (!['paid', 'waived', 'void'].includes(outcome)) {
      return Response.json({ error: "outcome must be 'paid', 'waived' or 'void'." }, { status: 400 });
    }
    if (outcome !== 'paid' && !reason) {
      return Response.json({
        error: 'Say why. Forgiving a debt or setting one aside is a decision the record should carry a reason for.',
      }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const obligation = await svc.hall_obligation.get(obligationId);
    if (!obligation) return Response.json({ error: 'No such obligation.' }, { status: 404 });
    if (['paid', 'waived', 'void'].includes(obligation.status)) {
      return Response.json({ error: 'That obligation is already closed.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updated = await svc.hall_obligation.update(obligationId, {
      status: outcome,
      // A suspension that outlives the debt is a punishment nobody decided to impose.
      listing_suspended: false,
      ...(outcome === 'paid' ? { paid_at: now, paid_confirmed_by_email: user.email } : {}),
      ...(outcome !== 'paid' ? { waived_reason: reason } : {}),
    });

    await svc.ops_log.create({
      action: `hall.obligation_${outcome}`,
      entity_type: 'hall_obligation',
      entity_id: obligationId,
      entity_name: obligation.lot_title,
      actor: user.email,
      before: { status: obligation.status, listing_suspended: !!obligation.listing_suspended },
      after: { status: outcome, listing_suspended: false },
      notes: reason || `Recorded ${outcome} by ${fsisRole(user)}.`,
    });

    await notify(base44, {
      recipient_user_id: obligation.debtor_user_id,
      recipient_handle: obligation.debtor_handle,
      kind: 'order_update',
      title: {
        paid: `Commission settled: ${obligation.lot_title}`,
        waived: `Commission forgiven: ${obligation.lot_title}`,
        void: `Commission set aside: ${obligation.lot_title}`,
      }[outcome],
      body: [
        {
          paid: `${fsisRole(user)} has recorded that ${Number(obligation.amount_auec).toLocaleString()} aUEC reached the hall. Nothing further is owed on this lot.`,
          waived: `The council has forgiven ${Number(obligation.amount_auec).toLocaleString()} aUEC owed on this lot. Nothing is owed and nothing is held against you.`,
          void: `This debt has been set aside — it should not have stood. Nothing is owed.`,
        }[outcome],
        reason,
        obligation.listing_suspended
          ? 'Your listing privileges are restored.'
          : '',
        outcome === 'paid'
          ? 'This is a record of a transfer rather than the transfer itself. If it has not actually landed, say so and it will be corrected.'
          : '',
      ].filter(Boolean).join('\n\n'),
      source_type: 'hall_obligation',
      source_id: obligationId,
      source_name: obligation.lot_title,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

    return Response.json({ ok: true, obligation: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
