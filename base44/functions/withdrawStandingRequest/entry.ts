import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { reportError } from '../../shared/diagnostics.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * Taking back a request to work with us.
 *
 * Somebody's circumstances change between asking and being answered, and there was no way to say so
 * — the request sat pending, the council read an application the person had moved on from, and the
 * applicant could never file a fresh one because the stale row blocked it.
 *
 * No reason is required and none is asked for. Withdrawing is not a fault, and there is nothing
 * here for anybody to weigh.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestId = String(body?.request_id || '').trim();
    const svc = base44.asServiceRole.entities;

    const mine = await svc.standing_request.filter(
      { applicant_user_id: user.id, status: 'pending' }, '-created_date', 5,
    );
    const request = requestId ? mine.find((r: any) => r.id === requestId) : mine[0];
    if (!request) {
      return Response.json({ error: 'You have no request before the council.' }, { status: 404 });
    }

    await svc.standing_request.update(request.id, {
      status: 'withdrawn',
      reviewed_at: new Date().toISOString(),
      review_notes: String(body?.note || '').trim(),
    });

    await svc.ops_log.create({
      action: 'standing_request.withdrawn',
      entity_type: 'standing_request',
      entity_id: request.id,
      entity_name: request.handle || callsignFor(user),
      actor: user.email,
      before: { status: 'pending' },
      after: { status: 'withdrawn' },
      notes: 'Withdrawn by the applicant. No reason required and none asked for.',
    });

    return Response.json({
      ok: true,
      note: 'Withdrawn. Nothing is recorded against you and you can ask again whenever you like.',
    });
  } catch (error) {
    await reportError(base44, { source: 'withdrawStandingRequest', error, route: 'withdrawStandingRequest' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
