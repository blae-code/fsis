import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * Standing a run down, out loud.
 *
 * Cancelling has told nobody. A comrade who said they were in kept the evening free, turned up at
 * the muster point, and worked out from the silence that it was off. That is a real cost paid by the
 * people most willing to give their time, and it is exactly the behaviour the collective punishes
 * buyers for at handoff — so it cannot be acceptable in the other direction.
 *
 * A reason is required. "Stood down" with no reason is barely better than silence.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to stand a run down.' }, { status: 403 });
    }

    const body = await req.json();
    const opId = String(body?.operation_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!opId) return Response.json({ error: 'operation_id is required.' }, { status: 400 });
    if (!reason) {
      return Response.json(
        { error: 'Say why. Comrades kept an evening free for this, and they are owed a reason rather than silence.' },
        { status: 400 },
      );
    }

    const op = await base44.asServiceRole.entities.crew_operation.get(opId);
    if (!op) return Response.json({ error: 'Operation not found.' }, { status: 404 });
    if (op.status === 'stood_down') {
      return Response.json({ error: 'That run has already been stood down.' }, { status: 409 });
    }
    if (op.status === 'completed') {
      return Response.json({ error: 'That run has already been flown.' }, { status: 409 });
    }

    // A run underway has hands on it and a settlement owed; it is closed, not cancelled.
    const running = await base44.asServiceRole.entities.operation_session.filter({
      operation_id: opId, status: 'underway',
    });
    if (running.length > 0) {
      return Response.json({
        error: 'That run is underway with hands on it. Settle it through closeOperationSession rather than standing it down — the time already given must still be paid.',
        session_id: running[0].id,
      }, { status: 409 });
    }

    const updated = await base44.asServiceRole.entities.crew_operation.update(opId, {
      status: 'stood_down',
      stood_down_reason: reason,
    });

    // Everyone who spoke up is told — including maybes and those waiting for a place, because they
    // were holding the time open too.
    const told = (op.rsvps || []).filter((r: any) => r?.user_id && ['in', 'maybe'].includes(r.response));

    await notifyMany(base44, told.map((rsvp: any) => ({
      recipient_user_id: rsvp.user_id,
      recipient_handle: rsvp.handle,
      kind: 'muster_stood_down',
      title: `Stood down: ${op.op_name}`,
      body: [
        rsvp.response === 'in'
          ? 'This run is off. You said you were in, so you are being told directly rather than left to find out.'
          : 'This run is off. You had said you might make it, so you are being told.',
        `The council's reason: ${reason}`,
        op.starts_at ? `It was called for ${op.starts_at}.` : '',
        'Your evening is your own. Nothing is recorded against anyone for a run that did not happen.',
      ].filter(Boolean).join('\n\n'),
      source_type: 'crew_operation',
      source_id: opId,
      source_name: op.op_name,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    await base44.asServiceRole.entities.ops_log.create({
      action: 'operation.stood_down',
      entity_type: 'crew_operation',
      entity_id: opId,
      entity_name: op.op_name,
      actor: user.email,
      before: { status: op.status },
      after: { status: 'stood_down', told: told.length },
      notes: reason,
    });

    return Response.json({ ok: true, operation: updated, told: told.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
