import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { creditAward, recomputeStanding } from '../../shared/reputation.js';
import { notifyMany } from '../../shared/notices.js';
import {
  activeHands, crewFields, splitCredit, withHandUpdated, unmetPrerequisites, prerequisiteIds,
} from '../../shared/tasks.js';
import { roundAuec } from '../../shared/money.js';

/**
 * Council review of filed work. Credit settles the agreed sum in full and directly —
 * task labour is paid for itself and is never drawn from the share pool.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to review work.' }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body?.task_id || '').trim();
    const decision = String(body?.decision || '').trim();
    const reviewNotes = String(body?.review_notes || '').trim();
    if (!taskId) return Response.json({ error: 'task_id is required.' }, { status: 400 });
    if (!['credit', 'return'].includes(decision)) {
      return Response.json({ error: "decision must be 'credit' or 'return'." }, { status: 400 });
    }

    const task = await base44.asServiceRole.entities.labour_task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    if (task.status !== 'submitted') {
      return Response.json({ error: 'Only filed work can be reviewed.' }, { status: 409 });
    }
    if (decision === 'return' && !reviewNotes) {
      return Response.json({ error: 'Returning work requires a reason the worker can act on.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const credited = roundAuec(Math.max(0, Number(body?.credited_auec ?? task.agreed_credit_auec ?? 0)));

    // Every hand that held this work. Older tasks carry a single holder and no crew; they are read
    // as a crew of one so there is only one settlement path to reason about.
    const hands: any[] = activeHands(task).length > 0
      ? activeHands(task)
      : (task.assigned_user_id
        ? [{
          user_id: task.assigned_user_id,
          handle: task.assigned_handle || '',
          email: task.assigned_email || '',
          claimed_at: task.claimed_at || '',
        }]
        : []);

    // Divided equally, with the remainder handed out a credit at a time rather than rounded away,
    // so what the crew receives adds up to exactly what was agreed.
    const perHand = decision === 'credit' ? splitCredit(credited, hands) : {};

    let nextCrew = task.crew || [];
    if (decision === 'credit') {
      for (const hand of hands) {
        nextCrew = withHandUpdated({ crew: nextCrew }, hand.user_id, { credited_auec: perHand[hand.user_id] || 0 });
      }
    }
    const fields = nextCrew.length > 0 ? crewFields(nextCrew) : {};

    const updated = await base44.asServiceRole.entities.labour_task.update(taskId, {
      ...fields,
      status: decision === 'credit' ? 'credited' : 'returned',
      credited_auec: decision === 'credit' ? credited : 0,
      reviewed_by_email: user.email,
      reviewed_at: now,
      review_notes: reviewNotes,
    });

    // Labour given is recorded in the standing of every hand that gave it, the moment it is
    // credited. Each hand earns the full award — standing is a record of labour given, and three
    // comrades who stripped a hull each gave their labour to it. It is not a pot to be divided.
    const standingAwarded = decision === 'credit' ? creditAward(task) : 0;
    if (decision === 'credit' && hands.length > 0) {
      await base44.asServiceRole.entities.standing_event.bulkCreate(hands.map((hand) => ({
        member_user_id: hand.user_id,
        member_email: hand.email,
        member_handle: hand.handle,
        kind: 'work_credited',
        delta: standingAwarded,
        effective_delta: standingAwarded,
        reason: hands.length > 1
          ? `Work credited in full: ${task.title} (one of ${hands.length} hands on the work)`
          : `Work credited in full: ${task.title}`,
        source_type: 'labour_task',
        source_id: taskId,
        source_name: task.title,
        actor_email: user.email,
        actor_role: fsisRole(user),
      })));
      for (const hand of hands) {
        await recomputeStanding(base44, hand.user_id);
      }
    }

    // Work finished here may be what other work was waiting for. Anything now clear is opened in
    // one batch, so the board reflects the yard rather than the last time somebody looked.
    let unblocked = 0;
    if (decision === 'credit') {
      const waiting = await base44.asServiceRole.entities.labour_task.filter({ is_blocked: true }, '-created_date', 200);
      const dependents = waiting.filter((t) => prerequisiteIds(t).includes(taskId));

      if (dependents.length > 0) {
        const prereqIds = [...new Set(dependents.flatMap((t) => prerequisiteIds(t)))];
        const prereqs = await base44.asServiceRole.entities.labour_task.filter({ id: { $in: prereqIds } });
        // The task we just credited is not yet 'credited' in that read, so count it as settled.
        const settled = prereqs.map((p) => (p.id === taskId ? { ...p, status: 'credited' } : p));

        const nowReady = dependents.filter((t) => unmetPrerequisites(t, settled).length === 0);
        if (nowReady.length > 0) {
          await base44.asServiceRole.entities.labour_task.bulkUpdate(
            nowReady.map((t) => ({ id: t.id, is_blocked: false })),
          );
          unblocked = nowReady.length;
        }
      }
    }

    await base44.asServiceRole.entities.ops_log.create({
      action: decision === 'credit' ? 'labour_task.credited' : 'labour_task.returned',
      entity_type: 'labour_task',
      entity_id: taskId,
      entity_name: task.title,
      actor: user.email,
      before: { status: task.status },
      after: { status: updated.status, credited_auec: updated.credited_auec },
      notes: reviewNotes || `Reviewed by ${fsisRole(user)}.`,
    });

    // Every comrade whose labour this was is told, in their own terms, what the council decided —
    // and told their OWN figure, not the crew's total. Nobody should learn the answer to filed
    // work by refreshing a page, and nobody should have to work out their share from a lump sum.
    await notifyMany(base44, hands.map((hand) => {
      const theirs = perHand[hand.user_id] || 0;
      return {
        recipient_user_id: hand.user_id,
        recipient_handle: hand.handle,
        kind: decision === 'credit' ? 'work_credited' : 'work_returned',
        title: decision === 'credit'
          ? `Your labour was credited: ${task.title}`
          : `Work sent back for more: ${task.title}`,
        body: decision === 'credit'
          ? [
            `${theirs.toLocaleString()} aUEC settled in full and directly — this is yours, and it is never drawn from the share pool.`,
            hands.length > 1
              ? `${credited.toLocaleString()} aUEC was agreed for this work and divided equally among the ${hands.length} hands who held it. Any odd credit goes to the earliest to take it up rather than being rounded away.`
              : '',
            standingAwarded ? `${standingAwarded} standing recorded to your name for labour given.` : '',
            reviewNotes,
          ].filter(Boolean).join('\n\n')
          : [
            'The council has sent this work back rather than crediting it. Their reasoning, in full:',
            reviewNotes,
            'The task is still in your hands. File again when you are ready, or hand it back if you cannot carry it.',
          ].filter(Boolean).join('\n\n'),
        source_type: 'labour_task',
        source_id: taskId,
        source_name: task.title,
        actor_email: user.email,
        actor_role: fsisRole(user),
      };
    }));

    return Response.json({ ok: true, task: updated, hands: hands.length, split: perHand, unblocked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}