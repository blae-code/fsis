import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { LIVE_STATES, liveLotAllowance, suspendsListing } from '../../shared/hall.js';
import { reportError } from '../../shared/diagnostics.js';
import { notify } from '../../shared/notices.js';

const DEFAULT_HOURS = 48;
const MAX_HOURS = 24 * 14;

/**
 * A draft lot goes to the floor.
 *
 * This was the missing half of bulk intake. `bulkDraftHallLots` writes up to fifty lots as drafts —
 * deliberately, because bulk entry is where a mistyped reserve gets past somebody — and a lot held
 * for appraisal is written as a draft too. Nothing then existed to release any of them. A seller
 * could write up a hold full of gear and never sell a single piece of it, and the council could hold
 * a lot for appraisal with no way to say the appraisal had passed.
 *
 * A draft leaves the floor by the same guards a fresh listing meets: nothing owed, nothing already
 * committed elsewhere, and inside the seller's allowance. Those are checked at release rather than
 * at write-up, because a draft can sit for days and the world moves.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ids = [...new Set((Array.isArray(body?.lot_ids) ? body.lot_ids : [])
      .map((id: unknown) => String(id || '').trim()).filter(Boolean))] as string[];
    if (ids.length === 0) return Response.json({ error: 'lot_ids is required.' }, { status: 400 });
    if (ids.length > 50) return Response.json({ error: 'Release fifty or fewer at a time.' }, { status: 400 });

    const hours = Number(body?.hours);
    const runFor = Number.isFinite(hours) && hours > 0 && hours <= MAX_HOURS ? Math.floor(hours) : DEFAULT_HOURS;

    const svc = base44.asServiceRole.entities;
    const council = isCouncil(user) || user.role === 'admin';
    const now = new Date();
    const closesAt = new Date(now.getTime() + runFor * 3600000).toISOString();

    const released: any[] = [];
    const refused: any[] = [];

    // Read once rather than per lot.
    const debts = await svc.hall_obligation.filter({ debtor_user_id: user.id }, '-due_at', 50);
    const suspending = debts.find((d: any) => suspendsListing(d));
    const allowance = liveLotAllowance(user);
    const mineLive = await svc.hall_lot.filter(
      { seller_user_id: user.id, status: { $in: LIVE_STATES } }, '-created_date', 60,
    );
    // Drafts are live for the allowance's purposes only once released.
    let liveCount = mineLive.filter((l: any) => l.status !== 'draft').length;

    for (const id of ids) {
      const lot = await svc.hall_lot.get(id).catch(() => null);
      if (!lot) { refused.push({ lot_id: id, reason: 'No such lot.' }); continue; }
      if (lot.status !== 'draft') {
        refused.push({ lot_id: id, title: lot.title, reason: `Already ${lot.status}; only a draft can be released.` });
        continue;
      }
      // A seller releases their own; the council may release one it held for appraisal.
      if (lot.seller_user_id !== user.id && !council) {
        refused.push({ lot_id: id, title: lot.title, reason: 'That draft is not yours.' });
        continue;
      }
      if (lot.held_for_appraisal && !council) {
        refused.push({
          lot_id: id, title: lot.title,
          reason: 'This one is held for the council to look at the stated grade. They release it, and you will be told when they do.',
        });
        continue;
      }
      if (suspending && lot.seller_user_id === user.id) {
        refused.push({
          lot_id: id, title: lot.title,
          reason: `Listing is suspended while ${Number(suspending.amount_auec).toLocaleString()} aUEC is outstanding.`,
        });
        continue;
      }
      if (lot.seller_user_id === user.id && liveCount >= allowance) {
        refused.push({
          lot_id: id, title: lot.title,
          reason: `That would take you past ${allowance} live lots. Close or withdraw one, or release this later.`,
        });
        continue;
      }
      // The world moved while it sat in draft: the item may since have been committed elsewhere.
      if (lot.loot_item_id) {
        const clash = await svc.hall_lot.filter(
          { loot_item_id: lot.loot_item_id, status: { $in: LIVE_STATES } }, '-created_date', 5,
        );
        if (clash.some((c: any) => c.id !== id && c.status !== 'draft')) {
          refused.push({ lot_id: id, title: lot.title, reason: 'That item is now committed elsewhere in the hall.' });
          continue;
        }
      }

      const claim = await svc.hall_lot.updateMany(
        { id, status: 'draft' },
        {
          $set: {
            status: 'listed',
            held_for_appraisal: false,
            opens_at: now.toISOString(),
            closes_at: closesAt,
          },
        },
      );
      if (!claim || claim.updated === 0) {
        refused.push({ lot_id: id, title: lot.title, reason: 'It changed while you were reading it.' });
        continue;
      }
      liveCount += 1;
      released.push({ lot_id: id, title: lot.title, seller_user_id: lot.seller_user_id });
    }

    // A seller whose held lot the council has just released should hear it from us.
    for (const lot of released) {
      if (lot.seller_user_id && lot.seller_user_id !== user.id) {
        await notify(base44, {
          recipient_user_id: lot.seller_user_id,
          kind: 'order_update',
          title: `Now on the floor: ${lot.title}`,
          body: [
            'The council has looked at the stated grade and released this lot to the hall.',
            `Bidding is open and closes in ${runFor} hours.`,
          ].join('\n\n'),
          source_type: 'hall_lot',
          source_id: lot.lot_id,
          source_name: lot.title,
          actor_email: user.email,
          actor_role: fsisRole(user),
        });
      }
    }

    if (released.length > 0) {
      await svc.ops_log.create({
        action: 'hall.drafts_released',
        entity_type: 'hall_lot',
        entity_name: `${released.length} lot(s)`,
        actor: user.email,
        after: { released: released.length, refused: refused.length, closes_at: closesAt },
        notes: released.map((r) => r.title).join('; '),
      });
    }

    return Response.json({ ok: true, released: released.length, lots: released, refused, closes_at: closesAt });
  } catch (error) {
    await reportError(base44, { source: 'releaseHallDrafts', error, route: 'releaseHallDrafts' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
