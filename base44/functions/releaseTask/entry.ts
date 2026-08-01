import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { abandonmentCost, MARK_LIFETIME_DAYS, APPEAL_WINDOW_DAYS, recomputeStanding } from '../../shared/reputation.js';
import { notify } from '../../shared/notices.js';

/**
 * A comrade hands back work in hand. Nobody is chained to a task they cannot finish — but
 * walking away costs the collective time it cannot recover, so the cost is assessed openly,
 * weighted by the harm done, and may be appealed.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });
    if (!reason) {
      return Response.json({ error: 'State plainly why the work is being handed back — the council will read it.' }, { status: 400 });
    }

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (task.assigned_user_id !== user.id) {
      return Response.json({ error: 'That work is not in your hands.' }, { status: 403 });
    }
    if (!['claimed', 'returned'].includes(task.status)) {
      return Response.json({ error: 'Only work still in hand can be handed back.' }, { status: 409 });
    }

    const now = new Date();
    const delta = abandonmentCost(task);
    const appealDueBy = new Date(now.getTime() + APPEAL_WINDOW_DAYS * 86400000);
    const markExpiresAt = new Date(now.getTime() + MARK_LIFETIME_DAYS * 86400000);

    await base44.asServiceRole.entities.labour_task.update(taskId, {
      status: 'posted',
      assigned_user_id: null,
      assigned_email: null,
      assigned_handle: null,
      claimed_at: null,
      notes: [task.notes, `Handed back ${now.toISOString().slice(0, 10)} by ${user.handle || user.email}: ${reason}`]
        .filter(Boolean).join('\n'),
    });

    const event = await base44.asServiceRole.entities.standing_event.create({
      member_user_id: user.id,
      member_email: user.email,
      member_handle: user.handle || user.full_name || user.email,
      kind: 'work_abandoned',
      delta,
      effective_delta: delta,
      reason: `Work handed back: ${task.title}. Stated cause: ${reason}`,
      source_type: 'labour_task',
      source_id: taskId,
      source_name: task.title,
      actor_email: 'FSIS.bot',
      actor_role: 'system',
      appeal_status: 'none',
      appeal_due_by: appealDueBy.toISOString(),
      expires_at: markExpiresAt.toISOString(),
    });

    const total = await recomputeStanding(base44, user.id);

    await base44.asServiceRole.entities.ops_log.create({
      action: 'labour_task.handed_back',
      entity_type: 'labour_task',
      entity_id: taskId,
      entity_name: task.title,
      actor: user.email,
      before: { status: task.status, assigned_handle: task.assigned_handle },
      after: { status: 'posted', standing_delta: delta, standing_total: total },
      notes: reason,
    });

    // A mark is never applied silently. The comrade is told what it cost, how the figure was
    // reached, by when they may answer it, and the date it lapses of its own accord.
    await notify(base44, {
      recipient_user_id: user.id,
      recipient_handle: user.handle || user.full_name || user.email,
      kind: 'work_released',
      title: `You handed back: ${task.title}`,
      body: [
        `The work has returned to the board and is open to any hand. Nobody is chained to a task they cannot finish.`,
        `A mark of ${delta} standing has been recorded. It is weighted by the harm actually done — how close the deadline stood, how urgent the work was, and what had been agreed for it — not by the fact of walking away. Your standing now stands at ${total}.`,
        `Your stated cause, as the council will read it: ${reason}`,
        `If the assessment is wrong, you may answer it once, by ${appealDueBy.toISOString().slice(0, 10)}. An Owner or above must respond, and their reasoning will be shown back to you.`,
        `Whether or not you answer it, this mark lapses on ${markExpiresAt.toISOString().slice(0, 10)}. No comrade is condemned in perpetuity by one bad month.`,
      ].join('\n\n'),
      source_type: 'standing_event',
      source_id: event?.id,
      source_name: task.title,
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    });

    return Response.json({ ok: true, standing_event: event, reputation: total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}