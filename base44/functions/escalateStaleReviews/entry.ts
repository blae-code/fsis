import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { PROPRIETOR_EMAIL } from '../../shared/roles.js';
import { APPEAL_ANSWER_DAYS } from '../../shared/reputation.js';
import { notifyMany } from '../../shared/notices.js';

/** How long filed work may wait for a decision before it goes over the reviewer's head. */
const CREDIT_ESCALATION_DAYS = 5;

/**
 * Labour is never left unpaid because a reviewer went quiet.
 *
 * The council load view already ages filed work, but that only helps somebody who goes and looks.
 * A comrade whose credit is stuck should not depend on a council member happening to open the right
 * tab — the whole point of an appeal deadline or a review queue is that it obliges somebody, and an
 * obligation nobody is reminded of is a wish.
 *
 * So this goes over the reviewer's head. Work filed and undecided past five days, and appeals past
 * the answer date the council itself promised, are put in front of the proprietor by name. The
 * worker is told too — that their work has been escalated, and that the delay is not theirs.
 *
 * Nothing is decided here. Silence is broken, not resolved.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    // Who the buck stops with.
    const proprietors = [
      ...(await svc.User.filter({ fsis_role: 'proprietor' })),
      ...(await svc.User.filter({ email: PROPRIETOR_EMAIL })),
    ];
    const proprietorIds = [...new Set(proprietors.map((p: any) => p.id).filter(Boolean))];

    const notices: any[] = [];

    // 1. Work filed and left undecided.
    const submitted = await svc.labour_task.filter({ status: 'submitted' }, 'submitted_at', 200);
    const staleWork = submitted.filter((task: any) => {
      if (task.review_escalated_at) return false;
      if (!task.submitted_at) return false;
      const filed = new Date(task.submitted_at);
      if (Number.isNaN(filed.getTime())) return false;
      return (now.getTime() - filed.getTime()) >= CREDIT_ESCALATION_DAYS * 86400000;
    });

    if (staleWork.length > 0) {
      // Claimed so an overlapping sweep cannot escalate the same work twice.
      await svc.labour_task.bulkUpdate(staleWork.map((task: any) => ({
        id: task.id, review_escalated_at: now.toISOString(),
      })));

      for (const id of proprietorIds) {
        notices.push({
          recipient_user_id: id,
          kind: 'council_message',
          title: `${staleWork.length} piece(s) of filed work waiting on a decision`,
          body: [
            `Work has been filed and left undecided for ${CREDIT_ESCALATION_DAYS} days or more. Labour already given is unpaid while it waits.`,
            staleWork.map((t: any) => `· ${t.title} — filed by ${t.assigned_handle || 'a comrade'} on ${String(t.submitted_at).slice(0, 10)}`).join('\n'),
            'This is over a reviewer\'s head because the queue obliges somebody and an obligation nobody is reminded of is a wish. Credit it, send it back, or find whoever was meant to.',
          ].join('\n\n'),
          source_type: 'labour_task',
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }

      // The worker hears it too: the delay is not theirs and somebody is now answerable for it.
      for (const task of staleWork) {
        if (!task.assigned_user_id) continue;
        notices.push({
          recipient_user_id: task.assigned_user_id,
          recipient_handle: task.assigned_handle,
          kind: 'council_message',
          title: `Your filed work has been escalated: ${task.title}`,
          body: [
            `This has been waiting on a decision for ${CREDIT_ESCALATION_DAYS} days, so it has been put in front of the proprietor.`,
            'The delay is not yours and nothing about it counts against you. You filed the work; the collective owes you an answer on it.',
          ].join('\n\n'),
          source_type: 'labour_task',
          source_id: task.id,
          source_name: task.title,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }
    }

    // 2. Appeals past the answer date the council itself promised.
    const filedAppeals = await svc.standing_event.filter({ appeal_status: 'filed' }, 'appeal_due_by', 200);
    const overdueAppeals = filedAppeals.filter((event: any) => {
      if (event.appeal_escalated_at) return false;
      if (!event.appeal_due_by) return false;
      const due = new Date(event.appeal_due_by);
      return !Number.isNaN(due.getTime()) && due <= now;
    });

    if (overdueAppeals.length > 0) {
      await svc.standing_event.bulkUpdate(overdueAppeals.map((event: any) => ({
        id: event.id, appeal_escalated_at: now.toISOString(),
      })));

      for (const id of proprietorIds) {
        notices.push({
          recipient_user_id: id,
          kind: 'council_message',
          title: `${overdueAppeals.length} appeal(s) past the date the council owed an answer`,
          body: [
            `These comrades appealed a mark and the council promised an answer within ${APPEAL_ANSWER_DAYS} days. That date has passed.`,
            overdueAppeals.map((e: any) => `· ${e.member_handle || 'a comrade'} — ${e.source_name || e.kind}, answer owed by ${String(e.appeal_due_by).slice(0, 10)}`).join('\n'),
            'Silence from the council must not work as a denial. Rule on them.',
          ].join('\n\n'),
          source_type: 'standing_event',
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }

      for (const event of overdueAppeals) {
        if (!event.member_user_id) continue;
        notices.push({
          recipient_user_id: event.member_user_id,
          recipient_handle: event.member_handle,
          kind: 'council_message',
          title: 'Your appeal is past the date you were owed an answer',
          body: [
            'The council promised a ruling on your appeal by now and has not given one. It has been put in front of the proprietor.',
            'You are being told because silence should not be something you have to wonder about. The mark stands unchanged in the meantime, and the delay is not held against you.',
          ].join('\n\n'),
          source_type: 'standing_event',
          source_id: event.id,
          source_name: event.source_name || '',
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }
    }

    await notifyMany(base44, notices);

    if (staleWork.length > 0 || overdueAppeals.length > 0) {
      await svc.ops_log.create({
        action: 'council.reviews_escalated',
        entity_type: 'labour_task',
        entity_name: `${staleWork.length} task(s), ${overdueAppeals.length} appeal(s)`,
        actor: 'FSIS.bot',
        after: { work_escalated: staleWork.length, appeals_escalated: overdueAppeals.length },
        notes: 'Escalated to the proprietor past a quiet reviewer.',
      });
    }

    return Response.json({
      ok: true,
      work_escalated: staleWork.length,
      appeals_escalated: overdueAppeals.length,
      told: notices.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
