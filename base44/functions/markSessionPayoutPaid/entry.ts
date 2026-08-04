import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * Confirming the money actually reached a comrade.
 *
 * Payment happens in-game. FSIS records trades rather than escrowing them, so nothing here can move
 * a credit — which means "settled" and "paid" are two different facts, and collapsing them would let
 * the record show a comrade paid when nobody had sent them anything. Somebody has to say it landed,
 * and their name goes on it.
 *
 * A member's time became shares and settles at pay day with everyone else's; that is not the
 * council's to tick and is refused here, so the run summary cannot show a false debt discharged.
 * This is for money that changes hands directly.
 *
 * The tick can be lifted again. A payment recorded in error should be correctable, and the comrade
 * is told either way — a tick that appeared and quietly vanished would be worse than no tick.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    const handUserId = String(body?.user_id || '').trim();
    const paid = body?.paid !== false;
    const note = String(body?.paid_note || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });
    if (!handUserId) return Response.json({ error: 'user_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const session = await svc.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
    if (session.status !== 'closed') {
      return Response.json({ error: 'That run has not been settled yet — there is nothing to pay.' }, { status: 409 });
    }

    const line = (session.payouts || []).find((p: any) => p.user_id === handUserId);
    if (!line) return Response.json({ error: 'That comrade has no payout line on this run.' }, { status: 404 });
    if (line.settles_at_payday) {
      return Response.json({
        error: 'That comrade is a member of the co-op: their time became shares and settles at pay day with everyone else\'s. There is nothing here for the council to hand over.',
      }, { status: 409 });
    }
    if (!!line.paid === paid) {
      return Response.json({ error: paid ? 'Already recorded as paid.' : 'Not recorded as paid.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const payouts = (session.payouts || []).map((p: any) => (p.user_id === handUserId
      ? {
        ...p,
        paid,
        paid_at: paid ? now : '',
        paid_by_email: paid ? user.email : '',
        paid_note: note,
      }
      : p));

    const updated = await svc.operation_session.update(sessionId, { payouts });

    await notify(base44, {
      recipient_user_id: handUserId,
      recipient_handle: line.handle,
      kind: 'payday_published',
      title: paid
        ? `Payment recorded: ${session.session_name}`
        : `A payment record was corrected: ${session.session_name}`,
      body: [
        paid
          ? `${fsisRole(user)} has recorded that your pay for this run reached you. If it did not, say so — this is a record of a transfer, not the transfer itself, and it can be corrected.`
          : 'A payment previously recorded for this run has been marked unpaid, because the record was wrong. What you are owed for the run is unchanged.',
        `You stood ${line.minutes} minutes of this run.`,
        note,
      ].filter(Boolean).join('\n\n'),
      source_type: 'operation_session',
      source_id: sessionId,
      source_name: session.session_name,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: paid ? 'operation.payout_paid' : 'operation.payout_unpaid',
      entity_type: 'operation_session',
      entity_id: sessionId,
      entity_name: session.session_name,
      actor: user.email,
      before: { paid: !!line.paid },
      after: { paid, handle: line.handle },
      notes: note || `Payout ${paid ? 'confirmed' : 'un-confirmed'} by ${fsisRole(user)}.`,
    });

    const outstanding = payouts.filter((p: any) => !p.settles_at_payday && !p.paid).length;
    return Response.json({ ok: true, session: updated, outstanding });
  } catch (error) {
    await reportError(base44, { source: 'markSessionPayoutPaid', error, route: 'markSessionPayoutPaid' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
