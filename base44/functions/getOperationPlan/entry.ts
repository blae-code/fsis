import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { actualHaul, haulAccuracy, haulPlan } from '../../shared/logistics.js';
import { roleSlots, slotState } from '../../shared/musters.js';
import { roundAuec } from '../../shared/money.js';

/**
 * The run, planned before it is called.
 *
 * An Owner calls a muster, six hands turn up, and somewhere over the belt it becomes clear the run
 * needed two trips nobody planned for — so the last of it is left behind, or a comrade flies a second
 * sortie on their own time. Both outcomes fall on the crew rather than on whoever did the planning.
 *
 * Where a run has already flown, the expectation is set beside what actually came back. That reading
 * exists to make the NEXT estimate better and for nothing else: a run that came back light was
 * usually a run where the field was thin, and treating that as a failing teaches the yard to promise
 * less rather than plan better.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required to read the plan.' }, { status: 403 });
    }

    const body = await req.json();
    const opId = String(body?.operation_id || '').trim();
    if (!opId) return Response.json({ error: 'operation_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const operation = await svc.crew_operation.get(opId);
    if (!operation) return Response.json({ error: 'Operation not found.' }, { status: 404 });

    // A linked freight plan is the authority on capacity — it is stated there already, and typing a
    // hull size twice is how the two come to disagree.
    const plan = operation.freight_plan_id
      ? await svc.freight_plan.get(operation.freight_plan_id).catch(() => null)
      : null;
    const capacity = Number(plan?.capacity_scu) > 0
      ? Number(plan.capacity_scu)
      : Number(operation.hull_capacity_scu) || 0;

    const expected = Number(operation.expected_haul_scu) || 0;
    const haul = haulPlan({ expected_haul_scu: expected, hull_capacity_scu: capacity });

    // What has actually come back, through the runs flown against this muster.
    const sessions = await svc.operation_session.filter({ operation_id: opId }, '-started_at', 20);
    const sessionIds = sessions.map((s: any) => s.id).filter(Boolean);
    const lots = sessionIds.length > 0
      ? await svc.cargo_lot.filter({ operation_session_id: { $in: sessionIds } }, '-created_date', 200)
      : [];

    const brought = actualHaul(lots);
    const flown = sessions.some((s: any) => s.status === 'closed');

    return Response.json({
      operation_id: opId,
      op_name: operation.op_name,
      starts_at: operation.starts_at,
      status: operation.status,
      hands: slotState(operation, operation.rsvps),
      places_wanted: roleSlots(operation).reduce((total: number, slot: any) => total + slot.wanted, 0),
      freight_plan: plan
        ? {
          id: plan.id,
          plan_name: plan.plan_name,
          ship_name: plan.ship_name,
          capacity_scu: plan.capacity_scu,
          origin: plan.origin,
          destinations: plan.destinations || [],
          risk_level: plan.risk_level,
        }
        : null,
      capacity_source: plan?.capacity_scu > 0 ? 'freight_plan' : (capacity > 0 ? 'operation' : 'unstated'),
      haul,
      // Only once something has actually flown — before that there is nothing to compare.
      against_the_run: flown
        ? {
          ...haulAccuracy(expected, brought),
          cargo_lots: lots.length,
          value_auec: roundAuec(lots.reduce((total: number, lot: any) => total + (Number(lot.est_value_auec) || 0), 0)),
          sessions: sessions.length,
        }
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
