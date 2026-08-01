import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { openStint } from '../../shared/sessions.js';

/**
 * A run begins.
 *
 * Either from a muster already called, or from nothing at all — "I am going out now, who is on?"
 * is the most-used flow in a yard that flies opportunistically, and it is a run before it is ever
 * a notice. So an operation is optional here.
 *
 * The comrade who starts the run is counted present from the moment they start it. They are, after
 * all, there.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to call a run.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const operationId = String(body?.operation_id || '').trim();
    const givenName = String(body?.session_name || '').trim();
    const opType = String(body?.op_type || '').trim();

    let operation = null;
    if (operationId) {
      operation = await base44.asServiceRole.entities.crew_operation.get(operationId);
      if (!operation) return Response.json({ error: 'No such muster.' }, { status: 404 });

      // One run at a time per muster: a second would split the attendance and pay nobody properly.
      const running = await base44.asServiceRole.entities.operation_session.filter({
        operation_id: operationId, status: 'underway',
      });
      if (running.length > 0) {
        return Response.json(
          { error: 'That muster already has a run underway.', session_id: running[0].id },
          { status: 409 },
        );
      }
    }

    const sessionName = givenName || operation?.op_name || `Run — ${new Date().toISOString().slice(0, 10)}`;
    const now = new Date();
    const firstStint = openStint(user, now);

    const session = await base44.asServiceRole.entities.operation_session.create({
      operation_id: operationId,
      session_name: sessionName,
      op_type: opType || operation?.op_type || 'salvage',
      status: 'underway',
      started_at: now.toISOString(),
      started_by_email: user.email,
      attendance: [firstStint],
      attendance_user_ids: [user.id],
      costs: [],
      gross_auec: 0,
    });

    if (operationId) {
      await base44.asServiceRole.entities.crew_operation.update(operationId, { status: 'underway' });
    }

    await base44.asServiceRole.entities.ops_log.create({
      action: 'operation.session_started',
      entity_type: 'operation_session',
      entity_id: session.id,
      entity_name: sessionName,
      actor: user.email,
      after: { operation_id: operationId, started_at: now.toISOString() },
      notes: `Run started by ${fsisRole(user)}${operationId ? '' : ' without a muster (ad-hoc)'}.`,
    });

    return Response.json({ ok: true, session });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
