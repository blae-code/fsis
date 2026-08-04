import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * Somebody went and got it.
 *
 * `checkProcessingTimers` announces a hopper is ready and there it stopped: `collected` and
 * `abandoned` were in the enum and nothing wrote either. So every finished job sat at `ready`
 * forever, the panel filled with things that had long since been fetched, and the one signal that
 * actually mattered — material standing unclaimed and at risk — was buried under everything already
 * dealt with.
 *
 * Abandoning is a real outcome and is stated rather than hidden: material lost to a patch, a wipe,
 * or a hold nobody could reach. A job quietly deleted teaches nobody anything.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const jobId = String(body?.job_id || '').trim();
    const outcome = String(body?.outcome || 'collected').trim();
    const notes = String(body?.notes || '').trim();
    if (!jobId) return Response.json({ error: 'job_id is required.' }, { status: 400 });
    if (!['collected', 'abandoned'].includes(outcome)) {
      return Response.json({ error: "outcome must be 'collected' or 'abandoned'." }, { status: 400 });
    }
    if (outcome === 'abandoned' && !notes) {
      return Response.json({
        error: 'Say what happened to it. Material written off without a word teaches the yard nothing.',
      }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const job = await svc.processing_job.get(jobId);
    if (!job) return Response.json({ error: 'No such job.' }, { status: 404 });
    if (['collected', 'abandoned'].includes(job.status)) {
      return Response.json({ error: `That job is already ${job.status}.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const claim = await svc.processing_job.updateMany(
      { id: jobId, status: job.status },
      {
        $set: {
          status: outcome,
          collected_at: now,
          collected_by_handle: callsignFor(user),
          ...(notes ? { notes: [job.notes, notes].filter(Boolean).join('\n') } : {}),
        },
      },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That job changed while you were reading it.' }, { status: 409 });
    }

    // The comrades watching it should stop watching for something already dealt with.
    const watchers = (job.watcher_user_ids || []).filter((id: string) => id && id !== user.id);
    await notifyMany(base44, watchers.map((id: string) => ({
      recipient_user_id: id,
      kind: 'order_update',
      title: outcome === 'collected'
        ? `Collected: ${job.label}`
        : `Written off: ${job.label}`,
      body: outcome === 'collected'
        ? `${callsignFor(user)} has collected this. Nothing is standing at ${job.location || 'the refinery'} any longer.`
        : [`This has been written off rather than collected.`, `What happened: ${notes}`].join('\n\n'),
      source_type: 'processing_job',
      source_id: jobId,
      source_name: job.label,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    await svc.ops_log.create({
      action: `processing.${outcome}`,
      entity_type: 'processing_job',
      entity_id: jobId,
      entity_name: job.label,
      actor: user.email,
      before: { status: job.status },
      after: { status: outcome },
      notes: notes || `Collected by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, status: outcome, told: watchers.length });
  } catch (error) {
    await reportError(base44, { source: 'collectProcessing', error, route: 'collectProcessing' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
