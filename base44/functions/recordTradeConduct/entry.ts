import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import {
  TRADE_AWARD, TRADE_COST, TRADE_MARK_LIFETIME_DAYS, recomputeTradeStanding,
} from '../../shared/trade.js';

/**
 * The council records what happened at a handoff: the buyer turned up, or a hand was left waiting.
 * Only accounts carry a ledger — a guest order records nothing, because ordering never requires an
 * account and we will not build a shadow file on people. Every entry states its reason and the buyer
 * can read their own record back.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to record trade conduct.' }, { status: 403 });
    }

    const body = await req.json();
    const orderId = String(body?.order_id || '').trim();
    const kind = String(body?.kind || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!orderId) return Response.json({ error: 'order_id is required.' }, { status: 400 });
    if (!['handoff_completed', 'handoff_no_show', 'late_cancellation', 'council_adjustment'].includes(kind)) {
      return Response.json({ error: 'Unrecognised conduct.' }, { status: 400 });
    }
    if (!reason) return Response.json({ error: 'A reason is required — the buyer will read it.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const order = await svc.order.get(orderId).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });

    const patronId = order.claimed_by_user_id || order.created_by_id;
    if (!patronId) {
      return Response.json({
        error: 'This order was placed as a guest, so there is no account to record against. Trade standing follows accounts only.',
      }, { status: 400 });
    }
    const patron = await svc.User.get(patronId).catch(() => null);
    if (!patron) return Response.json({ error: 'The buyer\u2019s account could not be found.' }, { status: 404 });

    const delta = kind === 'handoff_completed'
      ? TRADE_AWARD.handoffCompleted
      : kind === 'council_adjustment'
        ? Number(body?.delta) || 0
        : TRADE_COST[kind];
    if (!delta) return Response.json({ error: 'An adjustment of zero changes nothing.' }, { status: 400 });

    const now = new Date();
    await svc.trade_event.create({
      patron_user_id: patronId,
      patron_email: patron.email,
      patron_handle: patron.handle || order.customer_handle || patron.email,
      kind,
      delta,
      effective_delta: delta,
      reason,
      order_id: orderId,
      order_tracking_code: order.tracking_code || '',
      actor_email: user.email,
      expires_at: delta < 0 ? new Date(now.getTime() + TRADE_MARK_LIFETIME_DAYS * 86400000).toISOString() : undefined,
    });

    const { total, locked } = await recomputeTradeStanding(base44, patronId);

    await svc.ops_log.create({
      action: `trade_standing.${kind}`,
      entity_type: 'order',
      entity_id: orderId,
      entity_name: order.tracking_code || orderId,
      actor: user.email,
      after: { trade_standing: total, trade_locked: locked },
      notes: reason,
    });

    return Response.json({ ok: true, trade_standing: total, trade_locked: locked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}