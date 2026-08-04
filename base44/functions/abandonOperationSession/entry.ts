import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { roster } from '../../shared/sessions.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * A run that never really happened.
 *
 * `abandoned` has been in the enum since the session work landed and nothing could write it, which
 * left exactly one way out of an underway run: settle it. That is the wrong door. Closing a run
 * awards `muster_stood` to everybody on the roster, writes `time_log` shares against the pay pool,
 * and settles contractors — for a run where two people logged in, found the field stripped, and went
 * to bed. Somebody would be paid for it out of the collective's pool, and the standing ledger would
 * record labour nobody gave.
 *
 * So this is the honest exit: the run is closed with no pay, no shares, no standing, and a stated
 * reason. Presence is KEPT rather than deleted — those comrades did turn up, and the record should
 * say so even though the run came to nothing.
 *
 * Where hands genuinely worked before it fell apart, this is the wrong function: settle it properly
 * through closeOperationSession, because time given is owed whatever the run produced.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to stand a run down.' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });
    if (!reason) {
      return Response.json({
        error: 'Say why the run came to nothing. Comrades gave up an evening for it and the record should say what happened.',
      }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const session = await svc.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
    if (session.status !== 'underway') {
      return Response.json({ error: `That run is already ${session.status}.` }, { status: 409 });
    }

    const now = new Date();
    const stood = roster(session.attendance, now);
    const totalMinutes = stood.reduce((t, h) => t + h.minutes, 0);

    // A guard, not a rule: real time given should be settled, not written off. The council may
    // override it deliberately, because sometimes a clock was simply left running.
    const substantial = totalMinutes >= 30;
    if (substantial && body?.confirm_unpaid !== true) {
      return Response.json({
        error: `${stood.length} hand(s) logged ${totalMinutes} minutes on this run. Abandoning pays none of it — no shares, no standing, nothing. If they genuinely worked, settle it through closeOperationSession instead; time given is owed whatever the run produced.`,
        total_minutes: totalMinutes,
        hands: stood.length,
        confirm_with: 'confirm_unpaid: true',
      }, { status: 409 });
    }

    const claim = await svc.operation_session.updateMany(
      { id: sessionId, status: 'underway' },
      {
        $set: {
          status: 'abandoned',
          ended_at: now.toISOString(),
          closed_at: now.toISOString(),
          closed_by_email: user.email,
          total_minutes: totalMinutes,
          debrief: reason,
        },
      },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That run was settled by somebody else a moment ago.' }, { status: 409 });
    }

    if (session.operation_id) {
      await svc.crew_operation.update(session.operation_id, { status: 'stood_down', stood_down_reason: reason });
    }

    // Everybody who turned up is told, and told plainly that nothing is held against them.
    await notifyMany(base44, stood.map((hand) => ({
      recipient_user_id: hand.user_id,
      recipient_handle: hand.handle,
      kind: 'muster_stood_down',
      title: `The run came to nothing: ${session.session_name}`,
      body: [
        `This run has been closed without a settlement. You logged ${hand.minutes} minutes on it.`,
        `The reason given: ${reason}`,
        'No shares, no standing and no pay come from it, because nothing was produced to pay anybody from. Your time on the record stands — you did turn up, and it says so.',
        'If you did real work on this and it should have been settled, say so to the council. A run written off in error can be argued with.',
      ].join('\n\n'),
      source_type: 'operation_session',
      source_id: sessionId,
      source_name: session.session_name,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    await svc.ops_log.create({
      action: 'operation.session_abandoned',
      entity_type: 'operation_session',
      entity_id: sessionId,
      entity_name: session.session_name,
      actor: user.email,
      before: { status: 'underway' },
      after: { status: 'abandoned', hands: stood.length, total_minutes: totalMinutes, paid: false },
      notes: reason,
    });

    return Response.json({
      ok: true,
      status: 'abandoned',
      hands: stood.length,
      total_minutes: totalMinutes,
      note: 'Closed with no pay, no shares and no standing. Presence is kept on the record — those comrades did turn up.',
    });
  } catch (error) {
    await reportError(base44, { source: 'abandonOperationSession', error, route: 'abandonOperationSession' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
