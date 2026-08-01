import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { roundAuec, roundShares, sumAuec } from '../../shared/money.js';

/**
 * What a thing actually cost in labour.
 *
 * A cargo lot has a price, and until now the labour inside it was a guess — the hours somebody
 * remembered, or nothing at all. Every task now names what it served, so the cost can be stated:
 * these hands, these hours, this much settled, and the work still outstanding named too.
 *
 * This is not an efficiency measure and must never be read as one. It exists so the collective can
 * say plainly where value came from, and so a lot is never priced as though it made itself.
 */
const SERVES_TYPES = ['order', 'cargo_lot', 'operation', 'fab_project', 'work_order'];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to read labour costs.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const servesType = String(body?.serves_type || '').trim();
    const servesId = String(body?.serves_id || '').trim();
    if (!SERVES_TYPES.includes(servesType)) {
      return Response.json({ error: `serves_type must be one of: ${SERVES_TYPES.join(', ')}.` }, { status: 400 });
    }
    if (!servesId) return Response.json({ error: 'serves_id is required.' }, { status: 400 });

    const tasks = await base44.asServiceRole.entities.labour_task.filter(
      { serves_type: servesType, serves_id: servesId }, '-created_date', 500,
    );

    const credited = tasks.filter((t) => t.status === 'credited');
    const outstanding = tasks.filter((t) => !['credited', 'cancelled'].includes(t.status));

    // Only labour actually credited has been paid for; work still in hand is named separately
    // rather than folded in, so nobody reads a half-finished job as a settled cost.
    const settledAuec = sumAuec(credited.map((t) => t.credited_auec));
    const committedAuec = sumAuec(outstanding.map((t) => t.agreed_credit_auec));
    const hoursWorked = roundShares(credited.reduce((total, t) => total + (Number(t.actual_hours) || 0), 0));
    const hoursEstimated = roundShares(tasks.reduce((total, t) => total + (Number(t.estimated_hours) || 0), 0));

    const hands = [...new Map(
      credited
        .filter((t) => t.assigned_user_id)
        .map((t) => [t.assigned_user_id, { user_id: t.assigned_user_id, handle: t.assigned_handle || '' }]),
    ).values()];

    return Response.json({
      serves_type: servesType,
      serves_id: servesId,
      serves_name: tasks[0]?.serves_name || '',
      settled_auec: settledAuec,
      committed_auec: committedAuec,
      total_auec: roundAuec(settledAuec + committedAuec),
      hours_worked: hoursWorked,
      hours_estimated: hoursEstimated,
      hands,
      task_count: tasks.length,
      credited_count: credited.length,
      outstanding_count: outstanding.length,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        assigned_handle: t.assigned_handle || '',
        agreed_credit_auec: t.agreed_credit_auec || 0,
        credited_auec: t.credited_auec || 0,
        estimated_hours: t.estimated_hours ?? null,
        actual_hours: t.actual_hours ?? null,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
