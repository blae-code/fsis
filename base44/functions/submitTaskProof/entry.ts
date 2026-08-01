import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * The worker files their own account of the labour performed. Proof belongs to the worker —
 * only the comrade holding the task may submit it, and only while they still hold it.
 *
 * The hours filed here are the worker's own statement of what the work took. They are NOT a
 * timesheet kept over them, and they do not become shares: task labour is settled in full and
 * directly at the agreed credit, and is never drawn from the share pool. Hours exist so the
 * council's estimate can be corrected by the people who actually did the work, and so the next
 * brief for the same job is offered honestly.
 */

/** A day's work is a long shift; beyond that the figure is a slip, not a claim. */
const MAX_FILED_HOURS = 24;
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    const proofNotes = String(body?.proof_notes || '').trim();
    const proofFileUrl = String(body?.proof_file_url || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });
    if (!proofNotes && !proofFileUrl) {
      return Response.json({ error: 'Describe the work done, or attach proof of it.' }, { status: 400 });
    }

    // Hours are optional — a comrade who does not care to count them is not held up for it.
    const hoursGiven = body?.actual_hours !== undefined && body?.actual_hours !== null && body?.actual_hours !== '';
    const actualHours = hoursGiven ? Number(body.actual_hours) : 0;
    if (hoursGiven && (!Number.isFinite(actualHours) || actualHours <= 0 || actualHours > MAX_FILED_HOURS)) {
      return Response.json(
        { error: `State the hours as a figure between 0 and ${MAX_FILED_HOURS}, or leave them out.` },
        { status: 400 },
      );
    }

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (task.assigned_user_id !== user.id) {
      return Response.json({ error: 'This task is held by another comrade.' }, { status: 403 });
    }
    if (!['claimed', 'returned', 'submitted'].includes(task.status)) {
      return Response.json({ error: 'This task is closed to further submissions.' }, { status: 409 });
    }

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      status: 'submitted',
      proof_notes: proofNotes || task.proof_notes || '',
      proof_file_url: proofFileUrl || task.proof_file_url || '',
      submitted_at: new Date().toISOString(),
      ...(hoursGiven ? { actual_hours: actualHours } : {}),
    });

    return Response.json({ ok: true, task: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}