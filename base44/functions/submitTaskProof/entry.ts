import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allHandsFiled, crewFields, holdsTask, withHandUpdated } from '../../shared/tasks.js';

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

    const onCrew = holdsTask(task, user.id);
    const isLegacyHolder = !onCrew && (task.crew || []).length === 0 && task.assigned_user_id === user.id;
    if (!onCrew && !isLegacyHolder) {
      return Response.json({ error: 'This task is held by another comrade.' }, { status: 403 });
    }
    if (!['posted', 'claimed', 'returned', 'submitted'].includes(task.status)) {
      return Response.json({ error: 'This task is closed to further submissions.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const filed = {
      submitted_at: now,
      proof_notes: proofNotes || '',
      proof_file_url: proofFileUrl || '',
      ...(hoursGiven ? { actual_hours: actualHours } : {}),
    };

    // Each hand files their own account of their own labour. Where the work called for several
    // hands, the task waits for all of them before it goes to the council — one comrade's proof
    // is not an answer for the others, and the council should judge the work whole.
    const nextCrew = onCrew ? withHandUpdated(task, user.id, filed) : [];
    const fields = onCrew ? crewFields(nextCrew) : {};
    const everyoneFiled = onCrew ? allHandsFiled({ ...task, crew: nextCrew }) : true;

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      ...fields,
      status: everyoneFiled ? 'submitted' : task.status,
      // The task-level proof mirrors the most recent filing, so anything reading a task the old
      // single-hand way still sees an account of the work.
      proof_notes: proofNotes || task.proof_notes || '',
      proof_file_url: proofFileUrl || task.proof_file_url || '',
      submitted_at: now,
      ...(hoursGiven ? { actual_hours: actualHours } : {}),
    });

    return Response.json({
      ok: true,
      task: updated,
      awaiting_other_hands: !everyoneFiled,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}