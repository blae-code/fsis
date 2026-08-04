import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyMany } from '../../shared/notices.js';
import { reportError, recordSweep } from '../../shared/diagnostics.js';

/**
 * Telling the comrades watching a hopper that it is out.
 *
 * A refinery run that finishes at four in the morning has sat there until somebody happened to look.
 * Material left standing is material at risk, and the hand who went out and won it is the one who
 * loses by it.
 *
 * Runs on a schedule. Each job is claimed before anybody is told, so an overlapping sweep cannot
 * wake the same comrades twice for the same hopper.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const sweepStartedAt = new Date();
  /** Record that the sweep ran — the absence of these rows is how a stopped sweep is found. */
  const recordAnd = async (payload: any) => {
    await recordSweep(base44, { job: 'checkProcessingTimers', ok: true, outcome: payload, startedAt: sweepStartedAt });
    return Response.json(payload);
  };
  try {
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const running = await svc.processing_job.filter(
      { status: 'running', notified: false }, 'ready_at', 200,
    );
    const ready = running.filter((job: any) => job.ready_at && new Date(job.ready_at) <= now);

    if (ready.length === 0) {
      return recordAnd({ ok: true, ready: 0, watched: running.length });
    }

    let told = 0;
    const announced = [];

    for (const job of ready) {
      // Claim it before telling anyone.
      const claim = await svc.processing_job.updateMany(
        { id: job.id, notified: false },
        { $set: { notified: true, status: 'ready' } },
      );
      if (!claim || claim.updated === 0) continue;

      const watchers = (job.watcher_user_ids || []).filter(Boolean);
      if (watchers.length > 0) {
        await notifyMany(base44, watchers.map((userId: string) => ({
          recipient_user_id: userId,
          kind: 'order_update',
          title: `Ready to collect: ${job.label}`,
          body: [
            'This has finished processing and is waiting to be collected.',
            job.location ? `It is at ${job.location}.` : '',
            job.quantity_scu > 0 ? `${job.quantity_scu} SCU.` : '',
            'Material left standing is material at risk — somebody should go and get it.',
          ].filter(Boolean).join('\n\n'),
          source_type: 'processing_job',
          source_id: job.id,
          source_name: job.label,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        })));
        told += watchers.length;
      }
      announced.push({ label: job.label, watchers: watchers.length });
    }

    if (announced.length > 0) {
      await svc.ops_log.create({
        action: 'processing.ready',
        entity_type: 'processing_job',
        entity_name: `${announced.length} job(s)`,
        actor: 'FSIS.bot',
        after: { ready: announced.length, notices: told },
        notes: announced.map((a) => `${a.label} → ${a.watchers}`).join('; '),
      });
    }

    return recordAnd({ ok: true, ready: announced.length, notices_sent: told, watched: running.length });
  } catch (error) {
    await reportError(base44, { source: 'checkProcessingTimers', error, route: 'checkProcessingTimers' });
    await recordSweep(base44, { job: 'checkProcessingTimers', ok: false, error, startedAt: sweepStartedAt });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
