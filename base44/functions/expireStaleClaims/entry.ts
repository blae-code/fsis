import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Work claimed but never filed cannot sit in one comrade's hands forever while the yard waits.
 * Past the due date plus a stated grace period, the task returns to the board openly — with the
 * lapse written into its notes. No standing is taken for this: silence may mean anything, and a
 * mark is only ever assessed where a comrade has stated their own reason for walking away.
 */
const GRACE_DAYS = 7;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;
    const now = new Date();
    const cutoff = new Date(now.getTime() - GRACE_DAYS * 86400000).toISOString().slice(0, 10);

    const held = await svc.labour_task.filter({ status: 'claimed' }, 'due_date', 200);
    const stale = held.filter((t) => t.due_date && t.due_date <= cutoff);

    if (stale.length === 0) {
      return Response.json({ ok: true, returned_to_board: 0, grace_days: GRACE_DAYS });
    }

    await svc.labour_task.bulkUpdate(stale.map((t) => ({
      id: t.id,
      status: 'posted',
      assigned_user_id: null,
      assigned_email: null,
      assigned_handle: null,
      claimed_at: null,
      notes: [
        t.notes,
        `Claim lapsed ${now.toISOString().slice(0, 10)}: held by ${t.assigned_handle || t.assigned_email || 'a comrade'} and unfiled ${GRACE_DAYS} days past the due date. Returned to the board.`,
      ].filter(Boolean).join('\n'),
    })));

    await svc.ops_log.create({
      action: 'labour_task.claims_lapsed',
      entity_type: 'labour_task',
      entity_name: `${stale.length} task(s)`,
      actor: 'FSIS.bot',
      after: { returned_to_board: stale.length },
      notes: stale.map((t) => `${t.title} — ${t.assigned_handle || t.assigned_email || 'unknown'}`).join('; '),
    });

    return Response.json({ ok: true, returned_to_board: stale.length, grace_days: GRACE_DAYS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}