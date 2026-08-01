import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { standingNotices, unreadCount } from '../../shared/notices.js';

/**
 * What the collective owes this comrade in the way of being told.
 *
 * Scoped to the caller by their account and by nothing they can send us — a comrade reads their
 * own notice and no one else's, and the council reads theirs the same way, holding no privilege
 * here. Notice about a comrade belongs to that comrade.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(200, Math.max(1, Math.floor(Number(body?.limit) || 50)));

    const found = await base44.asServiceRole.entities.notice.filter(
      { recipient_user_id: user.id },
      '-created_date',
      limit,
    );
    const notices = standingNotices(found);

    return Response.json({
      unread: unreadCount(notices),
      notices: notices.map((n) => ({
        id: n.id,
        created_date: n.created_date,
        kind: n.kind,
        title: n.title,
        body: n.body,
        source_type: n.source_type,
        source_id: n.source_id,
        source_name: n.source_name,
        actor_email: n.actor_email,
        actor_role: n.actor_role,
        read_at: n.read_at,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
