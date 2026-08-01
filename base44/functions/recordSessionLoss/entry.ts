import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { totalLosses } from '../../shared/sessions.js';
import { roundAuec } from '../../shared/money.js';

/**
 * A hull destroyed, cargo lost, a claim timer running.
 *
 * Recorded so the collective can make the comrade whole, and so nobody misses a claim window. Never
 * so it can be held against them — losses are the collective's, not the pilot's, and a loss log that
 * quietly becomes a competence record is worse than no loss log at all.
 *
 * Losses are kept apart from the running costs and are NOT deducted from the split. A comrade who
 * lost a hull has already borne it; taking it out of the crew's share as well would charge the
 * collective's bad luck to the people who were there for it.
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
    const sessionId = String(body?.session_id || '').trim();
    const label = String(body?.label || '').trim();
    const kind = String(body?.kind || 'other').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });
    if (!label) return Response.json({ error: 'Say what was lost.' }, { status: 400 });
    if (!['hull', 'cargo', 'other'].includes(kind)) {
      return Response.json({ error: "kind must be 'hull', 'cargo' or 'other'." }, { status: 400 });
    }

    const rawValue = Number(body?.estimated_auec);
    if (body?.estimated_auec !== undefined && (!Number.isFinite(rawValue) || rawValue < 0)) {
      return Response.json({ error: 'State the value as a figure of zero or more.' }, { status: 400 });
    }

    const session = await base44.asServiceRole.entities.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
    if (session.status === 'closed') {
      return Response.json({ error: 'That run is settled; its record is not rewritten after the fact.' }, { status: 409 });
    }

    const entry = {
      kind,
      label,
      handle: String(body?.handle || '').trim(),
      estimated_auec: roundAuec(rawValue),
      claim_until: String(body?.claim_until || '').trim(),
      recorded_at: new Date().toISOString(),
    };
    const losses = [...(session.losses || []), entry];

    const updated = await base44.asServiceRole.entities.operation_session.update(sessionId, { losses });

    await base44.asServiceRole.entities.ops_log.create({
      action: 'operation.loss_recorded',
      entity_type: 'operation_session',
      entity_id: sessionId,
      entity_name: session.session_name,
      actor: user.email,
      after: { kind, label, estimated_auec: entry.estimated_auec },
      notes: `Loss recorded by ${fsisRole(user)}${entry.handle ? ` — borne by ${entry.handle}` : ''}.`,
    });

    return Response.json({
      ok: true,
      losses: updated.losses || losses,
      total_lost_auec: roundAuec(totalLosses(losses)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
