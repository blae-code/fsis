import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { canWithdraw } from '../../shared/consignment.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The comrade takes their property back.
 *
 * At any time before it sells, without a reason and without penalty. It is theirs — a consignment
 * that trapped somebody's own goods on our shelf would be the worst possible version of this, and
 * the fact that we priced it and gave it space does not make it ours.
 *
 * The council may also hand something back, which is the same act from the other side and needs a
 * reason, because the comrade did not ask for it.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const id = String(body?.consignment_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!id) return Response.json({ error: 'consignment_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const c = await svc.consignment.get(id);
    if (!c) return Response.json({ error: 'No such consignment.' }, { status: 404 });

    const council = isCouncil(user) || user.role === 'admin';
    const mine = c.consignor_user_id === user.id;
    if (!mine && !council) return Response.json({ error: 'That is not yours to take back.' }, { status: 403 });

    const may = canWithdraw(c);
    if (!may.allowed) return Response.json({ error: may.reason }, { status: 409 });
    if (!mine && !reason) {
      return Response.json({ error: 'Give a reason — the comrade did not ask for this and will want to know why.' }, { status: 400 });
    }

    const now = new Date();
    const claim = await svc.consignment.updateMany(
      { id, status: c.status },
      { $set: {
        status: mine ? 'withdrawn' : 'returned',
        ended_reason: reason || 'Taken back by the consignor. No reason required and none asked for.',
      } },
    );
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'That changed while you were reading it.' }, { status: 409 });
    }

    // Off the shelf, and out of stock — it was never ours to hold.
    if (c.linked_product_id) await svc.product.update(c.linked_product_id, { active: false, stock: 0 }).catch(() => null);
    if (c.loot_item_id) await svc.loot_item.update(c.loot_item_id, { status: 'returned' }).catch(() => null);

    if (!mine) {
      await notify(base44, {
        recipient_user_id: c.consignor_user_id, recipient_handle: c.consignor_callsign,
        kind: 'order_update',
        title: `Handed back: ${c.item_name}`,
        body: [
          'The yard has taken this off the shelf and it is yours to collect.',
          `The reason given: ${reason}`,
          'Nothing is owed either way and nothing is recorded against you.',
        ].join('\n\n'),
        source_type: 'consignment', source_id: id, source_name: c.item_name,
        actor_email: user.email, actor_role: fsisRole(user),
      });
    }

    await svc.ops_log.create({
      action: mine ? 'consignment.withdrawn' : 'consignment.returned',
      entity_type: 'consignment', entity_id: id, entity_name: c.item_name,
      actor: user.email, before: { status: c.status },
      after: { status: mine ? 'withdrawn' : 'returned' },
      notes: reason || 'Withdrawn by the consignor.',
    });

    return Response.json({
      ok: true,
      status: mine ? 'withdrawn' : 'returned',
      note: mine ? 'Taken back. It is yours and always was.' : 'Handed back to the consignor.',
    });
  } catch (error) {
    await reportError(base44, { source: 'withdrawConsignment', error, route: 'withdrawConsignment' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
