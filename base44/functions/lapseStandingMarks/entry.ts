import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { totalFromEvents } from '../../shared/reputation.js';
import { recomputeTradeStanding } from '../../shared/trade.js';
import { notifyMany } from '../../shared/notices.js';

/** One notice per comrade, however many of their marks lapsed — not one per mark. */
const countByRecipient = (events: any[], key: string) => {
  const counted = new Map<string, { count: number; handle: string }>();
  for (const event of events) {
    const id = event[key];
    if (!id) continue;
    const seen = counted.get(id) || { count: 0, handle: '' };
    seen.count += 1;
    seen.handle = seen.handle || event.member_handle || event.patron_handle || '';
    counted.set(id, seen);
  }
  return counted;
};

/**
 * No comrade is condemned in perpetuity by one bad month. Marks past their stated lifetime
 * stop counting, a plain 'mark lapsed' entry is written so the worker can see why their
 * standing moved, and every affected total is recomputed.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    // The buyer's side of the same principle: trade marks lapse too, on their own stated schedule.
    const expiredTrade = await svc.trade_event.filter(
      { voided: false, expires_at: { $lte: now.toISOString() } }, 'expires_at', 200,
    );
    const tradeCounting = expiredTrade.filter((e) => (Number(e.effective_delta) || 0) !== 0);
    if (tradeCounting.length > 0) {
      await svc.trade_event.bulkUpdate(tradeCounting.map((e) => ({ id: e.id, voided: true })));
      await svc.trade_event.bulkCreate(tradeCounting.map((e) => ({
        patron_user_id: e.patron_user_id,
        patron_email: e.patron_email,
        patron_handle: e.patron_handle,
        kind: 'decay',
        delta: 0,
        effective_delta: 0,
        reason: `Trade mark lapsed after its stated lifetime and no longer counts: ${e.reason || e.kind}`,
        order_id: e.order_id || '',
        order_tracking_code: e.order_tracking_code || '',
        actor_email: 'FSIS.bot',
      })));
      const tradeTotals = new Map();
      for (const patronId of [...new Set(tradeCounting.map((e) => e.patron_user_id).filter(Boolean))]) {
        const { total, locked } = await recomputeTradeStanding(base44, patronId);
        tradeTotals.set(patronId, { total, locked });
      }

      // Good news is owed as plainly as bad. A surcharge lifting is the buyer's business.
      await notifyMany(base44, [...countByRecipient(tradeCounting, 'patron_user_id')].map(([patronId, seen]) => {
        const settled = tradeTotals.get(patronId);
        return {
          recipient_user_id: patronId,
          recipient_handle: seen.handle,
          kind: 'trade_standing_lapsed',
          title: seen.count === 1 ? 'A trade mark lapsed' : `${seen.count} trade marks lapsed`,
          body: [
            `${seen.count === 1 ? 'A mark' : `${seen.count} marks`} on your trade record passed the stated lifetime and no longer counts against you.`,
            `Your trade standing now stands at ${settled?.total ?? 0}.`,
            settled?.locked
              ? 'A lock still stands on your account for the remaining marks; it lifts as those lapse in turn or the council forgives them.'
              : 'Nothing is owed either way, and any surcharge carried by those marks has lifted.',
            'This is your trade record only. It is kept wholly apart from labour standing and never touches it.',
          ].join('\n\n'),
          source_type: 'trade_event',
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        };
      }));
    }

    const expired = await svc.standing_event.filter(
      { voided: false, expires_at: { $lte: now.toISOString() } }, 'expires_at', 200,
    );
    const stillCounting = expired.filter((e) => (Number(e.effective_delta) || 0) !== 0);

    if (stillCounting.length === 0) {
      return Response.json({ ok: true, lapsed: 0, members_recomputed: 0, trade_marks_lapsed: tradeCounting.length });
    }

    // The original assessment is never rewritten — it is voided, and its lapse is recorded.
    await svc.standing_event.bulkUpdate(stillCounting.map((e) => ({ id: e.id, voided: true })));
    await svc.standing_event.bulkCreate(stillCounting.map((e) => ({
      member_user_id: e.member_user_id,
      member_email: e.member_email,
      member_handle: e.member_handle,
      kind: 'decay',
      delta: 0,
      effective_delta: 0,
      reason: `Mark lapsed after its stated lifetime and no longer counts: ${e.reason || e.source_name || e.kind}`,
      source_type: 'standing_event',
      source_id: e.id,
      source_name: e.source_name || '',
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    })));

    const memberIds = [...new Set(stillCounting.map((e) => e.member_user_id).filter(Boolean))];
    const memberTotals = new Map();
    for (const userId of memberIds) {
      const events = await svc.standing_event.filter({ member_user_id: userId }, '-created_date', 500);
      const total = totalFromEvents(events, now);
      memberTotals.set(userId, total);
      await svc.User.update(userId, { reputation: total });
    }

    // No comrade is condemned in perpetuity by one bad month — and they are told when it ends,
    // rather than being left to notice the number moved.
    await notifyMany(base44, [...countByRecipient(stillCounting, 'member_user_id')].map(([userId, seen]) => ({
      recipient_user_id: userId,
      recipient_handle: seen.handle,
      kind: 'standing_lapsed',
      title: seen.count === 1 ? 'A mark against you lapsed' : `${seen.count} marks against you lapsed`,
      body: [
        `${seen.count === 1 ? 'A mark' : `${seen.count} marks`} on your standing passed the stated lifetime and stopped counting. No comrade is condemned in perpetuity by one bad month.`,
        `Your standing now stands at ${memberTotals.get(userId) ?? 0}.`,
        'The original assessments have not been erased — each was voided and its lapse written plainly into your record, which you can read in full on the labour board.',
      ].join('\n\n'),
      source_type: 'standing_event',
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    })));

    await svc.ops_log.create({
      action: 'standing.marks_lapsed',
      entity_type: 'standing_event',
      entity_name: `${stillCounting.length} mark(s)`,
      actor: 'FSIS.bot',
      after: { lapsed: stillCounting.length, members_recomputed: memberIds.length },
      notes: 'Marks past their stated lifetime stopped counting.',
    });

    return Response.json({
      ok: true,
      lapsed: stillCounting.length,
      members_recomputed: memberIds.length,
      trade_marks_lapsed: tradeCounting.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}