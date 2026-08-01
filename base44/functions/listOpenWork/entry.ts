import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { rankTasks, skillsOf } from '../../shared/skills.js';
import { activeHands, handsNeeded, prerequisiteIds, unmetPrerequisites } from '../../shared/tasks.js';

/**
 * The board, with work a comrade is likely suited to nearer the top.
 *
 * Every open task comes back. Ordering changes; the board never shrinks. Work outside a comrade's
 * declared trades sits lower and remains entirely claimable, because what a comrade can turn their
 * hand to is theirs to decide — a convenience that quietly became a gate would be a worse thing
 * than the inconvenience it fixed.
 *
 * Each task says how many places it has left and whether it is waiting on other work, so nobody
 * reaches for something they cannot take and is refused after the fact.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'Only members of the outfit may read the labour board.' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const open = await svc.labour_task.filter({ status: 'posted' }, '-created_date', 200);

    // What the comrade said they do, from their record or from their own application.
    let request = null;
    if (!Array.isArray(user.skills) || user.skills.length === 0) {
      const requests = await svc.standing_request.filter({ applicant_user_id: user.id }, '-created_date', 1);
      request = requests[0] || null;
    }
    const skills = skillsOf(user, request);

    // Readiness, read once for the whole board rather than per task.
    const prereqIds = [...new Set(open.flatMap((t) => prerequisiteIds(t)))];
    const prereqs = prereqIds.length > 0
      ? await svc.labour_task.filter({ id: { $in: prereqIds } })
      : [];

    const ranked = rankTasks(open, skills);

    return Response.json({
      skills,
      // Said plainly, so nobody reads a ranked list as a restricted one.
      note: 'Every open task is listed. Work matching your declared trades is shown first; all of it is yours to claim.',
      tasks: ranked.map((task) => {
        const waiting = unmetPrerequisites(task, prereqs);
        const onNow = activeHands(task).length;
        return {
          id: task.id,
          title: task.title,
          brief: task.brief,
          category: task.category,
          priority: task.priority,
          location: task.location,
          due_date: task.due_date,
          agreed_credit_auec: task.agreed_credit_auec,
          estimated_hours: task.estimated_hours ?? null,
          hands_needed: handsNeeded(task),
          hands_on: onNow,
          places_left: Math.max(0, handsNeeded(task) - onNow),
          already_yours: (task.crew_user_ids || []).includes(user.id),
          waiting_on: waiting.map((t) => ({ task_id: t.id, title: t.title, status: t.status })),
          match_score: task.match_score,
          match_reasons: task.match_reasons,
        };
      }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
