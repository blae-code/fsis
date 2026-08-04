import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { totalFromEvents, tierFor, storefrontAdjustment } from '../../shared/reputation.js';
import { totalFromTradeEvents, tradeTierFor, tradeAdjustment } from '../../shared/trade.js';
import { findCrewMemberFor, fetchConfirmedLogsFor, sharesInLogs, drawsFromSharePool } from '../../shared/members.js';
import { reportError } from '../../shared/diagnostics.js';
import { roundShares } from '../../shared/money.js';

/**
 * Why is this comrade's standing — or pay — what it is?
 *
 * The question somebody will actually ask in production, and the one that is hardest to answer from
 * a database. "I was told I have 40 standing but the storefront charged me a surcharge." "My shares
 * did not appear on pay day." Answering either means walking four or five records and doing the
 * arithmetic by hand, at which point whoever is helping has to be the person who wrote the code.
 *
 * So this walks it for them and, crucially, RECOMPUTES rather than reporting the cached figures. If
 * the cache and the events disagree, that disagreement is the answer, and it is stated at the top.
 *
 * A comrade may trace themselves. Only the council may trace somebody else — the whole point is
 * being able to answer a question a comrade has asked, and their record is not public.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const askedFor = String(body?.user_id || '').trim();
    const council = isCouncil(user) || user.role === 'admin';
    if (askedFor && askedFor !== user.id && !council) {
      return Response.json({ error: 'You may trace your own record. Another comrade\'s is theirs.' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const targetId = askedFor || user.id;
    const member = await svc.User.get(targetId).catch(() => null);
    if (!member) return Response.json({ error: 'No such comrade.' }, { status: 404 });

    const now = new Date();

    const [standingEvents, tradeEvents, crew, tasks] = await Promise.all([
      svc.standing_event.filter({ member_user_id: targetId }, '-created_date', 300),
      svc.trade_event.filter({ patron_user_id: targetId }, '-created_date', 300),
      svc.crew_member.filter({ active: true }, '-created_date', 200),
      svc.labour_task.filter({ crew_user_ids: targetId }, '-created_date', 100).catch(() => []),
    ]);

    // Recomputed, not read back. A disagreement here IS the answer to most questions.
    const standingTruth = totalFromEvents(standingEvents, now);
    const standingCached = Number(member.reputation) || 0;
    const tradeTruth = totalFromTradeEvents(tradeEvents, now);
    const tradeCached = Number(member.trade_standing) || 0;

    const rosterPlace = findCrewMemberFor(crew, member);
    const logs = await fetchConfirmedLogsFor(base44, {
      userId: targetId,
      handle: rosterPlace?.handle || member.handle,
    });

    const openCycles = await svc.payday_cycle.filter({ status: 'open' }, '-opens_at', 1);
    const cycle = openCycles[0] || null;
    const snapshotLine = cycle
      ? (cycle.shares_by_handle || []).find((l: any) => (l.user_id && l.user_id === targetId)
        || (!l.user_id && String(l.handle || '').toLowerCase() === String(rosterPlace?.handle || member.handle || '').toLowerCase()))
      : null;

    const drawsPool = drawsFromSharePool(member);
    const discrepancies = [];
    if (standingTruth !== standingCached) {
      discrepancies.push({
        what: 'Labour standing cached does not match its events.',
        cached: standingCached, truth: standingTruth,
        means: 'They are being shown, and priced at, a figure their own record does not support.',
        fix: 'recomputeStanding for this comrade.',
      });
    }
    if (tradeTruth !== tradeCached) {
      discrepancies.push({
        what: 'Trade standing cached does not match its events.',
        cached: tradeCached, truth: tradeTruth,
        means: 'A surcharge or discount is being applied that the record does not support.',
        fix: 'recomputeTradeStanding for this comrade.',
      });
    }
    if (!rosterPlace && drawsPool) {
      discrepancies.push({
        what: 'No roster place resolves for this comrade.',
        means: 'They will not appear on a pay day cycle at all, and getMyPayday returns linked:false. This is the usual reason somebody says their shares vanished.',
        fix: 'Add them to the crew roster, or link the existing place to their account (crew_member.user_id).',
      });
    }
    if (rosterPlace && !rosterPlace.user_id) {
      discrepancies.push({
        what: 'Their roster place resolves only by callsign.',
        means: 'It still works, but a rename would cut them off from their own shares, and the guard against another comrade reading their record does not apply.',
        fix: 'Link the roster place to their account.',
      });
    }
    if (cycle && drawsPool && !snapshotLine && sharesInLogs(logs) > 0) {
      discrepancies.push({
        what: 'They hold shares but do not appear on the open cycle.',
        means: 'Their labour was recorded after the cycle opened, so it settles on the next one — or their roster place did not resolve when the snapshot was taken.',
        fix: 'Nothing is lost; shares roll forward. If it recurs, check the roster link.',
      });
    }

    return Response.json({
      comrade: {
        user_id: targetId,
        handle: member.handle || '',
        email: council ? member.email : undefined,
        standing_role: fsisRole(member),
        draws_from_share_pool: drawsPool,
        standing_locked: !!member.standing_locked,
        trade_locked: !!member.trade_locked,
      },
      // Stated first, because if anything here is non-empty it is almost certainly the answer.
      discrepancies,
      labour_standing: {
        cached: standingCached,
        recomputed: standingTruth,
        agrees: standingTruth === standingCached,
        tier: tierFor(standingTruth).label,
        storefront_adjustment_percent: storefrontAdjustment({ ...member, reputation: standingTruth }),
        events: standingEvents.map((e: any) => ({
          at: e.created_date, kind: e.kind, delta: e.delta, effective: e.effective_delta,
          counts_now: !e.voided && (!e.expires_at || new Date(e.expires_at) > now),
          voided: !!e.voided, expires_at: e.expires_at || '', reason: e.reason,
          appeal_status: e.appeal_status || 'none',
        })),
      },
      trade_standing: {
        cached: tradeCached,
        recomputed: tradeTruth,
        agrees: tradeTruth === tradeCached,
        tier: tradeTierFor(tradeTruth).label,
        storefront_adjustment_percent: tradeAdjustment({ ...member, trade_standing: tradeTruth }),
        events: tradeEvents.map((e: any) => ({
          at: e.created_date, kind: e.kind, effective: e.effective_delta,
          counts_now: !e.voided && (!e.expires_at || new Date(e.expires_at) > now),
          reason: e.reason,
        })),
      },
      pay: {
        roster_place: rosterPlace
          ? { id: rosterPlace.id, handle: rosterPlace.handle, linked_to_account: !!rosterPlace.user_id }
          : null,
        confirmed_shares: sharesInLogs(logs),
        confirmed_logs: logs.length,
        open_cycle: cycle ? { id: cycle.id, closes_at: cycle.closes_at, share_value_auec: cycle.share_value_auec } : null,
        on_open_cycle: !!snapshotLine,
        shares_on_cycle: snapshotLine ? roundShares(snapshotLine.shares) : 0,
      },
      work: {
        tasks_held: tasks.length,
        titles: tasks.slice(0, 20).map((t: any) => ({ id: t.id, title: t.title, status: t.status })),
      },
      note: discrepancies.length === 0
        ? 'Every cached figure matches the record it is computed from.'
        : 'The discrepancies above are almost certainly what the comrade is asking about.',
    });
  } catch (error) {
    await reportError(base44, { source: 'traceMember', error, route: 'traceMember' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
