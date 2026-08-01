import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { recomputeStanding } from '../../shared/reputation.js';

/**
 * An Owner or the Proprietor rules on an appeal. The mark may be upheld, reduced, increased
 * or wholly neutralised — and whichever it is, the reasoning is recorded and shown back to
 * the worker. The original assessment is never erased; only what it counts for changes.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to rule on an appeal.' }, { status: 403 });
    }

    const body = await req.json();
    const eventId = String(body?.event_id || '').trim();
    const outcome = String(body?.outcome || '').trim();
    const ruling = String(body?.ruling || '').trim();
    if (!eventId) return Response.json({ error: 'event_id is required.' }, { status: 400 });
    if (!['upheld', 'reduced', 'neutralised', 'increased'].includes(outcome)) {
      return Response.json({ error: "outcome must be 'upheld', 'reduced', 'neutralised' or 'increased'." }, { status: 400 });
    }
    if (!ruling) return Response.json({ error: 'Give your reasoning — the worker is owed it.' }, { status: 400 });

    const event = await base44.asServiceRole.entities.standing_event.get(eventId);
    if (!event) return Response.json({ error: 'That standing event does not exist.' }, { status: 404 });
    if (event.appeal_status !== 'filed') {
      return Response.json({ error: 'There is no open appeal on that event.' }, { status: 409 });
    }

    const original = Number(event.delta) || 0;
    let effective = original;
    if (outcome === 'neutralised') effective = 0;
    else if (outcome === 'reduced') effective = -Math.min(Math.abs(original), Math.abs(Number(body?.effective_delta) || Math.round(original / 2)));
    else if (outcome === 'increased') effective = -Math.abs(Number(body?.effective_delta) || Math.abs(original) * 2);

    const updated = await base44.asServiceRole.entities.standing_event.update(eventId, {
      appeal_status: outcome,
      effective_delta: effective,
      voided: outcome === 'neutralised',
      ruling,
      ruled_by_email: user.email,
      ruled_at: new Date().toISOString(),
    });

    const total = await recomputeStanding(base44, event.member_user_id);

    await base44.asServiceRole.entities.ops_log.create({
      action: `standing.appeal_${outcome}`,
      entity_type: 'standing_event',
      entity_id: eventId,
      entity_name: event.source_name || event.kind,
      actor: user.email,
      before: { effective_delta: event.effective_delta },
      after: { effective_delta: effective, standing_total: total },
      notes: `${ruling} (ruled by ${fsisRole(user)})`,
    });

    return Response.json({ ok: true, standing_event: updated, reputation: total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}