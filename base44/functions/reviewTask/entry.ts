import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';

/**
 * Council review of filed work. Credit settles the agreed sum in full and directly —
 * task labour is paid for itself and is never drawn from the share pool.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to review work.' }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    const decision = String(body?.decision || '').trim();
    const reviewNotes = String(body?.review_notes || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });
    if (!['credit', 'return'].includes(decision)) {
      return Response.json({ error: "decision must be 'credit' or 'return'." }, { status: 400 });
    }

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (task.status !== 'submitted') {
      return Response.json({ error: 'Only filed work can be reviewed.' }, { status: 409 });
    }
    if (decision === 'return' && !reviewNotes) {
      return Response.json({ error: 'Returning work requires a reason the worker can act on.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const credited = Math.max(0, Number(body?.credited_auec ?? task.agreed_credit_auec ?? 0));

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      status: decision === 'credit' ? 'credited' : 'returned',
      credited_auec: decision === 'credit' ? credited : 0,
      reviewed_by_email: user.email,
      reviewed_at: now,
      review_notes: reviewNotes,
    });

    await base44.asServiceRole.entities.ops_log.create({
      action: decision === 'credit' ? 'labour_task.credited' : 'labour_task.returned',
      entity_type: 'labour_task',
      entity_id: taskId,
      entity_name: task.title,
      actor: user.email,
      before: { status: task.status },
      after: { status: updated.status, credited_auec: updated.credited_auec },
      notes: reviewNotes || `Reviewed by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, task: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}