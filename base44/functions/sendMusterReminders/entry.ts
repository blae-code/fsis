import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { dueReminders, localTime } from '../../shared/timekeeping.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError, recordSweep } from '../../shared/diagnostics.js';

/**
 * The notice a muster owes before it happens.
 *
 * A run called a week out and never mentioned again is a run people forget, and the comrades who
 * forget are not careless — they are living their lives. A day's notice and an hour's notice cost
 * the collective nothing and are the difference between a crew and an empty hangar.
 *
 * Each comrade is told the time on THEIR OWN clock. Timezones were collected on every application
 * and never read back, so everybody outside the proprietor's zone has been doing the arithmetic
 * themselves — a small unfairness that falls entirely on people who do not live where he lives, and
 * that compounds, because comrades who keep missing runs stop answering.
 *
 * Runs on a schedule. A reminder already sent is never sent again, claimed atomically so an
 * overlapping run cannot tell everybody twice.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const sweepStartedAt = new Date();
  /** Record that the sweep ran — the absence of these rows is how a stopped sweep is found. */
  const recordAnd = async (payload: any) => {
    await recordSweep(base44, { job: 'sendMusterReminders', ok: true, outcome: payload, startedAt: sweepStartedAt });
    return Response.json(payload);
  };
  try {
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const upcoming = await svc.crew_operation.filter({ status: 'scheduled' }, 'starts_at', 100);
    const mustering = await svc.crew_operation.filter({ status: 'mustering' }, 'starts_at', 100);
    const operations = [...upcoming, ...mustering];

    let sent = 0;
    const told = [];

    for (const operation of operations) {
      const due = dueReminders(operation, now);
      if (due.length === 0) continue;

      // Claim the reminders before sending. An overlapping run must not tell everybody twice.
      const alreadySent = operation.reminders_sent || [];
      const claim = await svc.crew_operation.updateMany(
        { id: operation.id, reminders_sent: alreadySent },
        { $set: { reminders_sent: [...alreadySent, ...due.map((r) => r.key)] } },
      );
      if (!claim || claim.updated === 0) continue;

      const coming = (operation.rsvps || [])
        .filter((r: any) => r?.user_id && ['in', 'maybe'].includes(r.response));
      if (coming.length === 0) continue;

      const members = await Promise.all(
        coming.map((r: any) => svc.User.get(r.user_id).catch(() => null)),
      );

      const nearest = due[due.length - 1];

      await notifyMany(base44, coming.map((rsvp: any, i: number) => {
        const member = members[i];
        const theirTime = localTime(operation.starts_at, member?.timezone);
        return {
          recipient_user_id: rsvp.user_id,
          recipient_handle: rsvp.handle,
          kind: 'muster_reminder',
          title: nearest.key === 't1'
            ? `Within the hour: ${operation.op_name}`
            : `Tomorrow: ${operation.op_name}`,
          body: [
            theirTime
              ? `The muster is at ${theirTime.label} your time, on ${theirTime.date}.`
              : `The muster is at ${operation.starts_at} UTC. Your timezone is not on your record — set it and these notices will read in your own clock.`,
            operation.muster_location ? `Gathering at ${operation.muster_location}.` : '',
            operation.ship ? `Hull: ${operation.ship}.` : '',
            rsvp.response === 'maybe'
              ? 'You said you might make it. If you can, say so and take a place; if you cannot, say that too and somebody waiting takes it.'
              : rsvp.waitlisted
                ? 'You are next in line for a place. If one comes free you will be told at once.'
                : 'You said you were in. If that has changed, say so now and the next comrade waiting takes the place.',
          ].filter(Boolean).join('\n\n'),
          source_type: 'crew_operation',
          source_id: operation.id,
          source_name: operation.op_name,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        };
      }));

      sent += coming.length;
      told.push({ operation: operation.op_name, reminders: due.map((r) => r.key), comrades: coming.length });
    }

    if (told.length > 0) {
      await svc.ops_log.create({
        action: 'operation.reminders_sent',
        entity_type: 'crew_operation',
        entity_name: `${told.length} muster(s)`,
        actor: 'FSIS.bot',
        after: { notices: sent },
        notes: told.map((t) => `${t.operation} (${t.reminders.join(', ')}) → ${t.comrades}`).join('; '),
      });
    }

    return recordAnd({ ok: true, musters_checked: operations.length, notices_sent: sent, told });
  } catch (error) {
    await reportError(base44, { source: 'sendMusterReminders', error, route: 'sendMusterReminders' });
    await recordSweep(base44, { job: 'sendMusterReminders', ok: false, error, startedAt: sweepStartedAt });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
