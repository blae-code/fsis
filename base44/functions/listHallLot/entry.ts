import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole, isCouncil } from '../../shared/roles.js';
import { latestSignature, mayProceed } from '../../shared/instruments.js';
import {
  DEFAULT_COMMISSION_PERCENT, LIVE_STATES, liveLotAllowance, isLive, suspendsListing,
} from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { notify } from '../../shared/notices.js';

/** A lot runs for this long unless the seller says otherwise. */
const DEFAULT_HOURS = 48;
const MAX_HOURS = 24 * 14;

/**
 * A member puts a lot in the hall.
 *
 * Three things are checked before anything is listed, and each of them exists because of a specific
 * way this goes wrong:
 *
 *   - The seller has signed the CURRENT listing agreement. A lot listed under terms nobody can point
 *     to is a lot with no terms, and the commission is one of those terms.
 *   - The item is not already committed elsewhere. One item, one live commitment — selling the same
 *     wreck twice is not a bug in an auction house, it is fraud committed by accident.
 *   - The seller is not flooding the hall. A hall full of junk lots from one account costs every
 *     other seller their visibility.
 *
 * Anything drawn from a screenshot must be confirmed by the seller first. AI extraction is a draft
 * and never an authority.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'The hall is for members of the outfit. Patrons buy at the storefront.' }, { status: 403 });
    }
    if (user.standing_locked) {
      return Response.json({ error: 'You were released from the yard and may not list in the hall until an Owner reinstates you.' }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body?.title || '').trim();
    if (!title) return Response.json({ error: 'Say what you are selling.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;

    // 1. The listing agreement, as it stands today.
    const agreements = await svc.instrument.filter({ kind: 'listing_agreement', active: true }, '-effective_from', 1);
    const agreement = agreements[0] || null;
    let signatureId = '';
    if (agreement) {
      const signatures = await svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 100);
      const mine = latestSignature(signatures, user.id, agreement.id);
      const gate = mayProceed(mine, agreement);
      if (!gate.allowed) {
        return Response.json({
          error: gate.reason,
          instrument_id: agreement.id,
          instrument_version: agreement.version,
        }, { status: 409 });
      }
      signatureId = mine.id;
    }

    // 2. One item, one live commitment.
    const lootItemId = String(body?.loot_item_id || '').trim();
    if (lootItemId) {
      const existing = await svc.hall_lot.filter({ loot_item_id: lootItemId, status: { $in: LIVE_STATES } }, '-created_date', 5);
      if (existing.length > 0) {
        return Response.json({
          error: 'That item is already committed in the hall. One item, one live commitment — withdraw the other lot first.',
          lot_id: existing[0].id,
        }, { status: 409 });
      }
      const loot = await svc.loot_item.get(lootItemId).catch(() => null);
      if (loot?.linked_product_id) {
        return Response.json({
          error: 'That item is listed on the storefront. It cannot be in two places at once — take it off the shelf first.',
        }, { status: 409 });
      }
    }

    // 3. Nothing owed long enough to have suspended them. A rung on a stated ladder they have
    // already been told about twice — never a surprise at the moment of listing.
    const debts = await svc.hall_obligation.filter({ debtor_user_id: user.id }, '-due_at', 50);
    const suspending = debts.find((debt: any) => suspendsListing(debt));
    if (suspending) {
      return Response.json({
        error: `Listing is suspended while ${Number(suspending.amount_auec).toLocaleString()} aUEC is outstanding on "${suspending.lot_title}". Settle it, or tell the council why you cannot — it can be waived, and a debt somebody is talking about is not the problem this is for.`,
        obligation_id: suspending.id,
      }, { status: 409 });
    }

    // 4. Not flooding the hall.
    const allowance = liveLotAllowance(user);
    if (allowance === 0) {
      return Response.json({ error: 'Your standing is locked, so you may not list in the hall at present.' }, { status: 403 });
    }
    const mineLive = await svc.hall_lot.filter({ seller_user_id: user.id, status: { $in: LIVE_STATES } }, '-created_date', 50);
    if (mineLive.filter((lot: any) => isLive(lot.status)).length >= allowance) {
      return Response.json({
        error: `You have ${allowance} lots live already, which is the limit for now. Close or withdraw one to list another; the allowance rises as standing is earned.`,
      }, { status: 409 });
    }

    // Nothing drawn from an image reaches the hall unconfirmed.
    const fromImage = !!String(body?.evidence_image_url || '').trim();
    const confirmed = body?.extraction_confirmed === true;
    if (fromImage && !confirmed) {
      return Response.json({
        error: 'Check every field the extraction filled in and confirm it is right. What the reader saw is a draft, and the lot goes out under your name rather than its.',
      }, { status: 400 });
    }

    const hours = Number(body?.hours);
    const runFor = Number.isFinite(hours) && hours > 0 && hours <= MAX_HOURS ? Math.floor(hours) : DEFAULT_HOURS;
    const now = new Date();
    const closesAt = new Date(now.getTime() + runFor * 3600000);

    const start = roundAuec(body?.start_auec);
    const reserve = roundAuec(body?.reserve_auec);
    if (reserve > 0 && start > reserve) {
      return Response.json({ error: 'Bidding cannot open above your own reserve.' }, { status: 400 });
    }

    // A grade the hall cannot verify may be held for a look before it opens — held, not refused,
    // and the seller is told why.
    const heldForAppraisal = body?.request_appraisal === true;

    const lot = await svc.hall_lot.create({
      title,
      description: String(body?.description || '').trim(),
      seller_user_id: user.id,
      seller_handle: user.handle || user.full_name || user.email,
      item_type: String(body?.item_type || 'other').trim(),
      condition_grade: String(body?.condition_grade || '').trim(),
      condition_pct: Number(body?.condition_pct) || 0,
      quantity: Math.max(1, Math.floor(Number(body?.quantity) || 1)),
      manufacturer: String(body?.manufacturer || '').trim(),
      size_class: String(body?.size_class || '').trim(),
      loot_item_id: lootItemId,
      start_auec: start,
      reserve_auec: reserve,
      current_bid_auec: 0,
      bid_count: 0,
      opens_at: now.toISOString(),
      closes_at: closesAt.toISOString(),
      status: heldForAppraisal ? 'draft' : 'listed',
      watcher_user_ids: [],
      commission_percent: Number(body?.commission_percent) > 0
        ? Number(body.commission_percent)
        : DEFAULT_COMMISSION_PERCENT,
      listing_signature_id: signatureId,
      evidence_image_url: String(body?.evidence_image_url || '').trim(),
      extraction_confirmed: confirmed,
      held_for_appraisal: heldForAppraisal,
      relisted_from_lot_id: String(body?.relisted_from_lot_id || '').trim(),
      // The council can see reserves, so an interest of theirs is declared at the outset.
      council_interest: (isCouncil(user) || user.role === 'admin')
        ? `Listed by ${role}. The council can see reserves, so no council member may bid on this lot.`
        : '',
    });

    await svc.ops_log.create({
      action: 'hall.lot_listed',
      entity_type: 'hall_lot',
      entity_id: lot.id,
      entity_name: title,
      actor: user.email,
      after: { status: lot.status, closes_at: closesAt.toISOString(), commission_percent: lot.commission_percent },
      notes: heldForAppraisal ? 'Held for appraisal at the seller\'s request.' : 'Listed in the hall.',
    });

    if (heldForAppraisal) {
      await notify(base44, {
        recipient_user_id: user.id,
        recipient_handle: user.handle,
        kind: 'council_message',
        title: `Held for appraisal: ${title}`,
        body: [
          'Your lot is written up and waiting on the council to look at the stated grade before it opens.',
          'It is held, not refused. This is so a buyer can trust what a grade means in this hall, which is worth more to you as a seller than an hour saved.',
        ].join('\n\n'),
        source_type: 'hall_lot',
        source_id: lot.id,
        source_name: title,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      });
    }

    return Response.json({
      ok: true,
      lot,
      closes_at: closesAt.toISOString(),
      commission_percent: lot.commission_percent,
      lots_live: mineLive.length + 1,
      allowance,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
