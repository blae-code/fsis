import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { commissionDueAt, commissionOn, endStateFor, hasClosed } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * Every lot whose time is up reaches a terminal state.
 *
 * This is the sweep that makes "no lot hangs open forever" true rather than merely intended. A lot
 * that met its reserve is `won` and awaits settlement between the two comrades; one that did not is
 * closed honestly as `reserve_not_met` rather than left open in the hope somebody bids later.
 *
 * Where a lot is won, the hall's commission falls due — recorded as an obligation with a date, not
 * taken, because the hall never touches the money. Settlement happens in-game.
 *
 * Runs on a schedule. Each lot is claimed before anything is written, so an overlapping sweep cannot
 * close the same lot twice and raise two commissions on one sale.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();

    const open = [
      ...(await svc.hall_lot.filter({ status: 'listed' }, 'closes_at', 200)),
      ...(await svc.hall_lot.filter({ status: 'bidding' }, 'closes_at', 200)),
    ];
    const due = open.filter((lot: any) => hasClosed(lot, now));

    if (due.length === 0) {
      return Response.json({ ok: true, closed: 0, open: open.length });
    }

    const closed = [];
    const notices = [];

    for (const lot of due) {
      const endState = endStateFor(lot);
      const sale = roundAuec(lot.current_bid_auec);
      const commission = endState === 'won' ? commissionOn(sale, lot.commission_percent) : 0;

      // Claim it. Closing twice would raise two commissions on one sale.
      const claim = await svc.hall_lot.updateMany(
        { id: lot.id, status: lot.status },
        {
          $set: {
            status: endState,
            closed_at: now.toISOString(),
            commission_auec: commission,
          },
        },
      );
      if (!claim || claim.updated === 0) continue;

      if (endState === 'won') {
        // An obligation with a date, not money taken. The hall keeps the hall, not the goods.
        await svc.hall_obligation.create({
          lot_id: lot.id,
          lot_title: lot.title,
          debtor_user_id: lot.seller_user_id,
          debtor_handle: lot.seller_handle,
          kind: 'commission',
          amount_auec: commission,
          sale_auec: sale,
          commission_percent: lot.commission_percent,
          incurred_at: now.toISOString(),
          due_at: commissionDueAt(now),
          status: 'owed',
        });

        notices.push({
          recipient_user_id: lot.seller_user_id,
          recipient_handle: lot.seller_handle,
          kind: 'order_update',
          title: `Sold: ${lot.title}`,
          body: [
            `Your lot closed at ${sale.toLocaleString()} aUEC to ${lot.current_bidder_handle}.`,
            `The hall's commission is ${commission.toLocaleString()} aUEC (${lot.commission_percent}%), owed within 30 days. FSIS records the trade rather than holding it, so nothing has been taken from you — you owe it, and you settle it.`,
            'Arrange the handoff with the buyer. When the goods have changed hands, both of you confirm it, and the lot is settled.',
          ].join('\n\n'),
          source_type: 'hall_lot',
          source_id: lot.id,
          source_name: lot.title,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });

        if (lot.current_bidder_user_id) {
          notices.push({
            recipient_user_id: lot.current_bidder_user_id,
            recipient_handle: lot.current_bidder_handle,
            kind: 'order_update',
            title: `You won: ${lot.title}`,
            body: [
              `Yours at ${sale.toLocaleString()} aUEC.`,
              `Arrange the handoff with ${lot.seller_handle}. Payment happens in-game — the hall records the trade rather than escrowing it, so neither of you is protected by anything but the other's word and the record kept here.`,
              'When the goods have changed hands, confirm it. The seller confirms too, and the lot is settled.',
            ].join('\n\n'),
            source_type: 'hall_lot',
            source_id: lot.id,
            source_name: lot.title,
            actor_email: 'FSIS.bot',
            actor_role: 'system',
          });
        }
      } else {
        // It did not sell. Said plainly, with what can be done about it.
        notices.push({
          recipient_user_id: lot.seller_user_id,
          recipient_handle: lot.seller_handle,
          kind: 'order_update',
          title: endState === 'no_bids'
            ? `Closed with no bids: ${lot.title}`
            : `Reserve not met: ${lot.title}`,
          body: [
            endState === 'no_bids'
              ? 'Nobody bid on this lot before it closed.'
              : `The best bid was ${sale.toLocaleString()} aUEC, below the reserve you set, so it did not sell.`,
            'Nothing is owed and nothing is held against you. You can relist it — a relisting keeps a link back to this lot so its history is not lost.',
          ].join('\n\n'),
          source_type: 'hall_lot',
          source_id: lot.id,
          source_name: lot.title,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }

      // Everyone watching hears too.
      for (const watcher of lot.watcher_user_ids || []) {
        if (watcher === lot.seller_user_id || watcher === lot.current_bidder_user_id) continue;
        notices.push({
          recipient_user_id: watcher,
          kind: 'order_update',
          title: `Closed: ${lot.title}`,
          body: endState === 'won'
            ? `A lot you were watching sold at ${sale.toLocaleString()} aUEC.`
            : 'A lot you were watching closed without selling. It may be relisted.',
          source_type: 'hall_lot',
          source_id: lot.id,
          source_name: lot.title,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        });
      }

      closed.push({ lot_id: lot.id, title: lot.title, end_state: endState, sale_auec: sale, commission_auec: commission });
    }

    await notifyMany(base44, notices);

    if (closed.length > 0) {
      await svc.ops_log.create({
        action: 'hall.lots_closed',
        entity_type: 'hall_lot',
        entity_name: `${closed.length} lot(s)`,
        actor: 'FSIS.bot',
        after: { closed: closed.length },
        notes: closed.map((c) => `${c.title} → ${c.end_state}`).join('; '),
      });
    }

    return Response.json({ ok: true, closed: closed.length, lots: closed, open: open.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
