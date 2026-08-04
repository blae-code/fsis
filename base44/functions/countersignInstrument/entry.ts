import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { notify } from '../../shared/notices.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * An Owner puts the collective's name to a bespoke agreement.
 *
 * Another promise the code could not keep. Where an instrument is marked
 * `counter_signs_automatically: false`, `signInstrument` tells the comrade: "An Owner will
 * countersign. Until they do, the hall is not yet bound by it, and you will be told when they are."
 * Nothing could countersign. So a bespoke agreement stayed signed by ONE side indefinitely — which
 * shared/instruments.js says plainly is not an agreement at all but a condition of entry.
 *
 * Standing terms the hall publishes openly countersign themselves at the moment of signing, because
 * publishing them IS the offer. This is only for the bespoke ones.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Owner standing or above is required to bind the collective.' }, { status: 403 });
    }

    const body = await req.json();
    const signatureId = String(body?.signature_id || '').trim();
    if (!signatureId) return Response.json({ error: 'signature_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const signature = await svc.instrument_signature.get(signatureId);
    if (!signature) return Response.json({ error: 'No such signature.' }, { status: 404 });
    if (signature.withdrawn_at) {
      return Response.json({
        error: 'That comrade has withdrawn from these terms. There is nothing left to bind, and countersigning a withdrawn signature would be binding somebody who left.',
      }, { status: 409 });
    }
    if (signature.countersigned_at) {
      return Response.json({ error: 'Already countersigned.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updated = await svc.instrument_signature.update(signatureId, {
      countersigned_at: now,
      countersigned_by_email: user.email,
    });

    await notify(base44, {
      recipient_user_id: signature.signatory_user_id,
      recipient_handle: signature.signatory_handle,
      kind: 'council_message',
      title: `Countersigned: ${signature.instrument_title}`,
      body: [
        `FSIS has put its own name to version ${signature.accepted_version} of ${signature.instrument_title}. It binds the collective now, as it already bound you.`,
        'You were told this was owed to you when you signed, and it is now done. An agreement only one side is bound by is a condition of entry rather than an agreement, and that is not what this is.',
        'You may still withdraw at any time.',
      ].join('\n\n'),
      source_type: 'instrument',
      source_id: signature.instrument_id,
      source_name: signature.instrument_title,
      actor_email: user.email,
      actor_role: fsisRole(user),
    });

    await svc.ops_log.create({
      action: 'instrument.countersigned',
      entity_type: 'instrument_signature',
      entity_id: signatureId,
      entity_name: signature.instrument_title,
      actor: user.email,
      after: { signatory: signature.signatory_handle, version: signature.accepted_version },
      notes: `Countersigned by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, signature: updated });
  } catch (error) {
    await reportError(base44, { source: 'countersignInstrument', error, route: 'countersignInstrument' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
