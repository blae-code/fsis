import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { MARK_LIFETIME_DAYS, APPEAL_WINDOW_DAYS, MAX_SURCHARGE_PERCENT, recomputeStanding } from '../../shared/reputation.js';
import { notify } from '../../shared/notices.js';

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

    // A hand-set change to a comrade's standing is told to that comrade. Where it goes against
    // them it carries the reason, the route to answer it and the date it lapses; where it goes
    // in their favour it says so plainly rather than leaving them to notice a number move.
    const appealBy = new Date(now.getTime() + APPEAL_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
    const lapsesOn = new Date(now.getTime() + MARK_LIFETIME_DAYS * 86400000).toISOString().slice(0, 10);
    const answerRoute = `If this is wrong, you may answer it once, by ${appealBy}. An Owner or above must respond, and their reasoning will be shown back to you.`;

    const told = {
      amnesty: {
        title: 'The council has forgiven your marks',
        lines: [
          'Every mark standing against you for work handed back has been set aside and no longer counts.',
          `The council's stated reason: ${reason}`,
          'The events remain readable in your record — nothing has been erased. They simply stop counting against you.',
        ],
      },
      dismiss: {
        title: 'You have been released from the yard',
        lines: [
          `Contractor privileges are locked: you may not claim work or answer musters, and a ${MAX_SURCHARGE_PERCENT}% surcharge — not a discount — stands on your account at the storefront until an Owner reinstates you.`,
          `The council's stated reason: ${reason}`,
          answerRoute,
          `This mark lapses on ${lapsesOn} regardless of whether you answer it.`,
        ],
      },
      reinstate: {
        title: 'You have been reinstated',
        lines: [
          'The lock is lifted. You may claim work and answer musters again, and the surcharge on your account has gone.',
          `The council's stated reason: ${reason}`,
        ],
      },
      adjust: {
        title: 'The council adjusted your standing by hand',
        lines: [
          `An adjustment of ${Number(body?.delta) || 0} has been recorded against your standing.`,
          `The council's stated reason: ${reason}`,
          answerRoute,
          Number(body?.delta) < 0 ? `This mark lapses on ${lapsesOn}.` : '',
        ],
      },
    }[action as 'amnesty' | 'dismiss' | 'reinstate' | 'adjust'];

    await notify(base44, {
      recipient_user_id: memberId,
      recipient_handle: identity.member_handle,
      kind: action === 'dismiss' || action === 'adjust' ? 'standing_marked' : 'standing_lapsed',
      title: told.title,
      body: [...told.lines.filter(Boolean), `Your standing now stands at ${total}.`].join('\n\n'),
      source_type: 'User',
      source_id: memberId,
      source_name: identity.member_handle,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

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