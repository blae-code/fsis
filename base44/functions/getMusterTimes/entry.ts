import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { bestTimes, localTime, musterIcs } from '../../shared/timekeeping.js';
import { slotState } from '../../shared/musters.js';

/**
 * A muster in everybody's own time, and an honest reading of which hours actually suit them.
 *
 * The best-time reading is a READING, not a verdict. It reports every hour ranked by how many
 * respondents would be in their own evening, and names who each hour is awkward for — because "best"
 * measured only by headcount quietly means "worst for the same two comrades every week", and they
 * are the ones who stop answering.
 *
 * A worker sees the run and their own clock. Only the council sees the whole spread of zones, since
 * that is a reading about the group rather than about any one comrade.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (fsisRole(user) === 'patron') {
      return Response.json({ error: 'Only members of the outfit read the muster board.' }, { status: 403 });
    }

    const body = await req.json();
    const opId = String(body?.operation_id || '').trim();
    if (!opId) return Response.json({ error: 'operation_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const operation = await svc.crew_operation.get(opId);
    if (!operation) return Response.json({ error: 'Operation not found.' }, { status: 404 });

    const council = isCouncil(user) || user.role === 'admin';
    const yours = localTime(operation.starts_at, user.timezone);

    const response: Record<string, unknown> = {
      operation_id: opId,
      op_name: operation.op_name,
      starts_at: operation.starts_at,
      your_time: yours,
      // Said plainly rather than left as a silent blank.
      your_time_note: yours
        ? ''
        : 'Your timezone is not on your record, so this run is shown in UTC. Set it once and every muster reads in your own clock.',
      calendar: musterIcs(operation),
      slots: slotState(operation, operation.rsvps),
    };

    if (council) {
      const respondents = (operation.rsvps || [])
        .filter((r: any) => r?.user_id && ['in', 'maybe'].includes(r.response));
      const members = await Promise.all(
        respondents.map((r: any) => svc.User.get(r.user_id).catch(() => null)),
      );

      const zones = members.map((m: any) => m?.timezone).filter(Boolean);
      const unknownZones = members.filter((m: any) => m && !m.timezone).length;

      response.respondents = respondents.map((rsvp: any, i: number) => ({
        handle: rsvp.handle,
        response: rsvp.response,
        role: rsvp.role || 'any',
        waitlisted: !!rsvp.waitlisted,
        time_zone: members[i]?.timezone || '',
        their_time: localTime(operation.starts_at, members[i]?.timezone),
      }));
      response.best_times = bestTimes(zones, operation.starts_at ? new Date(operation.starts_at) : new Date());
      response.zones_known = zones.length;
      response.zones_unknown = unknownZones;
      response.best_times_note = zones.length === 0
        ? 'Nobody who answered has a timezone on record, so there is nothing to reckon with yet.'
        : 'Ranked by how many respondents would be in their own evening. Every hour is listed with who it is awkward for — an hour that suits the most people can still be the same two comrades losing out every week.';
    }

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
