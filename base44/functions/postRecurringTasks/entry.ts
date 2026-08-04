import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isDue, nextDueAt, taskFromTemplate } from '../../shared/templates.js';
import { reportError, recordSweep } from '../../shared/diagnostics.js';

/**
 * Standing briefs put themselves back on the board when they come round.
 *
 * The double-posting guard matters more than the posting. This runs on a schedule, and a schedule
 * that fires twice — a retry, an overlapping run, a manual nudge — must not put the same work up
 * twice, or the board fills with duplicates nobody can tell apart and two comrades do the same job
 * believing it was theirs.
 *
 * So each brief is CLAIMED before anything is written: the next-due date is moved forward with a
 * conditional update, and only the run that actually moved it goes on to post. A run that finds
 * the date already moved simply steps aside.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const sweepStartedAt = new Date();
  /** Record that the sweep ran — the absence of these rows is how a stopped sweep is found. */
  const recordAnd = async (payload: any) => {
    await recordSweep(base44, { job: 'postRecurringTasks', ok: true, outcome: payload, startedAt: sweepStartedAt });
    return Response.json(payload);
  };
  try {
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const templates = await svc.task_template.filter({ active: true }, 'next_due_at', 200);
    const due = templates.filter((t) => isDue(t, now));

    if (due.length === 0) {
      return recordAnd({ ok: true, posted: 0, briefs_checked: templates.length });
    }

    const postedRows = [];
    const claimed = [];
    for (const template of due) {
      const advanced = nextDueAt(template, now);

      // Claim by moving the date forward. A brief that has never posted carries no date, so it is
      // claimed on the absence instead — either way only one run can win it.
      const claim = await svc.task_template.updateMany(
        template.next_due_at
          ? { id: template.id, next_due_at: template.next_due_at }
          : { id: template.id, times_posted: Number(template.times_posted) || 0 },
        {
          $set: {
            next_due_at: advanced,
            last_posted_at: now.toISOString(),
            times_posted: (Number(template.times_posted) || 0) + 1,
          },
        },
      );
      if (!claim || claim.updated === 0) continue;

      postedRows.push(taskFromTemplate(template, { now, postedByEmail: 'FSIS.bot' }));
      claimed.push(template);
    }

    if (postedRows.length === 0) {
      return recordAnd({ ok: true, posted: 0, briefs_checked: templates.length });
    }

    // One write for every brief that came round.
    await svc.labour_task.bulkCreate(postedRows);

    await svc.ops_log.create({
      action: 'labour_task.recurring_posted',
      entity_type: 'task_template',
      entity_name: `${claimed.length} standing brief(s)`,
      actor: 'FSIS.bot',
      after: { posted: postedRows.length },
      notes: claimed.map((t) => `${t.template_name} → ${t.title}`).join('; '),
    });

    return Response.json({
      ok: true,
      posted: postedRows.length,
      briefs_checked: templates.length,
      briefs: claimed.map((t) => t.template_name),
    });
  } catch (error) {
    await reportError(base44, { source: 'postRecurringTasks', error, route: 'postRecurringTasks' });
    await recordSweep(base44, { job: 'postRecurringTasks', ok: false, error, startedAt: sweepStartedAt });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
