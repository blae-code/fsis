import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';
import { INSTRUMENT_KINDS, currentVersion, latestSignature } from '../../shared/instruments.js';
import { notifyMany } from '../../shared/notices.js';

/**
 * The council publishes terms, or new terms.
 *
 * Publishing a new version does NOT bind anybody who signed an older one. Every existing signatory
 * is told what changed, in plain words, and asked to agree again — and until they do they stand on
 * the version they actually signed. Changing terms under people who are not looking is the single
 * worst thing a document system can do, and it is exactly what versioning makes easy, so it is
 * refused here rather than merely discouraged.
 *
 * A summary of what changed is required for a new version. Asking somebody to re-read a whole
 * document to find one altered clause is a way of hoping they will not bother.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to publish terms.' }, { status: 403 });
    }

    const body = await req.json();
    const instrumentId = String(body?.instrument_id || '').trim();
    const title = String(body?.title || '').trim();
    const text = String(body?.body || '').trim();
    const kind = String(body?.kind || 'other').trim();
    const summaryOfChanges = String(body?.summary_of_changes || '').trim();

    if (!INSTRUMENT_KINDS.includes(kind)) {
      return Response.json({ error: `kind must be one of: ${INSTRUMENT_KINDS.join(', ')}.` }, { status: 400 });
    }
    if (!text) return Response.json({ error: 'The terms cannot be empty.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const now = new Date().toISOString();
    const appliesTo = Array.isArray(body?.applies_to_standing) ? body.applies_to_standing : [];

    // Fresh terms.
    if (!instrumentId) {
      if (!title) return Response.json({ error: 'Give the agreement a title.' }, { status: 400 });
      const created = await svc.instrument.create({
        kind,
        title,
        version: 1,
        body: text,
        applies_to_standing: appliesTo,
        counter_signs_automatically: body?.counter_signs_automatically !== false,
        active: true,
        effective_from: now,
        published_by_email: user.email,
      });

      await svc.ops_log.create({
        action: 'instrument.published',
        entity_type: 'instrument',
        entity_id: created.id,
        entity_name: title,
        actor: user.email,
        after: { version: 1, kind },
        notes: `New terms published by ${fsisRole(user)}.`,
      });
      return Response.json({ ok: true, instrument: created, version: 1, reconsent_asked_of: 0 });
    }

    // New version of existing terms.
    const instrument = await svc.instrument.get(instrumentId);
    if (!instrument) return Response.json({ error: 'No such agreement.' }, { status: 404 });
    if (!summaryOfChanges) {
      return Response.json({
        error: 'Say what changed, in plain words. Asking comrades to re-read a whole document to find one altered clause is a way of hoping they will not.',
      }, { status: 400 });
    }

    const nextVersion = currentVersion(instrument) + 1;
    const updated = await svc.instrument.update(instrumentId, {
      ...(title ? { title } : {}),
      kind,
      version: nextVersion,
      body: text,
      summary_of_changes: summaryOfChanges,
      ...(appliesTo.length > 0 ? { applies_to_standing: appliesTo } : {}),
      effective_from: now,
      published_by_email: user.email,
    });

    // Everyone standing on an older version is told what changed and asked to agree again. Their
    // old signature stands until they do — it is not void, it simply does not reach the new terms.
    const signatures = await svc.instrument_signature.filter({ instrument_id: instrumentId }, '-signed_at', 500);
    const signatories = [...new Set(signatures.map((s: any) => s.signatory_user_id).filter(Boolean))];
    const needReconsent = signatories
      .map((userId: string) => latestSignature(signatures, userId, instrumentId))
      .filter((s: any) => s && !s.withdrawn_at && Number(s.accepted_version) < nextVersion);

    await notifyMany(base44, needReconsent.map((signature: any) => ({
      recipient_user_id: signature.signatory_user_id,
      recipient_handle: signature.signatory_handle,
      kind: 'council_message',
      title: `Terms changed: ${updated.title}`,
      body: [
        `${updated.title} has moved to version ${nextVersion}. You signed version ${signature.accepted_version}.`,
        `What changed: ${summaryOfChanges}`,
        'You are NOT bound by the new terms. Your signature stands on the version you actually read, and anything already in hand carries on under it.',
        'Read what changed and sign again when you are ready. If you would rather not, you may withdraw instead — nothing is held against you either way.',
      ].join('\n\n'),
      source_type: 'instrument',
      source_id: instrumentId,
      source_name: updated.title,
      actor_email: user.email,
      actor_role: fsisRole(user),
    })));

    await svc.ops_log.create({
      action: 'instrument.version_published',
      entity_type: 'instrument',
      entity_id: instrumentId,
      entity_name: updated.title,
      actor: user.email,
      before: { version: currentVersion(instrument) },
      after: { version: nextVersion, reconsent_asked_of: needReconsent.length },
      notes: summaryOfChanges,
    });

    return Response.json({
      ok: true,
      instrument: updated,
      version: nextVersion,
      reconsent_asked_of: needReconsent.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
