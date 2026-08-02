import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { MUSTER_ROLES, offersRole, placeAnswer, promoteFromWaitlist, slotState } from '../../shared/musters.js';
import { notify } from '../../shared/notices.js';

/**
 * A comrade answers a muster, and takes a place in it.
 *
 * Attendance is volunteered, never rostered onto anyone, and each member speaks only for themselves.
 * A comrade picks their own place; where that place is already full their answer joins a waitlist in
 * the order it arrived, which is not a refusal. When somebody stands down, the next in line takes
 * the place and is told so — a place that comes free silently is a place nobody knows they have.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'Only members of the outfit may answer a muster.' }, { status: 403 });
    }
    if (user.membership_status === 'suspended') {
      return Response.json({ error: 'Your standing is suspended pending council review.' }, { status: 403 });
    }
    if (user.standing_locked) {
      return Response.json({ error: 'You were released from the yard and may not answer musters until an Owner reinstates you.' }, { status: 403 });
    }

    const body = await req.json();
    const opId = String(body?.operation_id || '').trim();
    const response = String(body?.response || '').trim();
    const note = String(body?.note || '').trim();
    const wantedRole = String(body?.role || 'any').trim();
    if (!opId) return Response.json({ error: 'operation_id is required.' }, { status: 400 });
    if (!['in', 'maybe', 'out'].includes(response)) {
      return Response.json({ error: "response must be 'in', 'maybe' or 'out'." }, { status: 400 });
    }
    if (!MUSTER_ROLES.includes(wantedRole)) {
      return Response.json({ error: `role must be one of: ${MUSTER_ROLES.join(', ')}.` }, { status: 400 });
    }

    const op = await base44.asServiceRole.entities.crew_operation.get(opId);
    if (!op) return Response.json({ error: 'Operation not found.' }, { status: 404 });
    if (['completed', 'stood_down'].includes(op.status)) {
      return Response.json({ error: 'That operation is closed to further answers.' }, { status: 409 });
    }
    if (response === 'in' && !offersRole(op, wantedRole)) {
      return Response.json({ error: 'This run is not calling for that place.' }, { status: 409 });
    }

    const previous = (op.rsvps || []).find((r: any) => r.user_id === user.id) || null;
    const placed = placeAnswer(op, op.rsvps, user, { response, role: wantedRole, note });
    let rsvps = placed.rsvps;

    // A comrade standing down frees their place — the next in line takes it rather than the place
    // sitting empty because nobody was watching.
    let promoted = null;
    if (previous && previous.response === 'in' && !previous.waitlisted && response !== 'in') {
      const result = promoteFromWaitlist(op, rsvps, previous.role || 'any');
      rsvps = result.rsvps;
      promoted = result.promoted;
    }

    const updated = await base44.asServiceRole.entities.crew_operation.update(opId, { rsvps });

    if (promoted) {
      await notify(base44, {
        recipient_user_id: promoted.user_id,
        recipient_handle: promoted.handle,
        kind: 'muster_called',
        title: `A place came free: ${op.op_name}`,
        body: [
          `You were waiting for a ${promoted.role || 'any'} place on this run, and one has come free. You are on.`,
          op.starts_at ? `The muster is at ${op.starts_at}.` : '',
          op.muster_location ? `Gathering at ${op.muster_location}.` : '',
          'If you can no longer make it, say so and the next comrade waiting takes the place.',
        ].filter(Boolean).join('\n\n'),
        source_type: 'crew_operation',
        source_id: opId,
        source_name: op.op_name,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });
    }

    return Response.json({
      ok: true,
      operation: updated,
      waitlisted: placed.waitlisted,
      role: wantedRole,
      slots: slotState(op, rsvps),
      note: placed.waitlisted
        ? 'That place is full, so you are next in line for it — answers are taken in the order they arrive. You will be told the moment one comes free.'
        : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}