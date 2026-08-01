import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';

/**
 * A comrade takes up a posted task. Work is claimed freely — nobody is assigned labour
 * they did not agree to — but a task already held by someone else cannot be taken.
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
    if (task.status !== 'posted') {
      return Response.json({ error: 'That task is no longer open on the board.' }, { status: 409 });
    }

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      status: 'claimed',
      assigned_user_id: user.id,
      assigned_email: user.email,
      assigned_handle: user.handle || user.full_name || user.email,
      claimed_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, task: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}