import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import {
  activeHands, crewFields, handFor, handsNeeded, holdsTask, isFullyCrewed, statusForCrew,
} from '../../shared/tasks.js';

/**
 * A comrade takes up a posted task. Work is claimed freely — nobody is assigned labour they did
 * not agree to — and work that calls for several hands may be taken up by several comrades.
 *
 * The claim is atomic. Two comrades reaching for the last place at the same moment must not both
 * get it, so the update states the crew count it believed and lands only if that is still true.
 * The loser is told the place went, not handed a place that does not exist.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'Only members of the outfit may take up work.' }, { status: 403 });
    }
    if (user.membership_status === 'suspended') {
      return Response.json({ error: 'Your standing is suspended pending council review.' }, { status: 403 });
    }
    if (user.standing_locked) {
      return Response.json({
        error: `You were released from the yard and may not take up work until an Owner reinstates you.${user.standing_locked_reason ? ` Reason recorded: ${user.standing_locked_reason}` : ''}`,
      }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (!['posted', 'claimed'].includes(task.status)) {
      return Response.json({ error: 'That task is no longer open on the board.' }, { status: 409 });
    }
    if (holdsTask(task, user.id)) {
      return Response.json({ error: 'You already hold this work.' }, { status: 409 });
    }
    if (isFullyCrewed(task)) {
      return Response.json({ error: 'This work has all the hands it asked for.' }, { status: 409 });
    }

    // Tasks written before crews existed carry only the single-hand fields; fold that lead hand
    // into the crew as we go, so an older task gains a crew rather than losing its holder.
    const existing = (task.crew && task.crew.length > 0)
      ? task.crew
      : (task.assigned_user_id
        ? [{
          user_id: task.assigned_user_id,
          handle: task.assigned_handle || '',
          email: task.assigned_email || '',
          claimed_at: task.claimed_at || new Date(0).toISOString(),
          released_at: '',
          submitted_at: task.submitted_at || '',
          proof_notes: task.proof_notes || '',
          proof_file_url: task.proof_file_url || '',
          actual_hours: Number(task.actual_hours) || 0,
          credited_auec: 0,
        }]
        : []);

    const nextCrew = [...existing, handFor(user)];
    const fields = crewFields(nextCrew);
    const nextStatus = statusForCrew({ ...task, crew: fields.crew, hands_needed: task.hands_needed }, task.status);

    // Compare-and-swap on what we actually read. If another comrade claimed in between, this
    // matches nothing and we say so plainly rather than over-crewing the work.
    //
    // Tasks posted before crews existed carry no crew_count at all, and a filter on a field the
    // record does not have matches nothing — which would leave every older task unclaimable. For
    // those we swap on the status instead: no better than the single-hand claim has ever been, but
    // no worse either, and the first claim writes a crew_count that every later claim can swap on.
    const casFilter = typeof task.crew_count === 'number'
      ? { id: taskId, crew_count: task.crew_count }
      : { id: taskId, status: task.status };

    const claim = await base44.asServiceRole.entities.labour_task.updateMany(
      casFilter,
      { $set: { ...fields, status: nextStatus } },
    );
    if (!claim || claim.updated === 0) {
      return Response.json(
        { error: 'Another comrade took that place while you were reading. The board has moved on.' },
        { status: 409 },
      );
    }

    const updated = await base44.asServiceRole.entities.labour_task.get(taskId);
    return Response.json({
      ok: true,
      task: updated,
      hands_on: fields.crew_count,
      hands_needed: handsNeeded(task),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}