import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';

/**
 * Watching a lot, so its closing is not something a comrade has to remember.
 *
 * The watch list is the difference between an auction house and a page somebody has to keep
 * refreshing. A comrade who wants a thing should be told it is closing rather than losing it to
 * whoever happened to be looking.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (fsisRole(user) === 'patron') {
      return Response.json({ error: 'The hall is for members of the outfit.' }, { status: 403 });
    }

    const body = await req.json();
    const lotId = String(body?.lot_id || '').trim();
    const watching = body?.watch !== false;
    if (!lotId) return Response.json({ error: 'lot_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const lot = await svc.hall_lot.get(lotId);
    if (!lot) return Response.json({ error: 'No such lot.' }, { status: 404 });

    const current: string[] = lot.watcher_user_ids || [];
    const already = current.includes(user.id);
    if (watching === already) {
      return Response.json({ ok: true, watching: already, unchanged: true });
    }

    const next = watching
      ? [...current, user.id]
      : current.filter((id: string) => id !== user.id);

    await svc.hall_lot.update(lotId, { watcher_user_ids: next });

    return Response.json({ ok: true, watching, watchers: next.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
