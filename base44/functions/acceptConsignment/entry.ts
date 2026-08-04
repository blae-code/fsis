import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { meetsFloor, minimumShelfPrice, termEndsAt } from '../../shared/consignment.js';
import { roundPrice } from '../../shared/money.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The council prices it and puts it on the shelf — or declines it.
 *
 * The floor is the consignor's own figure and is priced ABOVE, never through. A shelf price that
 * would leave them less than they said they would accept is refused outright: the point of asking
 * somebody for a floor is that it means something, and quietly selling under it would be taking a
 * decision that was theirs.
 *
 * The stock record is written with acquisition_source 'consignment' and a zero cost, so the item
 * never counts as the collective's capital. It is on our shelf; it is not our money.
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
    const decision = String(body?.decision || 'accept').trim();
    const notes = String(body?.council_notes || '').trim();
    if (!id) return Response.json({ error: 'consignment_id is required.' }, { status: 400 });
    if (!['accept', 'decline'].includes(decision)) {
      return Response.json({ error: "decision must be 'accept' or 'decline'." }, { status: 400 });
    }
    if (decision === 'decline' && !notes) {
      return Response.json({ error: 'Give a reason. They will read it — it is their property you are handing back.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const c = await svc.consignment.get(id);
    if (!c) return Response.json({ error: 'No such consignment.' }, { status: 404 });
    if (c.status !== 'proposed') {
      return Response.json({ error: `That consignment is already ${c.status}.` }, { status: 409 });
    }

    const now = new Date();

    if (decision === 'decline') {
      await svc.consignment.update(id, { status: 'declined', ended_reason: notes, council_notes: notes });
      await notify(base44, {
        recipient_user_id: c.consignor_user_id,
        recipient_handle: c.consignor_callsign,
        kind: 'order_update',
        title: `Not taken on: ${c.item_name}`,
        body: [
          'The yard has not taken this on for consignment.',
          `The council's reason: ${notes}`,
          'It is still yours and nothing is recorded against you. You could put it in the hall and sell it to another comrade yourself, or ask about buyback if you would rather have credits now.',
        ].join('\n\n'),
        source_type: 'consignment', source_id: id, source_name: c.item_name,
        actor_email: user.email, actor_role: fsisRole(user),
      });
      await svc.ops_log.create({
        action: 'consignment.declined', entity_type: 'consignment', entity_id: id,
        entity_name: c.item_name, actor: user.email, after: { status: 'declined' }, notes,
      });
      return Response.json({ ok: true, decision: 'declined' });
    }

    const shelfPrice = roundPrice(body?.shelf_price_auec);
    if (shelfPrice <= 0) return Response.json({ error: 'Give it a shelf price.' }, { status: 400 });

    // The floor is theirs. Price above it, never through it.
    const clears = meetsFloor(shelfPrice, c.floor_auec, c.commission_percent);
    if (!clears.ok) {
      return Response.json({
        error: clears.reason,
        minimum_shelf_price_auec: minimumShelfPrice(c.floor_auec, c.commission_percent),
      }, { status: 409 });
    }

    // The shelf listing, and a stock record that is explicitly NOT our capital.
    const product = await svc.product.create({
      product_name: c.item_name,
      category: c.item_type === 'bulk_cargo' ? 'salvage_commodity' : (c.item_type || 'ship_component'),
      price_auec: shelfPrice,
      stock: c.quantity || 1,
      description: [c.description, `Consigned stock — sold on behalf of ${c.consignor_callsign}.`].filter(Boolean).join('\n\n'),
      active: true,
    });
    const loot = c.loot_item_id
      ? await svc.loot_item.update(c.loot_item_id, {
        acquisition_source: 'consignment', acquisition_cost_auec: 0,
        consignor_user_id: c.consignor_user_id, linked_product_id: product.id,
        acquired_at: now.toISOString(), status: 'listed',
      }).then(() => ({ id: c.loot_item_id }))
      : await svc.loot_item.create({
        item_name: c.item_name, item_type: c.item_type, condition_grade: c.condition_grade,
        condition_pct: c.condition_pct, quantity: c.quantity || 1,
        // Never the collective's capital. It is on our shelf; it is not our money.
        acquisition_source: 'consignment', acquisition_cost_auec: 0,
        consignor_user_id: c.consignor_user_id, acquired_at: now.toISOString(),
        crew_handle: c.consignor_callsign, status: 'listed',
        linked_product_id: product.id, est_sell_auec: shelfPrice,
      });

    const termEnds = termEndsAt(now, c.term_days);
    const updated = await svc.consignment.update(id, {
      status: 'listed',
      shelf_price_auec: shelfPrice,
      linked_product_id: product.id,
      loot_item_id: loot.id,
      term_ends_at: termEnds,
      council_notes: notes,
    });

    await notify(base44, {
      recipient_user_id: c.consignor_user_id,
      recipient_handle: c.consignor_callsign,
      kind: 'order_update',
      title: `On the shelf: ${c.item_name}`,
      body: [
        `The yard has priced this at ${shelfPrice.toLocaleString()} aUEC and it is now on the storefront.`,
        `When it sells you get ${(shelfPrice - Math.round(shelfPrice * (c.commission_percent || 15) / 100)).toLocaleString()} aUEC — the price less the ${c.commission_percent}% the yard keeps for the shelf, the traffic and the handling.`,
        'It is still yours. You can take it back at any time before it sells, without a reason and without penalty.',
        `If it has not sold by ${String(termEnds).slice(0, 10)} it comes back to you rather than sitting here indefinitely.`,
        notes,
      ].filter(Boolean).join('\n\n'),
      source_type: 'consignment', source_id: id, source_name: c.item_name,
      actor_email: user.email, actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: 'consignment.listed', entity_type: 'consignment', entity_id: id,
      entity_name: c.item_name, actor: user.email,
      after: { shelf_price_auec: shelfPrice, product_id: product.id, term_ends_at: termEnds },
      notes: notes || `Priced and shelved by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, consignment: updated, product_id: product.id, term_ends_at: termEnds });
  } catch (error) {
    await reportError(base44, { source: 'acceptConsignment', error, route: 'acceptConsignment' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
