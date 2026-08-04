import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { isPresent, openStint, roster, stintMinutes } from '../../shared/sessions.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * A hand arrives, or stands down.
 *
 * A comrade marks their own presence — it is their time, and their claim to have given it. The
 * council may mark it on someone's behalf, because a hand deep in a wreck with their hands full is
 * not going to stop and tell a webpage, and being paid should not depend on remembering to.
 *
 * Presence is a clock, not a judgement. Nothing here records how hard anyone worked, and nothing
 * here can be used to rank one comrade against another.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'Only members of the outfit stand a run.' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    const action = String(body?.action || '').trim();
    const forUserId = String(body?.user_id || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });
    if (!['join', 'leave'].includes(action)) {
      return Response.json({ error: "action must be 'join' or 'leave'." }, { status: 400 });
    }

    // Marking somebody else present is a council act, and only a council act.
    const onBehalf = forUserId && forUserId !== user.id;
    if (onBehalf && !isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Only the council may mark another comrade present.' }, { status: 403 });
    }

    const subject = onBehalf
      ? await base44.asServiceRole.entities.User.get(forUserId)
      : user;
    if (!subject) return Response.json({ error: 'No such comrade.' }, { status: 404 });

    const session = await base44.asServiceRole.entities.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
    if (session.status !== 'underway') {
      return Response.json({ error: 'That run is over. Presence cannot be changed after a run is settled.' }, { status: 409 });
    }

    const now = new Date();
    const attendance: any[] = session.attendance || [];
    const already = isPresent(attendance, subject.id);

    let nextAttendance;
    if (action === 'join') {
      if (already) {
        return Response.json({ error: 'Already counted present on this run.' }, { status: 409 });
      }
      // A fresh stint rather than reopening the last one: coming and going is a fact of a long run
      // and the record of it is not rewritten.
      nextAttendance = [...attendance, openStint(subject, now)];
    } else {
      if (!already) {
        return Response.json({ error: 'Not presently counted on this run.' }, { status: 409 });
      }
      let closed = false;
      nextAttendance = attendance.map((stint) => {
        if (closed || stint.user_id !== subject.id || stint.left_at) return stint;
        closed = true;
        return { ...stint, left_at: now.toISOString(), minutes: stintMinutes({ ...stint, left_at: now.toISOString() }) };
      });
    }

    const updated = await base44.asServiceRole.entities.operation_session.update(sessionId, {
      attendance: nextAttendance,
      attendance_user_ids: [...new Set(nextAttendance.map((s: any) => s.user_id).filter(Boolean))],
    });

    return Response.json({
      ok: true,
      action,
      handle: callsignFor(subject),
      roster: roster(updated.attendance || nextAttendance, now),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
