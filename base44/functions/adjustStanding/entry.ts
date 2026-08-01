import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { MARK_LIFETIME_DAYS, APPEAL_WINDOW_DAYS, MAX_SURCHARGE_PERCENT, recomputeStanding } from '../../shared/reputation.js';

/**
 * The council sets standing by hand: an award, a mark, an amnesty, a dismissal or a
 * reinstatement. Every one is an audited event with an actor and a stated reason, appended
 * to a record that is never rewritten. Nothing here happens quietly.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to set another comrade\u2019s standing.' }, { status: 403 });
    }

    const body = await req.json();
    const memberId = String(body?.member_user_id || '').trim();
    const action = String(body?.action || 'adjust').trim();
    const reason = String(body?.reason || '').trim();
    if (!memberId) return Response.json({ error: 'member_user_id is required.' }, { status: 400 });
    if (!reason) return Response.json({ error: 'A reason is required — the comrade will read it.' }, { status: 400 });
    if (!['adjust', 'dismiss', 'reinstate', 'amnesty'].includes(action)) {
      return Response.json({ error: "action must be 'adjust', 'dismiss', 'reinstate' or 'amnesty'." }, { status: 400 });
    }

    const member = await base44.asServiceRole.entities.User.get(memberId);
    if (!member) return Response.json({ error: 'Member not found.' }, { status: 404 });

    const now = new Date();
    const identity = {
      member_user_id: memberId,
      member_email: member.email,
      member_handle: member.handle || member.full_name || member.email,
      actor_email: user.email,
      actor_role: fsisRole(user),
      source_type: 'council',
      reason,
    };

    if (action === 'amnesty') {
      // Marks are forgiven by voiding them — the events remain readable, they simply stop counting.
      const marks = await base44.asServiceRole.entities.standing_event.filter(
        { member_user_id: memberId, kind: 'work_abandoned', voided: false }, '-created_date', 200,
      );
      if (marks.length > 0) {
        await base44.asServiceRole.entities.standing_event.bulkUpdate(
          marks.map((m) => ({ id: m.id, voided: true, ruling: `Amnesty by ${user.email}: ${reason}` })),
        );
      }
      await base44.asServiceRole.entities.standing_event.create({
        ...identity, kind: 'amnesty', delta: 0, effective_delta: 0,
        source_name: `${marks.length} mark(s) forgiven`,
      });
    } else if (action === 'dismiss') {
      const delta = -Math.abs(Number(body?.delta) || 25);
      await base44.asServiceRole.entities.User.update(memberId, {
        standing_locked: true,
        standing_locked_reason: reason,
      });
      await base44.asServiceRole.entities.standing_event.create({
        ...identity, kind: 'dismissed', delta, effective_delta: delta,
        appeal_due_by: new Date(now.getTime() + APPEAL_WINDOW_DAYS * 86400000).toISOString(),
        expires_at: new Date(now.getTime() + MARK_LIFETIME_DAYS * 86400000).toISOString(),
        source_name: `Dismissed — ${MAX_SURCHARGE_PERCENT}% storefront surcharge stands`,
      });
    } else if (action === 'reinstate') {
      await base44.asServiceRole.entities.User.update(memberId, {
        standing_locked: false,
        standing_locked_reason: '',
      });
      await base44.asServiceRole.entities.standing_event.create({
        ...identity, kind: 'reinstated', delta: 0, effective_delta: 0,
      });
    } else {
      const delta = Number(body?.delta) || 0;
      if (!delta) return Response.json({ error: 'An adjustment of zero changes nothing.' }, { status: 400 });
      await base44.asServiceRole.entities.standing_event.create({
        ...identity, kind: 'council_adjustment', delta, effective_delta: delta,
        appeal_due_by: new Date(now.getTime() + APPEAL_WINDOW_DAYS * 86400000).toISOString(),
        expires_at: delta < 0 ? new Date(now.getTime() + MARK_LIFETIME_DAYS * 86400000).toISOString() : undefined,
      });
    }

    const total = await recomputeStanding(base44, memberId);

    await base44.asServiceRole.entities.ops_log.create({
      action: `standing.${action}`,
      entity_type: 'User',
      entity_id: memberId,
      entity_name: member.handle || member.email,
      actor: user.email,
      after: { standing_total: total, locked: action === 'dismiss' ? true : action === 'reinstate' ? false : member.standing_locked },
      notes: reason,
    });

    return Response.json({ ok: true, reputation: total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}