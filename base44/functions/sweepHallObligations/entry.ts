import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { daysOverdue, dueLadderSteps } from '../../shared/hall.js';
import { TRADE_COST, TRADE_MARK_LIFETIME_DAYS, recomputeTradeStanding } from '../../shared/trade.js';
import { notify } from '../../shared/notices.js';

/**
 * Climbing the ladder on debts to the hall, one rung at a time.
 *
 * Every rung is a notice before it is a consequence, and each says what the next one is. A member
 * losing their listing privileges one morning with no idea it was coming would be the failure this
 * exists to prevent — the point of a stated ladder is that nobody is surprised by it.
 *
 * The last rung is a standing mark, and it carries the ordinary appeal route and expiry like any
 * other. This is about somebody who will not answer, not somebody who cannot pay: the council can
 * waive any debt at any rung, and nothing here happens that an Owner cannot undo.
 *
 * Each rung is claimed before it is acted on, so an overlapping sweep cannot dun somebody twice or
 * mark them twice for the same debt.
 */
const STEP_ORDER = ['reminded', 'chased', 'suspended', 'marked'];

const STEP_TITLE: Record<string, string> = {
  reminded: 'Commission due',
  chased: 'Still outstanding',
  suspended: 'Listing suspended over an unpaid commission',
  marked: 'A mark was recorded over an unpaid commission',
};

const STEP_SAYS: Record<string, string> = {
  reminded: 'Settle it in-game and tell the council; they will record it received.',
  chased: 'Settle it when you can. If something is in the way, say so — a debt somebody is talking about is not the problem this ladder is for.',
  suspended: 'Your listing privileges are suspended until it is settled. Nothing else is affected: you may still bid, still work, still draw pay.',
  marked: 'A mark has been recorded on your trade standing. It carries the ordinary appeal route and lapses on its own like any other. Settling now does not lift it, but it does stop the ladder here.',
};

const STEP_NEXT: Record<string, string> = {
  reminded: 'a reminder',
  chased: 'a second notice',
  suspended: 'listing privileges suspended',
  marked: 'a trade standing mark',
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const owed = [
      ...(await svc.hall_obligation.filter({ status: 'owed' }, 'due_at', 200)),
      ...(await svc.hall_obligation.filter({ status: 'overdue' }, 'due_at', 200)),
    ];

    const climbed = [];

    for (const obligation of owed) {
      const steps = dueLadderSteps(obligation, now);
      if (steps.length === 0) continue;

      const overdue = daysOverdue(obligation, now);
      const done = obligation.reminded_at || [];
      const stepKeys = steps.map((s: any) => s.key);

      // Claim the rungs before acting on them.
      const claim = await svc.hall_obligation.updateMany(
        { id: obligation.id, reminded_at: done },
        {
          $set: {
            reminded_at: [...done, ...stepKeys],
            status: overdue > 0 ? 'overdue' : 'owed',
            ...(stepKeys.includes('suspended') ? { listing_suspended: true } : {}),
          },
        },
      );
      if (!claim || claim.updated === 0) continue;

      const highest = steps[steps.length - 1];
      const nextStep = STEP_ORDER.filter((k) => !done.includes(k) && !stepKeys.includes(k))[0] || '';

      // The last rung: a mark on the buyer's ledger, appealable and expiring like any other.
      if (stepKeys.includes('marked')) {
        await svc.trade_event.create({
          patron_user_id: obligation.debtor_user_id,
          patron_handle: obligation.debtor_handle,
          kind: 'council_adjustment',
          delta: TRADE_COST.late_cancellation,
          effective_delta: TRADE_COST.late_cancellation,
          reason: `Commission of ${Number(obligation.amount_auec).toLocaleString()} aUEC on "${obligation.lot_title}" unpaid ${overdue} days past its due date.`,
          expires_at: new Date(now.getTime() + TRADE_MARK_LIFETIME_DAYS * 86400000).toISOString(),
          actor_email: 'FSIS.bot',
        });
        await recomputeTradeStanding(base44, obligation.debtor_user_id);
      }

      await notify(base44, {
        recipient_user_id: obligation.debtor_user_id,
        recipient_handle: obligation.debtor_handle,
        kind: stepKeys.includes('marked') ? 'trade_marked' : 'order_update',
        title: `${STEP_TITLE[highest.key]}${highest.key === 'reminded' || highest.key === 'chased' ? `: ${obligation.lot_title}` : ''}`,
        body: [
          `${Number(obligation.amount_auec).toLocaleString()} aUEC is owed to the hall on "${obligation.lot_title}", which sold for ${Number(obligation.sale_auec).toLocaleString()} at ${obligation.commission_percent}%.`,
          overdue > 0 ? `It fell due ${overdue} day${overdue === 1 ? '' : 's'} ago.` : 'It is due now.',
          STEP_SAYS[highest.key],
          nextStep
            ? `If it stays unsettled, the next step is: ${STEP_NEXT[nextStep]}.`
            : 'That is the last step. Nothing further follows automatically.',
          'If you cannot pay, tell the council. Any of this can be waived, and a debt somebody is talking about is not the problem this is for.',
        ].filter(Boolean).join('\n\n'),
        source_type: 'hall_obligation',
        source_id: obligation.id,
        source_name: obligation.lot_title,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });

      climbed.push({ obligation_id: obligation.id, handle: obligation.debtor_handle, steps: stepKeys, days_overdue: overdue });
    }

    if (climbed.length > 0) {
      await svc.ops_log.create({
        action: 'hall.obligations_swept',
        entity_type: 'hall_obligation',
        entity_name: `${climbed.length} debt(s)`,
        actor: 'FSIS.bot',
        after: { climbed: climbed.length },
        notes: climbed.map((c) => `${c.handle}: ${c.steps.join(', ')} (${c.days_overdue}d)`).join('; '),
      });
    }

    return Response.json({ ok: true, checked: owed.length, acted_on: climbed.length, climbed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
