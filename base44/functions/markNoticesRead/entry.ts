import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * A comrade marks their own notice read.
 *
 * Nobody marks a notice read on somebody else's behalf: the claim is scoped to the caller's own
 * account server-side, so a passed id that belongs to another comrade simply matches nothing.
 * Marked in one batch rather than a row at a time, and already-read notices are left alone so
 * the moment they were first read is not overwritten.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rawIds = Array.isArray(body?.notice_ids) ? body.notice_ids : null;
    if (rawIds && rawIds.length > 200) {
      return Response.json({ error: 'Too many notices in one request — send 200 or fewer.' }, { status: 400 });
    }

    const ids = rawIds
      ? [...new Set(rawIds.map((id: unknown) => String(id || '').trim()).filter(Boolean))]
      : null;
    if (ids && ids.length === 0) {
      return Response.json({ ok: true, marked: 0 });
    }

    // Unread only, and only ever this comrade's own.
    const where: Record<string, unknown> = { recipient_user_id: user.id, read_at: null };
    if (ids) where.id = { $in: ids };

    const result = await base44.asServiceRole.entities.notice.updateMany(
      where,
      { $set: { read_at: new Date().toISOString() } },
    );

    return Response.json({ ok: true, marked: result?.updated ?? 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
