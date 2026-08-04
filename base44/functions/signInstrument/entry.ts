import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { currentVersion, latestSignature, signatureStatus } from '../../shared/instruments.js';
import { notify } from '../../shared/notices.js';
import { callsignFor } from '../../shared/callsigns.js';

/**
 * A comrade puts their name to the terms.
 *
 * The version and the wording are recorded AS THEY STOOD, verbatim, because a signature against a
 * document that can later be edited is not a record of anything. Whatever the hall publishes next,
 * this comrade can always read exactly what they agreed to.
 *
 * FSIS countersigns. Where the hall has published standing terms openly, publishing them is itself
 * the offer and the countersignature lands at the same moment; a bespoke agreement waits for an
 * Owner to put their name to it. Either way, an agreement only one side is bound by is not an
 * agreement — it is a condition of entry, and this is not that kind of outfit.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const instrumentId = String(body?.instrument_id || '').trim();
    const acceptedVersion = Number(body?.accepted_version);
    if (!instrumentId) return Response.json({ error: 'instrument_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const instrument = await svc.instrument.get(instrumentId);
    if (!instrument) return Response.json({ error: 'No such agreement.' }, { status: 404 });
    if (instrument.active === false) {
      return Response.json({ error: 'Those terms have been retired and are no longer asked of anyone.' }, { status: 409 });
    }

    const version = currentVersion(instrument);

    // The version signed must be the version read. If the terms moved while it was open in front of
    // them, they are sent back to read the new ones rather than bound to words they never saw.
    if (Number.isFinite(acceptedVersion) && acceptedVersion !== version) {
      return Response.json({
        error: `These terms changed while you were reading them — the hall is now on version ${version}. Read what changed and sign again; nothing binds you in the meantime.`,
        current_version: version,
      }, { status: 409 });
    }

    const standing = fsisRole(user);
    const appliesTo = instrument.applies_to_standing || [];
    if (appliesTo.length > 0 && !appliesTo.includes(standing)) {
      return Response.json({ error: 'These terms are not asked of your standing.' }, { status: 409 });
    }

    const signatures = await svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 200);
    const existing = latestSignature(signatures, user.id, instrumentId);
    const status = signatureStatus(existing, instrument);
    if (status.covers_current) {
      return Response.json({ error: 'You have already signed these terms.', accepted_version: version }, { status: 409 });
    }

    const now = new Date().toISOString();
    const autoCounter = instrument.counter_signs_automatically !== false;

    const signature = await svc.instrument_signature.create({
      instrument_id: instrumentId,
      instrument_title: instrument.title,
      instrument_kind: instrument.kind,
      accepted_version: version,
      // Verbatim. The document may move on; this cannot.
      accepted_body: instrument.body || '',
      signatory_user_id: user.id,
      signatory_handle: callsignFor(user),
      signatory_email: user.email,
      signatory_standing: standing,
      signed_at: now,
      ...(autoCounter ? { countersigned_at: now, countersigned_by_email: 'FSIS' } : {}),
    });

    await svc.ops_log.create({
      action: 'instrument.signed',
      entity_type: 'instrument_signature',
      entity_id: signature.id,
      entity_name: instrument.title,
      actor: user.email,
      after: { instrument_id: instrumentId, version, countersigned: autoCounter },
      notes: `${standing} signed version ${version}${status.state === 'superseded' ? ` (re-consent from version ${status.accepted_version})` : ''}.`,
    });

    await notify(base44, {
      recipient_user_id: user.id,
      recipient_handle: callsignFor(user),
      kind: 'council_message',
      title: `Signed: ${instrument.title}`,
      body: [
        `You have signed version ${version} of ${instrument.title}.`,
        autoCounter
          ? 'FSIS is bound by it too — these are terms the hall published openly, so the offer and the countersignature are the same act.'
          : 'An Owner will countersign. Until they do, the hall is not yet bound by it, and you will be told when they are.',
        'The wording you agreed to is kept exactly as it stood. If the hall changes these terms later you will be asked to read what changed and agree again — a new version never binds you on the strength of an old signature.',
        'You may withdraw from this at any time.',
      ].join('\n\n'),
      source_type: 'instrument',
      source_id: instrumentId,
      source_name: instrument.title,
      actor_email: 'FSIS.bot',
      actor_role: 'system',
    });

    return Response.json({ ok: true, signature, countersigned: autoCounter, accepted_version: version });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
