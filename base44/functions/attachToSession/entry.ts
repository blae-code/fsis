import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil, fsisRole } from '../../shared/roles.js';

/**
 * What a run produced, tied to the run that produced it.
 *
 * Scans, lots and loot have floated free of the operations that won them, so there has never been a
 * per-run yield and never an honest answer to "was that worth flying". Without it a muster is judged
 * on how it felt, which is how the runs that pay well quietly stop being called.
 *
 * Attaching is reversible and attaches nothing to a settled run: once a run is closed its yield is
 * part of a settlement people have already been paid against, and moving it afterwards would change
 * a figure a comrade has already read.
 */
const ATTACHABLE: Record<string, string> = {
  salvage_scan: 'salvage_scan',
  loot_item: 'loot_item',
  cargo_lot: 'cargo_lot',
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    const recordType = String(body?.record_type || '').trim();
    const rawIds = Array.isArray(body?.record_ids) ? body.record_ids : [];
    const detach = body?.detach === true;

    if (!ATTACHABLE[recordType]) {
      return Response.json(
        { error: `record_type must be one of: ${Object.keys(ATTACHABLE).join(', ')}.` },
        { status: 400 },
      );
    }
    const recordIds: string[] = [...new Set(rawIds.map((id: unknown) => String(id || '').trim()).filter(Boolean))] as string[];
    if (recordIds.length === 0) return Response.json({ error: 'record_ids is required.' }, { status: 400 });
    if (recordIds.length > 100) {
      return Response.json({ error: 'Attach 100 records or fewer at a time.' }, { status: 400 });
    }
    if (!detach && !sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });

    let session = null;
    if (sessionId) {
      session = await base44.asServiceRole.entities.operation_session.get(sessionId);
      if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });
      if (session.status !== 'underway') {
        return Response.json(
          { error: 'That run is settled. Its yield is part of a settlement hands have already been paid against.' },
          { status: 409 },
        );
      }
    }

    // One write for the lot of them.
    const entity = base44.asServiceRole.entities[ATTACHABLE[recordType]];
    await entity.bulkUpdate(recordIds.map((id) => ({
      id,
      operation_session_id: detach ? '' : sessionId,
    })));

    await base44.asServiceRole.entities.ops_log.create({
      action: detach ? 'operation.yield_detached' : 'operation.yield_attached',
      entity_type: 'operation_session',
      entity_id: sessionId,
      entity_name: session?.session_name || '',
      actor: user.email,
      after: { record_type: recordType, count: recordIds.length },
      notes: `${detach ? 'Detached' : 'Attached'} ${recordIds.length} ${recordType} record(s) by ${fsisRole(user)}.`,
    });

    return Response.json({ ok: true, attached: detach ? 0 : recordIds.length, detached: detach ? recordIds.length : 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
