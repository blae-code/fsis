import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { latestSignature, mayProceed } from '../../shared/instruments.js';
import { DEFAULT_COMMISSION_PERCENT, LIVE_STATES, liveLotAllowance, suspendsListing } from '../../shared/hall.js';
import { roundAuec } from '../../shared/money.js';
import { callsignFor } from '../../shared/callsigns.js';

/** A hold full of loot, but not an unbounded one. */
const MAX_BATCH = 50;

/**
 * A seller with a hold full of gear writes it up in one go.
 *
 * Everything arrives as a DRAFT and nothing goes live. That is the whole design: bulk entry is
 * where a wrong grade or a mistyped reserve gets past somebody, because the attention that goes into
 * one careful listing does not survive being asked for forty times. So the batch is written up,
 * checked as a batch, and released deliberately.
 *
 * Rows are validated individually and reported individually. A batch of forty where three lines are
 * wrong should not throw away the thirty-seven that were right, and should say exactly which three.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'The hall is for members of the outfit.' }, { status: 403 });
    }
    if (user.standing_locked) {
      return Response.json({ error: 'You were released from the yard and may not list in the hall.' }, { status: 403 });
    }

    const body = await req.json();
    const rows = Array.isArray(body?.lots) ? body.lots : [];
    if (rows.length === 0) return Response.json({ error: 'Nothing to write up.' }, { status: 400 });
    if (rows.length > MAX_BATCH) {
      return Response.json({ error: `Write up ${MAX_BATCH} lots or fewer at a time.` }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;

    // The listing agreement, once for the batch.
    const agreements = await svc.instrument.filter({ kind: 'listing_agreement', active: true }, '-effective_from', 1);
    const agreement = agreements[0] || null;
    let signatureId = '';
    if (agreement) {
      const signatures = await svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 100);
      const mine = latestSignature(signatures, user.id, agreement.id);
      const gate = mayProceed(mine, agreement);
      if (!gate.allowed) {
        return Response.json({ error: gate.reason, instrument_id: agreement.id }, { status: 409 });
      }
      signatureId = mine.id;
    }

    const debts = await svc.hall_obligation.filter({ debtor_user_id: user.id }, '-due_at', 50);
    if (debts.find((debt: any) => suspendsListing(debt))) {
      return Response.json({ error: 'Listing is suspended while a commission is outstanding.' }, { status: 409 });
    }

    // Drafts do not count against the live allowance, but the batch cannot exceed what could ever
    // go live — writing up forty when three may be listed just moves the disappointment later.
    const allowance = liveLotAllowance(user);
    if (allowance === 0) {
      return Response.json({ error: 'Your standing is locked, so you may not list in the hall at present.' }, { status: 403 });
    }

    const committed = new Set<string>();
    const accepted: any[] = [];
    const rejected: any[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      const title = String(row.title || '').trim();
      const lootItemId = String(row.loot_item_id || '').trim();
      const start = roundAuec(row.start_auec);
      const reserve = roundAuec(row.reserve_auec);

      if (!title) { rejected.push({ line: i + 1, reason: 'No title — say what it is.' }); continue; }
      if (reserve > 0 && start > reserve) {
        rejected.push({ line: i + 1, title, reason: 'Bidding opens above the reserve.' }); continue;
      }
      // The same item twice inside one batch is the easiest mistake to make here.
      if (lootItemId && committed.has(lootItemId)) {
        rejected.push({ line: i + 1, title, reason: 'That item appears twice in this batch — one item, one live commitment.' });
        continue;
      }
      if (lootItemId) {
        const live = await svc.hall_lot.filter({ loot_item_id: lootItemId, status: { $in: LIVE_STATES } }, '-created_date', 3);
        if (live.length > 0) {
          rejected.push({ line: i + 1, title, reason: 'That item is already committed in the hall.' });
          continue;
        }
        committed.add(lootItemId);
      }

      accepted.push({
        title,
        description: String(row.description || '').trim(),
        seller_user_id: user.id,
        seller_handle: callsignFor(user),
        item_type: String(row.item_type || 'other').trim(),
        condition_grade: String(row.condition_grade || '').trim(),
        condition_pct: Number(row.condition_pct) || 0,
        quantity: Math.max(1, Math.floor(Number(row.quantity) || 1)),
        manufacturer: String(row.manufacturer || '').trim(),
        size_class: String(row.size_class || '').trim(),
        loot_item_id: lootItemId,
        start_auec: start,
        reserve_auec: reserve,
        current_bid_auec: 0,
        bid_count: 0,
        // Draft, always. Nothing written in bulk goes live without being looked at.
        status: 'draft',
        watcher_user_ids: [],
        commission_percent: DEFAULT_COMMISSION_PERCENT,
        listing_signature_id: signatureId,
        evidence_image_url: String(row.evidence_image_url || '').trim(),
        extraction_confirmed: row.extraction_confirmed === true,
      });
    }

    const created = accepted.length > 0 ? await svc.hall_lot.bulkCreate(accepted) : [];

    await svc.ops_log.create({
      action: 'hall.bulk_drafted',
      entity_type: 'hall_lot',
      entity_name: `${accepted.length} draft lot(s)`,
      actor: user.email,
      after: { drafted: accepted.length, rejected: rejected.length },
      notes: rejected.length > 0
        ? `Rejected lines: ${rejected.map((r) => `${r.line} (${r.reason})`).join('; ')}`
        : 'All lines accepted as drafts.',
    });

    return Response.json({
      ok: true,
      drafted: created.length,
      rejected,
      allowance,
      note: [
        `${created.length} written up as drafts. Nothing is live yet.`,
        'Check each one — bulk entry is where a wrong grade or a mistyped reserve gets past somebody, because the care that goes into one listing does not survive being asked for forty times.',
        rejected.length > 0 ? `${rejected.length} line(s) were not written up; each says why.` : '',
      ].filter(Boolean).join(' '),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
