import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { bulkCount, nextDueAt, taskFromTemplate, MAX_BULK } from '../../shared/templates.js';

/**
 * The council puts a standing brief on the board — once, or several times where the same work
 * wants doing in several places.
 *
 * Written in one batch rather than a row at a time, because posting five briefs one at a time is
 * how this timed out before.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to post work.' }, { status: 403 });
    }

    const body = await req.json();
    const templateId = String(body?.template_id || '').trim();
    if (!templateId) return Response.json({ error: 'template_id is required.' }, { status: 400 });

    const rawCount = body?.count;
    if (rawCount !== undefined && Number(rawCount) > MAX_BULK) {
      return Response.json(
        { error: `A brief posts at most ${MAX_BULK} tasks at once. Post again if more are wanted.` },
        { status: 400 },
      );
    }
    const count = bulkCount(rawCount);

    const template = await base44.asServiceRole.entities.task_template.get(templateId);
    if (!template) return Response.json({ error: 'No such brief.' }, { status: 404 });
    if (template.active === false) {
      return Response.json({ error: 'That brief has been retired. Make it active again to post from it.' }, { status: 409 });
    }

    const now = new Date();
    const rows = Array.from({ length: count }, () => taskFromTemplate(template, { now, postedByEmail: user.email }));
    const created = await base44.asServiceRole.entities.labour_task.bulkCreate(rows);

    await base44.asServiceRole.entities.task_template.update(templateId, {
      last_posted_at: now.toISOString(),
      times_posted: (Number(template.times_posted) || 0) + count,
      // Posting by hand also resets a recurring brief's clock, so a brief posted today does not
      // post itself again tomorrow just because the calendar said so.
      ...(template.cadence && template.cadence !== 'none' ? { next_due_at: nextDueAt(template, now) } : {}),
    });

    await base44.asServiceRole.entities.ops_log.create({
      action: 'labour_task.posted_from_template',
      entity_type: 'task_template',
      entity_id: templateId,
      entity_name: template.template_name,
      actor: user.email,
      after: { posted: count, title: template.title },
      notes: `${count} task(s) posted from the standing brief by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, posted: count, tasks: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
