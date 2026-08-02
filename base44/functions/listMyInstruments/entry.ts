import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';
import { mayProceed, signatureSummary, latestSignature, currentVersion } from '../../shared/instruments.js';

/**
 * One place a comrade reads every instrument they have ever signed.
 *
 * Including the ones they withdrew from and the ones since superseded, with the wording they
 * actually agreed to rather than whatever the document says now. A term nobody can find again is a
 * term that was never really agreed, and an agreement you cannot re-read is one you are expected to
 * take on trust — which is the opposite of what signing something is for.
 *
 * Also lists what is outstanding: terms asked of their standing that they have not signed, and terms
 * that have moved since they did.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole.entities;
    const standing = fsisRole(user);

    const [instruments, signatures] = await Promise.all([
      svc.instrument.list('-effective_from', 200),
      svc.instrument_signature.filter({ signatory_user_id: user.id }, '-signed_at', 200),
    ]);
    const byId = new Map(instruments.map((i: any) => [i.id, i]));

    // Everything they have ever put their name to, newest first — nothing hidden because it was
    // later withdrawn or superseded.
    const signed = signatures.map((signature: any) => ({
      signature_id: signature.id,
      ...signatureSummary(signature, byId.get(signature.instrument_id)),
      // The wording as it stood when they signed, not as it reads now.
      accepted_body: signature.accepted_body || '',
    }));

    // What is still asked of them.
    const asked = instruments
      .filter((instrument: any) => instrument.active !== false)
      .filter((instrument: any) => {
        const appliesTo = instrument.applies_to_standing || [];
        return appliesTo.length === 0 || appliesTo.includes(standing);
      })
      .map((instrument: any) => {
        const mine = latestSignature(signatures, user.id, instrument.id);
        const gate = mayProceed(mine, instrument);
        return {
          instrument_id: instrument.id,
          kind: instrument.kind,
          title: instrument.title,
          version: currentVersion(instrument),
          summary_of_changes: instrument.summary_of_changes || '',
          body: instrument.body || '',
          settled: gate.allowed,
          // Written for the comrade to read, not as an error string.
          what_is_needed: gate.allowed ? '' : gate.reason,
        };
      });

    return Response.json({
      standing,
      signed,
      asked,
      outstanding: asked.filter((a: any) => !a.settled).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
