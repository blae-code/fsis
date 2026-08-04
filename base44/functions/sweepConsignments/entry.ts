import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { termExpired } from '../../shared/consignment.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError, recordSweep } from '../../shared/diagnostics.js';

/**
 * Consignments whose term has run out come back off the shelf.
 *
 * Without this, somebody's property sits on our storefront indefinitely because nobody remembered
 * it was there — which is exactly the state a consignment agreement exists to prevent. Every
 * consignment ends, and it ends by returning to the person it belongs to rather than by being
 * forgotten.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const sweepStartedAt = new Date();
  const recordAnd = async (payload: any) => {
    await recordSweep(base44, { job: 'sweepConsignments', ok: true, outcome: payload, startedAt: sweepStartedAt });
    return Response.json(payload);
  };
  try {
    const svc = base44.asServiceRole.entities;
    const now = new Date();
    const listed = await svc.consignment.filter({ status: 'listed' }, 'term_ends_at', 200);
    const due = listed.filter((c: any) => termExpired(c, now));

    if (due.length === 0) return recordAnd({ ok: true, returned: 0, on_shelf: listed.length });

    const returned = [];
    for (const c of due) {
      const claim = await svc.consignment.updateMany(
        { id: c.id, status: 'listed' },
        { $set: { status: 'returned', ended_reason: `The agreed term of ${c.term_days} days ran out.` } },
      );
      if (!claim || claim.updated === 0) continue;
      if (c.linked_product_id) await svc.product.update(c.linked_product_id, { active: false, stock: 0 }).catch(() => null);
      if (c.loot_item_id) await svc.loot_item.update(c.loot_item_id, { status: 'returned' }).catch(() => null);
      returned.push(c);
    }

    await notifyMany(base44, returned.map((c: any) => ({
      recipient_user_id: c.consignor_user_id,
      recipient_handle: c.consignor_callsign,
      kind: 'order_update',
      title: `Back to you: ${c.item_name}`,
      body: [
        `This sat on the shelf for the agreed ${c.term_days} days without selling, so it comes back to you rather than staying here indefinitely.`,
        'Nothing is owed either way. If you would like it listed again — at a different price, perhaps — say so, or put it in the hall and let a comrade bid on it.',
      ].join('\n\n'),
      source_type: 'consignment', source_id: c.id, source_name: c.item_name,
      actor_email: 'FSIS.bot', actor_role: 'system',
    })));

    if (returned.length > 0) {
      await svc.ops_log.create({
        action: 'consignment.terms_expired', entity_type: 'consignment',
        entity_name: `${returned.length} consignment(s)`, actor: 'FSIS.bot',
        after: { returned: returned.length },
        notes: returned.map((c: any) => c.item_name).join('; '),
      });
    }
    return recordAnd({ ok: true, returned: returned.length, on_shelf: listed.length });
  } catch (error) {
    await reportError(base44, { source: 'sweepConsignments', error, route: 'sweepConsignments' });
    await recordSweep(base44, { job: 'sweepConsignments', ok: false, error, startedAt: sweepStartedAt });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
