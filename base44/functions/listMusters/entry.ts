import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fsisRole } from '../../shared/roles.js';

/**
 * Musters as a working comrade may see them.
 *
 * Operation records themselves are council-only, because planning carries internal notes,
 * pay reasoning and the standing of everyone who answered. A worker deciding whether to
 * give their time is owed the facts of the run and nothing less — the time, the hull, the
 * hands wanted, what it pays, and who else has spoken up — but not the council's private
 * workings nor another comrade's standing.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = fsisRole(user);
    if (role === 'patron') {
      return Response.json({ error: 'Only members of the outfit may read the muster board.' }, { status: 403 });
    }

    const ops = await base44.asServiceRole.entities.crew_operation.list('-starts_at', 100);
    const isCouncil = role === 'proprietor' || role === 'owner';

    const operations = ops.map((op) => ({
      id: op.id,
      created_date: op.created_date,
      op_name: op.op_name,
      brief: op.brief,
      op_type: op.op_type,
      starts_at: op.starts_at,
      duration_hours: op.duration_hours,
      muster_location: op.muster_location,
      ship: op.ship,
      crew_needed: op.crew_needed,
      roles_wanted: op.roles_wanted,
      pay_basis: op.pay_basis,
      flat_credit_auec: op.flat_credit_auec,
      status: op.status,
      // Own answer in full; everyone else reduced to a handle and a yes/maybe/no.
      rsvps: (op.rsvps || []).map((r) =>
        r.user_id === user.id || isCouncil
          ? r
          : { user_id: r.user_id, handle: r.handle, response: r.response },
      ),
    }));

    return Response.json({ operations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}