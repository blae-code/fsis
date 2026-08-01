import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { isReady, prerequisiteIds, unmetPrerequisites, wouldCycle } from '../../shared/tasks.js';

/**
 * The council says what must happen first — "haul after strip".
 *
 * Refused rather than written where the arrangement is impossible: a task cannot wait on itself,
 * cannot wait on work that does not exist, and cannot be put in a circle with other work, because
 * two tasks each waiting on the other can never begin and neither can anything behind them.
 *
 * This is the validating way to set a dependency, and the council's tooling should use it. The
 * guard that actually protects the board is in claimTask, which re-checks readiness against the
 * real prerequisites at the moment work is taken up — so a dependency written around this
 * function still cannot let blocked work be claimed.
 */
const MAX_PREREQUISITES = 10;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to order the work.' }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });

    const rawIds = Array.isArray(body?.blocked_by) ? body.blocked_by : [];
    if (rawIds.length > MAX_PREREQUISITES) {
      return Response.json(
        { error: `A task may wait on at most ${MAX_PREREQUISITES} other pieces of work.` },
        { status: 400 },
      );
    }
    const wanted = [...new Set(rawIds.map((id: unknown) => String(id || '').trim()).filter(Boolean))];

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (['credited', 'cancelled'].includes(task.status)) {
      return Response.json({ error: 'That work is finished; ordering it now changes nothing.' }, { status: 409 });
    }
    if (wanted.includes(taskId)) {
      return Response.json({ error: 'Work cannot wait on itself.' }, { status: 400 });
    }

    // One read of the board, rather than a lookup per link.
    const allTasks = await base44.asServiceRole.entities.labour_task.list('-created_date', 500);
    const byId = new Map(allTasks.map((t) => [t.id, t]));

    const missing = wanted.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      return Response.json({ error: `No such work: ${missing.join(', ')}.` }, { status: 400 });
    }
    if (wouldCycle(taskId, wanted, allTasks)) {
      return Response.json(
        { error: 'That would put the work in a circle — each task waiting on the other, so neither could ever begin.' },
        { status: 409 },
      );
    }

    const prereqs: any[] = wanted.map((id) => byId.get(id)).filter(Boolean);
    const blockedBy = prereqs.map((t) => ({ task_id: t.id, title: t.title || '' }));
    const outstanding = unmetPrerequisites({ blocked_by: blockedBy }, prereqs);

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      blocked_by: blockedBy,
      is_blocked: outstanding.length > 0,
    });

    await base44.asServiceRole.entities.ops_log.create({
      action: 'labour_task.ordered',
      entity_type: 'labour_task',
      entity_id: taskId,
      entity_name: task.title,
      actor: user.email,
      before: { blocked_by: prerequisiteIds(task) },
      after: { blocked_by: wanted, is_blocked: outstanding.length > 0 },
      notes: blockedBy.length > 0
        ? `Waits on: ${blockedBy.map((b) => b.title).join('; ')}`
        : 'No longer waits on other work.',
    });

    return Response.json({
      ok: true,
      task: updated,
      ready: isReady({ blocked_by: blockedBy }, prereqs),
      waiting_on: outstanding.map((t) => ({ task_id: t.id, title: t.title, status: t.status })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
