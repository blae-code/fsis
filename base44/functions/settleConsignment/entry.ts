import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { splitSale, meetsFloor } from '../../shared/consignment.js';
import { roundAuec } from '../../shared/money.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * It sold, and then: we paid them.
 *
 * Two steps, deliberately apart. The buyer pays FSIS at the storefront, so between the sale and the
 * handover the collective is holding a comrade's money — that is a real debt the other way round
 * from everything else here, and collapsing it into one step would let the record show somebody
 * paid when nothing had left our hands.
 *
 * The remainder on an uneven split goes to the CONSIGNOR. It is their property and their sale; a
 * collective that keeps the odd credit every time is skimming, however small the sum.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const id = String(body?.consignment_id || '').trim();
    const step = String(body?.step || 'sold').trim();
    if (!id) return Response.json({ error: 'consignment_id is required.' }, { status: 400 });
    if (!['sold', 'paid'].includes(step)) {
      return Response.json({ error: "step must be 'sold' or 'paid'." }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const c = await svc.consignment.get(id);
    if (!c) return Response.json({ error: 'No such consignment.' }, { status: 404 });
    const now = new Date();

    // ── it sold ──────────────────────────────────────────────────────────────
    if (step === 'sold') {
      if (c.status !== 'listed') {
        return Response.json({ error: `That consignment is ${c.status}, not on the shelf.` }, { status: 409 });
      }
      const sale = roundAuec(body?.sold_auec ?? c.shelf_price_auec);
      if (sale <= 0) return Response.json({ error: 'State what it sold for.' }, { status: 400 });

      // Their floor is theirs, at the moment of sale as much as at the moment of pricing.
      const clears = meetsFloor(sale, c.floor_auec, c.commission_percent);
      if (!clears.ok && body?.confirm_below_floor !== true) {
        return Response.json({ error: clears.reason, confirm_with: 'confirm_below_floor: true' }, { status: 409 });
      }

      const split = splitSale(sale, c.commission_percent);
      const claim = await svc.consignment.updateMany(
        { id, status: 'listed' },
        { $set: {
          status: 'sold', sold_auec: split.sale_auec, commission_auec: split.commission_auec,
          payout_auec: split.payout_auec, sold_at: now.toISOString(),
        } },
      );
      if (!claim || claim.updated === 0) {
        return Response.json({ error: 'That consignment changed while you were reading it.' }, { status: 409 });
      }

      if (c.loot_item_id) {
        await svc.loot_item.update(c.loot_item_id, { status: 'sold', actual_sell_auec: split.sale_auec }).catch(() => null);
      }
      // The yard's cut is income; the rest was never ours.
      await svc.ledger_entry.create({
        entry_type: 'income', category: 'commission',
        amount_auec: split.commission_auec,
        counterparty: c.consignor_callsign,
        description: `Consignment commission — ${c.item_name} sold at ${split.sale_auec.toLocaleString()} aUEC (${split.commission_percent}%)`,
        entry_date: now.toISOString().slice(0, 10), source: 'automation',
      }).catch(() => null);

      await notify(base44, {
        recipient_user_id: c.consignor_user_id, recipient_handle: c.consignor_callsign,
        kind: 'order_update',
        title: `Sold: ${c.item_name}`,
        body: [
          `It went for ${split.sale_auec.toLocaleString()} aUEC.`,
          `You are owed ${split.payout_auec.toLocaleString()} — the sale less the ${split.commission_percent}% the yard keeps (${split.commission_auec.toLocaleString()}).`,
          'The buyer paid FSIS, so the collective is holding your money until it hands it over. You will be told again when it has actually reached you; if it does not, say so.',
        ].join('\n\n'),
        source_type: 'consignment', source_id: id, source_name: c.item_name,
        actor_email: user.email, actor_role: fsisRole(user),
      });

      await svc.ops_log.create({
        action: 'consignment.sold', entity_type: 'consignment', entity_id: id,
        entity_name: c.item_name, actor: user.email,
        after: { sold_auec: split.sale_auec, commission_auec: split.commission_auec, payout_auec: split.payout_auec },
        notes: `Owed to ${c.consignor_callsign}: ${split.payout_auec.toLocaleString()} aUEC.`,
      });

      return Response.json({ ok: true, ...split, owed_to_consignor: split.payout_auec });
    }

    // ── we paid them ─────────────────────────────────────────────────────────
    if (c.status !== 'sold') {
      return Response.json({ error: `Nothing is owed on a consignment that is ${c.status}.` }, { status: 409 });
    }
    const paid = await svc.consignment.updateMany(
      { id, status: 'sold' },
      { $set: { status: 'settled', paid_at: now.toISOString(), paid_by_email: user.email } },
    );
    if (!paid || paid.updated === 0) {
      return Response.json({ error: 'That was settled by somebody else a moment ago.' }, { status: 409 });
    }

    await svc.ledger_entry.create({
      entry_type: 'expense', category: 'consignment_payout',
      amount_auec: roundAuec(c.payout_auec),
      counterparty: c.consignor_callsign,
      description: `Consignment payout — ${c.item_name}`,
      entry_date: now.toISOString().slice(0, 10), source: 'automation',
    }).catch(() => null);

    await notify(base44, {
      recipient_user_id: c.consignor_user_id, recipient_handle: c.consignor_callsign,
      kind: 'order_update',
      title: `Paid: ${c.item_name}`,
      body: [
        `${roundAuec(c.payout_auec).toLocaleString()} aUEC has been recorded as handed over to you.`,
        'Payment happens in-game, so this is a record of a transfer rather than the transfer itself. If it has not actually reached you, say so and it will be corrected.',
      ].join('\n\n'),
      source_type: 'consignment', source_id: id, source_name: c.item_name,
      actor_email: user.email, actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: 'consignment.settled', entity_type: 'consignment', entity_id: id,
      entity_name: c.item_name, actor: user.email,
      before: { status: 'sold' }, after: { status: 'settled', payout_auec: c.payout_auec },
      notes: `Paid to ${c.consignor_callsign}.`,
    });

    return Response.json({ ok: true, status: 'settled', payout_auec: roundAuec(c.payout_auec) });
  } catch (error) {
    await reportError(base44, { source: 'settleConsignment', error, route: 'settleConsignment' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
