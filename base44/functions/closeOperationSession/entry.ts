import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { drawsFromSharePool } from '../../shared/members.js';
import { AWARD, recomputeStanding } from '../../shared/reputation.js';
import { roundAuec, roundShares } from '../../shared/money.js';
import { noShows, roster, stintMinutes, totalCosts } from '../../shared/sessions.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * The run is settled.
 *
 * This is the bridge that never existed: `completed` used to erase a run, and nothing an operation
 * produced could pay anybody. Now the time a comrade actually stood becomes shares in the pay pool
 * by the same arithmetic as every other hour the collective counts.
 *
 * Two settlement routes, and the difference is a stated rule rather than an oversight:
 *
 *   - Members of the co-op earn TIME LOG SHARES, cashed at pay day with everyone else's.
 *   - Contractors stand outside the co-op and are never included in share-based payday, so they are
 *     settled DIRECTLY at the flat credit the muster stated. Where no flat credit was stated their
 *     time is still recorded in full and the council settles it by hand — we record what they gave
 *     rather than inventing a wage for it.
 *
 * Settling twice would pay twice, so the run is claimed atomically before anything is written.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to settle a run.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.session_id || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });

    const grossGiven = Number(body?.gross_auec);
    if (body?.gross_auec !== undefined && (!Number.isFinite(grossGiven) || grossGiven < 0)) {
      return Response.json({ error: 'State the gross as a figure of zero or more.' }, { status: 400 });
    }
    const debrief = String(body?.debrief || '').trim();

    const svc = base44.asServiceRole.entities;
    const session = await svc.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
    if (session.status !== 'underway') {
      return Response.json({ error: 'That run has already been settled.' }, { status: 409 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Close every stint still open — hands who never stood down are counted to the moment the run
    // ended, not dropped for forgetting to tell us.
    const attendance: any[] = (session.attendance || []).map((stint: any) =>
      stint.left_at ? stint : { ...stint, left_at: nowIso, minutes: stintMinutes({ ...stint, left_at: nowIso }) },
    );

    const stood = roster(attendance, now);
    const gross = roundAuec(body?.gross_auec !== undefined ? grossGiven : session.gross_auec);
    const costs = roundAuec(totalCosts(session.costs));
    const net = Math.max(0, roundAuec(gross - costs));
    const totalMinutes = stood.reduce((total, hand) => total + hand.minutes, 0);

    // Claim the run before writing anything. A second settlement would pay every hand twice.
    const claim = await svc.operation_session.updateMany(
      { id: sessionId, status: 'underway' },
      { $set: { status: 'closed', closed_at: nowIso, closed_by_email: user.email } },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That run was settled by someone else a moment ago.' }, { status: 409 });
    }

    // Who draws from the pool and who is settled directly.
    const handUsers = await Promise.all(stood.map((hand) => svc.User.get(hand.user_id).catch(() => null)));
    const roleById = new Map(stood.map((hand, i) => [hand.user_id, handUsers[i]]));

    const operation = session.operation_id
      ? await svc.crew_operation.get(session.operation_id).catch(() => null)
      : null;
    const flatCredit = roundAuec(operation?.flat_credit_auec);

    const members = stood.filter((h) => drawsFromSharePool(roleById.get(h.user_id)));
    const contractors = stood.filter((h) => !drawsFromSharePool(roleById.get(h.user_id)));

    // Members: time in the pool, at the rate the time log has always used.
    const timeLogRows = members
      .filter((hand) => hand.minutes > 0)
      .map((hand) => ({
        handle: hand.handle,
        member_user_id: hand.user_id,
        work_date: nowIso.slice(0, 10),
        minutes: hand.minutes,
        shares: hand.shares,
        description: `${session.session_name} — ${hand.minutes} minutes stood`,
        status: 'confirmed',
      }));
    const writtenLogs = timeLogRows.length > 0 ? await svc.time_log.bulkCreate(timeLogRows) : [];

    // Contractors: settled directly, never from the share pool.
    const contractorPay = flatCredit > 0 ? flatCredit : 0;
    if (contractors.length > 0 && contractorPay > 0) {
      await svc.ledger_entry.bulkCreate(contractors
        .filter((hand) => hand.minutes > 0)
        .map((hand) => ({
          entry_type: 'expense',
          category: 'crew_pay',
          amount_auec: contractorPay,
          counterparty: hand.handle,
          description: `${session.session_name} — contractor settled directly (${hand.minutes} minutes stood)`,
          entry_date: nowIso.slice(0, 10),
          source: 'automation',
        })));
    }

    // A muster actually stood, not merely answered. This is the award Phase 4.5 left open.
    if (stood.length > 0) {
      await svc.standing_event.bulkCreate(stood.map((hand) => ({
        member_user_id: hand.user_id,
        member_handle: hand.handle,
        member_email: hand.email,
        kind: 'muster_stood',
        delta: AWARD.musterStood,
        effective_delta: AWARD.musterStood,
        reason: `Stood the run: ${session.session_name} (${hand.minutes} minutes)`,
        source_type: 'operation_session',
        source_id: sessionId,
        source_name: session.session_name,
        actor_email: user.email,
        actor_role: fsisRole(user),
      })));
      for (const hand of stood) {
        await recomputeStanding(base44, hand.user_id);
      }
    }

    const logIdByUser = new Map(members
      .filter((h) => h.minutes > 0)
      .map((hand, i) => [hand.user_id, writtenLogs?.[i]?.id || '']));

    const payouts = stood.map((hand) => ({
      user_id: hand.user_id,
      handle: hand.handle,
      minutes: hand.minutes,
      shares: drawsFromSharePool(roleById.get(hand.user_id)) ? hand.shares : 0,
      time_log_id: logIdByUser.get(hand.user_id) || '',
    }));

    const absent = noShows(operation?.rsvps, attendance);

    const settled = await svc.operation_session.update(sessionId, {
      attendance,
      attendance_user_ids: [...new Set(attendance.map((s: any) => s.user_id).filter(Boolean))],
      ended_at: nowIso,
      gross_auec: gross,
      costs_auec: costs,
      net_auec: net,
      total_minutes: totalMinutes,
      payouts,
      no_shows: absent,
      ...(debrief ? { debrief } : {}),
    });

    if (session.operation_id) {
      await svc.crew_operation.update(session.operation_id, { status: 'completed' });
    }

    // Every hand is told what their own time came to. Nobody works out their share from a lump sum.
    await notifyMany(base44, stood.map((hand) => {
      const isMember = drawsFromSharePool(roleById.get(hand.user_id));
      return {
        recipient_user_id: hand.user_id,
        recipient_handle: hand.handle,
        kind: 'payday_published',
        title: `The run is settled: ${session.session_name}`,
        body: [
          `You stood ${hand.minutes} minutes of this run.`,
          isMember
            ? `That is ${roundShares(hand.shares)} shares, confirmed and waiting for the next pay day, where they cash at the same rate as everyone else's.`
            : contractorPay > 0
              ? `${contractorPay.toLocaleString()} aUEC has been settled to you directly. Contractors are paid in full at the point of work and never from the share pool.`
              : 'Your time is recorded in full. No flat credit was stated for this run, so the council will settle with you directly rather than a figure being invented for your labour.',
          `${AWARD.musterStood} standing recorded for a muster actually stood.`,
          `The run made ${gross.toLocaleString()} aUEC and cost ${costs.toLocaleString()} to fly, leaving ${net.toLocaleString()}.`,
          debrief,
        ].filter(Boolean).join('\n\n'),
        source_type: 'operation_session',
        source_id: sessionId,
        source_name: session.session_name,
        actor_email: user.email,
        actor_role: fsisRole(user),
      };
    }));

    await svc.ops_log.create({
      action: 'operation.session_closed',
      entity_type: 'operation_session',
      entity_id: sessionId,
      entity_name: session.session_name,
      actor: user.email,
      before: { status: 'underway' },
      after: {
        gross_auec: gross, costs_auec: costs, net_auec: net,
        hands: stood.length, total_minutes: totalMinutes, no_shows: absent.length,
      },
      notes: debrief || `Run settled by ${fsisRole(user)}.`,
    });

    return Response.json({
      ok: true,
      session: settled,
      hands: stood.length,
      total_minutes: totalMinutes,
      shares_written: timeLogRows.length,
      contractors_settled: contractorPay > 0 ? contractors.length : 0,
      no_shows: absent.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
