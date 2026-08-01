import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';

/**
 * A comrade answers a muster. Attendance is volunteered, never rostered onto anyone,
 * and each member speaks only for themselves.
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
    if (!opId) return Response.json({ error: 'operation_id is required.' }, { status: 400 });
    if (!['in', 'maybe', 'out'].includes(response)) {
      return Response.json({ error: "response must be 'in', 'maybe' or 'out'." }, { status: 400 });
    }

    const op = await base44.asServiceRole.entities.crew_operation.get(opId);
    if (!op) return Response.json({ error: 'Operation not found.' }, { status: 404 });
    if (['completed', 'stood_down'].includes(op.status)) {
      return Response.json({ error: 'That operation is closed to further answers.' }, { status: 409 });
    }

    const entry = {
      user_id: user.id,
      handle: user.handle || user.full_name || user.email,
      standing: role,
      response,
      note,
      responded_at: new Date().toISOString(),
    };
    const rsvps = [...(op.rsvps || []).filter((r) => r.user_id !== user.id), entry];

    const updated = await base44.asServiceRole.entities.crew_operation.update(opId, { rsvps });
    return Response.json({ ok: true, operation: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}