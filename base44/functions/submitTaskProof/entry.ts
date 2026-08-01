import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * The worker files their own account of the labour performed. Proof belongs to the worker —
 * only the comrade holding the task may submit it, and only while they still hold it.
 */
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
    });

    return Response.json({ ok: true, task: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}