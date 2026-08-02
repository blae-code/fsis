import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { roundAuec } from '../../shared/money.js';

/** A refinery run longer than this is a typed figure gone wrong, not a real job. */
const MAX_HOURS = 72;

/**
 * A hopper set going, and a countdown somebody will actually be told about.
 *
 * Refining happens on a clock the game keeps and the app has never known about, so a run that
 * finished at four in the morning sat there until somebody happened to check. Material left standing
 * is material at risk, and the comrade who went out and won it is the one who loses by it.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const label = String(body?.label || '').trim();
    if (!label) return Response.json({ error: 'Say what is being processed.' }, { status: 400 });

    const hours = Number(body?.hours);
    const readyAtGiven = String(body?.ready_at || '').trim();
    if (!Number.isFinite(hours) && !readyAtGiven) {
      return Response.json({ error: 'Give either the hours it takes or the time it is ready.' }, { status: 400 });
    }
    if (readyAtGiven === '' && (!Number.isFinite(hours) || hours <= 0 || hours > MAX_HOURS)) {
      return Response.json({ error: `Hours must be between 0 and ${MAX_HOURS}.` }, { status: 400 });
    }

    const now = new Date();
    const readyAt = readyAtGiven ? new Date(readyAtGiven) : new Date(now.getTime() + hours * 3600000);
    if (Number.isNaN(readyAt.getTime())) {
      return Response.json({ error: 'That is not a time.' }, { status: 400 });
    }
    if (readyAt <= now) {
      return Response.json({ error: 'That time has already passed — nothing would ever be watched for.' }, { status: 400 });
    }

    // Whoever set it going is watching by default; anybody else who wants telling can be added.
    const watchers = [...new Set([
      user.id,
      ...(Array.isArray(body?.watcher_user_ids) ? body.watcher_user_ids : [])
        .map((id: unknown) => String(id || '').trim()).filter(Boolean),
    ])];

    const job = await base44.asServiceRole.entities.processing_job.create({
      label,
      operation_session_id: String(body?.operation_session_id || '').trim(),
      location: String(body?.location || '').trim(),
      material: String(body?.material || '').trim(),
      quantity_scu: Number(body?.quantity_scu) > 0 ? Number(body.quantity_scu) : 0,
      started_at: now.toISOString(),
      ready_at: readyAt.toISOString(),
      status: 'running',
      notified: false,
      watcher_user_ids: watchers,
      started_by_email: user.email,
      est_value_auec: roundAuec(body?.est_value_auec),
      notes: String(body?.notes || '').trim(),
    });

    await base44.asServiceRole.entities.ops_log.create({
      action: 'processing.started',
      entity_type: 'processing_job',
      entity_id: job.id,
      entity_name: label,
      actor: user.email,
      after: { ready_at: readyAt.toISOString(), watchers: watchers.length },
      notes: `Set going by ${fsisRole(user)}.`,
    });

    return Response.json({
      ok: true,
      job,
      ready_in_minutes: Math.round((readyAt.getTime() - now.getTime()) / 60000),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
