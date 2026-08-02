import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { roster, totalCosts, totalLosses } from '../../shared/sessions.js';
import { roundAuec } from '../../shared/money.js';

/**
 * The run, read whole: who stood it, what it produced, what it cost and what it lost.
 *
 * Readable by every hand who stood the run, not only the council. A comrade who gave four hours to a
 * run is owed the same account of it as the person who called it — what it made, what came off the
 * top, and how their own time turned into shares. A settlement nobody outside the council can read
 * is not transparency, it is a receipt.
 *
 * The suggested gross is a READING, not a decision. It adds up what has been attached to the run and
 * offers the figure; the council states the real gross at closeout, because what a lot actually sold
 * for is a fact about the market and not something this can know.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const sessionId = String(body?.session_id || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const session = await svc.operation_session.get(sessionId);
    if (!session) return Response.json({ error: 'No such run.' }, { status: 404 });

    // The council, or a comrade who actually stood this run.
    const stoodIt = (session.attendance_user_ids || []).includes(user.id);
    if (!stoodIt && !isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'That run is not yours to read.' }, { status: 403 });
    }

    const now = new Date();
    const [lots, loot, scans] = await Promise.all([
      svc.cargo_lot.filter({ operation_session_id: sessionId }, '-created_date', 200),
      svc.loot_item.filter({ operation_session_id: sessionId }, '-created_date', 200),
      svc.salvage_scan.filter({ operation_session_id: sessionId }, '-created_date', 200),
    ]);

    const lotValue = lots.reduce((total, lot) => total + (Number(lot.est_value_auec) || 0), 0);
    const lootValue = loot.reduce(
      (total, item) => total + (Number(item.actual_sell_auec) || Number(item.est_sell_auec) || 0), 0,
    );
    const costs = roundAuec(totalCosts(session.costs));
    const losses = roundAuec(totalLosses(session.losses));
    const suggestedGross = roundAuec(lotValue + lootValue);

    const hands = roster(session.attendance, now);

    return Response.json({
      session: {
        id: session.id,
        session_name: session.session_name,
        operation_id: session.operation_id || '',
        status: session.status,
        started_at: session.started_at,
        ended_at: session.ended_at || '',
        debrief: session.debrief || '',
      },
      roster: hands,
      total_minutes: hands.reduce((total, hand) => total + hand.minutes, 0),
      yield: {
        cargo_lots: lots.length,
        loot_items: loot.length,
        scans: scans.length,
        lot_value_auec: roundAuec(lotValue),
        loot_value_auec: roundAuec(lootValue),
        suggested_gross_auec: suggestedGross,
        basis: lots.length + loot.length === 0
          ? 'Nothing has been attached to this run yet, so there is nothing to add up. State the gross yourself at closeout.'
          : `Adds up ${lots.length} cargo lot(s) and ${loot.length} loot item(s) attached to this run. A reading of what was brought back, not what it sold for — state the real figure at closeout.`,
      },
      costs: { total_auec: costs, lines: session.costs || [] },
      losses: { total_auec: losses, lines: session.losses || [] },
      // Settled figures, present once the run is closed.
      settled: session.status === 'closed'
        ? {
          gross_auec: session.gross_auec || 0,
          costs_auec: session.costs_auec || 0,
          net_auec: session.net_auec || 0,
          payouts: session.payouts || [],
          no_shows: session.no_shows || [],
          closed_at: session.closed_at,
          // Money that changes hands directly and has not yet been confirmed as landed. A member's
          // shares are not counted here: they settle at pay day and are nobody's to hand over.
          outstanding_payouts: (session.payouts || [])
            .filter((p: any) => !p.settles_at_payday && !p.paid).length,
        }
        : null,
      // Clusters, so a field is worked once rather than rediscovered.
      clusters: scans
        .filter((scan) => scan.cluster_name)
        .map((scan) => ({
          scan_id: scan.id,
          cluster_name: scan.cluster_name,
          worked_by_handle: scan.worked_by_handle || '',
          stripped: !!scan.stripped,
        })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
