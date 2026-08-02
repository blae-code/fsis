import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { latestSignature, signatureStatus } from '../../shared/instruments.js';
import { notify } from '../../shared/notices.js';

/**
 * A comrade withdraws from an agreement.
 *
 * A signature that cannot be taken back is not consent, so this needs no permission and carries no
 * penalty. Withdrawing is a right, not a fault: nothing is marked against standing, and the record
 * says plainly that they withdrew rather than implying they were removed.
 *
 * The signature itself is NOT deleted. The record of what was agreed, and when, and by whom, stands
 * — because things were done under it that still need explaining. Withdrawal ends the agreement
 * going forward; it does not pretend the past did not happen.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const instrumentId = String(body?.instrument_id || '').trim();
    const reason = String(body?.reason || '').trim();
    if (!instrumentId) return Response.json({ error: 'instrument_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const signatures = await svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 200);
    const mine = latestSignature(signatures, user.id, instrumentId);
    if (!mine) {
      return Response.json({ error: 'You have not signed those terms.' }, { status: 404 });
    }

    const status = signatureStatus(mine, { version: mine.accepted_version });
    if (status.state === 'withdrawn') {
      return Response.json({ error: 'You have already withdrawn from those terms.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updated = await svc.instrument_signature.update(mine.id, {
      withdrawn_at: now,
      // A reason is welcome and never required. Nobody must justify withdrawing consent.
      withdrawal_reason: reason,
    });

    await svc.ops_log.create({
      action: 'instrument.withdrawn',
      entity_type: 'instrument_signature',
      entity_id: mine.id,
      entity_name: mine.instrument_title || instrumentId,
      actor: user.email,
      before: { withdrawn_at: '' },
      after: { withdrawn_at: now },
      notes: reason || `${fsisRole(user)} withdrew consent. No reason required, and none given.`,
    });

    await notify(base44, {
      recipient_user_id: user.id,
      recipient_handle: user.handle,
      kind: 'council_message',
      title: `Withdrawn: ${mine.instrument_title || 'agreement'}`,
      body: [
        'You have withdrawn from these terms. They no longer bind you, and nothing has been marked against your standing — withdrawing consent is a right, not a fault.',
        'The record of what you signed, and when, is kept rather than deleted. Things may have been done under it that still need explaining, and erasing it would leave you unable to show what you had agreed to at the time.',
        'Anything already in hand under these terms should be finished or settled with the council. If you wish to sign again later, you can.',
      ].join('\n\n'),
      source_type: 'instrument',
      source_id: instrumentId,
      source_name: mine.instrument_title || '',
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    });

    return Response.json({ ok: true, signature: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
