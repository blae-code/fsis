import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { APPEAL_WINDOW_DAYS, APPEAL_ANSWER_DAYS } from '../../shared/reputation.js';

/**
 * A comrade answers a mark against them. One appeal per event, filed within the window,
 * and the council owes an answer by a stated date — silence is not a denial.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const eventId = String(body?.event_id || '').trim();
    const appealReason = String(body?.appeal_reason || '').trim();
    if (!eventId) return Response.json({ error: 'event_id is required.' }, { status: 400 });
    if (!appealReason) return Response.json({ error: 'Set out your account of it — the council will read it in full.' }, { status: 400 });

    const event = await base44.asServiceRole.entities.standing_event.get(eventId);
    if (!event) return Response.json({ error: 'That standing event does not exist.' }, { status: 404 });
    if (event.member_user_id !== user.id) {
      return Response.json({ error: 'You may only appeal a mark against your own standing.' }, { status: 403 });
    }
    if (event.appeal_status !== 'none') {
      return Response.json({ error: 'That event has already been appealed once. One appeal per event.' }, { status: 409 });
    }
    if ((Number(event.effective_delta) || 0) >= 0) {
      return Response.json({ error: 'There is nothing to appeal — that event did not count against you.' }, { status: 409 });
    }

    const now = new Date();
    const filingDeadline = event.appeal_due_by
      ? new Date(event.appeal_due_by)
      : new Date(new Date(event.created_date).getTime() + APPEAL_WINDOW_DAYS * 86400000);
    if (now > filingDeadline) {
      return Response.json({ error: `The ${APPEAL_WINDOW_DAYS}-day window to appeal this event has closed.` }, { status: 409 });
    }

    const updated = await base44.asServiceRole.entities.standing_event.update(eventId, {
      appeal_status: 'filed',
      appeal_reason: appealReason,
      appeal_filed_at: now.toISOString(),
      appeal_due_by: new Date(now.getTime() + APPEAL_ANSWER_DAYS * 86400000).toISOString(),
    });

    return Response.json({ ok: true, standing_event: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}