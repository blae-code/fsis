import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { suggestCredit } from '../../shared/labour.js';

/**
 * What comparable labour has actually been paid, offered to the council as they write a brief.
 *
 * It suggests and never sets: the figure returned is a reading of the record, shown with its
 * working, and the council types whatever they judge right. Where the record does not yet say
 * enough, it returns no figure at all rather than inventing one — a made-up number carries the
 * same authority on the page as an earned one, which is exactly why it must not be offered.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const category = String(body?.category || '').trim();
    if (!category) return Response.json({ error: 'category is required.' }, { status: 400 });

    const rawHours = Number(body?.estimated_hours);
    const estimatedHours = Number.isFinite(rawHours) && rawHours > 0 && rawHours <= 24 ? rawHours : 0;

    const pastTasks = await base44.asServiceRole.entities.labour_task.filter(
      { status: 'credited', category }, '-reviewed_at', 200,
    );

    const suggestion = suggestCredit({ category, estimated_hours: estimatedHours }, pastTasks);
    return Response.json(suggestion);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
