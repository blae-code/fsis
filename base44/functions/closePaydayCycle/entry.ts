import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Closes pay day cycles whose 72-hour window has elapsed (hourly FSIS.bot check),
// or immediately when management force-closes. Publishes the final transparency
// report, pays cash-in elections, and rolls deferred / unanswered shares forward.
// Ethical defaults: no response = defer (shares are NEVER forfeited); unclaimed
// pool stays in the business treasury for future pay days.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    const payload = await req.json().catch(() => ({}));
    const force = payload.force === true;

    if (force && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Only management can force-close a cycle' }, { status: 403 });
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Management access required' }, { status: 403 });
    }

    const openCycles = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'open' });
    const now = new Date();
    const results = [];

    for (const cycle of openCycles) {
      const due = new Date(cycle.closes_at) <= now;
      const targeted = force && (!payload.cycle_id || payload.cycle_id === cycle.id);
      if (!due && !targeted) continue;

      const pool = cycle.pool_auec || 0;
      const totalShares = cycle.total_shares || 0;
      const shareValue = totalShares > 0 ? pool / totalShares : 0;

      // Elections made during the window
      const elections = await base44.asServiceRole.entities.payday_election.filter({ cycle_id: cycle.id });
      const decisionByHandle = {};
      for (const e of elections) decisionByHandle[e.handle] = e.decision;

      const report = [];
      let totalPaid = 0;
      let deferredShares = 0;

      for (const snap of cycle.shares_by_handle || []) {
        const decision = decisionByHandle[snap.handle] || 'defer';
        if (decision === 'cash_in' && shareValue > 0) {
          // Cash out ALL currently confirmed logs (incl. any earned mid-window — pro-labor)
          const logs = await base44.asServiceRole.entities.time_log.filter({ handle: snap.handle, status: 'confirmed' });
          const actualShares = logs.reduce((t, l) => t + (l.shares || 0), 0);
          const payout = Math.round(actualShares * shareValue);

          const isOwner = snap.handle.toLowerCase() === 'blae';
          await base44.asServiceRole.entities.ledger_entry.create({
            entry_type: 'expense',
            category: 'crew_pay',
            amount_auec: payout,
            counterparty: isOwner ? `${snap.handle} (owner draw — personal)` : snap.handle,
            description: `Pay day ${cycle.payday_date} — ${Math.round(actualShares * 100) / 100} shares @ ${Math.round(shareValue).toLocaleString()} aUEC/share (cycle ${cycle.id})`,
            entry_date: now.toISOString().slice(0, 10),
            source: 'automation',
          });
          for (const l of logs) {
            await base44.asServiceRole.entities.time_log.update(l.id, {
              status: 'cashed',
              payday_date: cycle.payday_date,
              payout_auec: Math.round((l.shares || 0) * shareValue),
            });
          }
          totalPaid += payout;
          report.push({ handle: snap.handle, shares: Math.round(actualShares * 100) / 100, decision: 'cash_in', payout_auec: payout });
        } else {
          deferredShares += snap.shares || 0;
          report.push({
            handle: snap.handle,
            shares: snap.shares || 0,
            decision: decisionByHandle[snap.handle] === 'defer' ? 'defer' : 'no_response_defer',
            payout_auec: 0,
          });
        }
      }

      await base44.asServiceRole.entities.payday_cycle.update(cycle.id, {
        status: 'published',
        published_at: now.toISOString(),
        share_value_auec: Math.round(shareValue * 100) / 100,
        report,
        total_paid_auec: totalPaid,
        deferred_shares: Math.round(deferredShares * 100) / 100,
        force_closed: targeted && !due,
      });

      // Publish the transparency report to every linked crew member
      const crew = await base44.asServiceRole.entities.crew_member.filter({ active: true }, '-created_date', 200);
      const reportLines = report.map((r) =>
        `  ${r.handle}: ${r.shares} shares — ${r.decision === 'cash_in' ? `CASHED IN → ${r.payout_auec.toLocaleString()} aUEC` : 'DEFERRED (rolls over in full)'}`
      );
      const body = [
        `FSIS FINAL PAY DAY REPORT — ${cycle.payday_date}`,
        ``,
        `Distributable pool: ${pool.toLocaleString()} aUEC (${cycle.pool_source || 'declared'})`,
        `Total shares at open: ${totalShares}`,
        `Share value: ${Math.round(shareValue).toLocaleString()} aUEC/share — identical rate for every crew member`,
        ``,
        `SPLITS:`,
        ...reportLines,
        ``,
        `Total paid out: ${totalPaid.toLocaleString()} aUEC`,
        `Shares deferred to next cycle: ${Math.round(deferredShares * 100) / 100} (never forfeited)`,
        `Unclaimed pool retained in business treasury for future pay days.`,
        ``,
        `Full report is permanently archived in the FSIS app (Station → MY PAY DAY and FairShare → PAY DAY).`,
        ``,
        `"Every credit accounted for."`,
      ].join('\n');

      for (const m of crew) {
        if (!m.email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'FSIS.bot Pay Day',
          to: m.email,
          subject: `📋 Final pay day report — ${cycle.payday_date} (${totalPaid.toLocaleString()} aUEC distributed)`,
          body,
        });
      }

      console.log(`Cycle ${cycle.id} published: paid ${totalPaid}, deferred ${deferredShares} shares`);
      results.push({ cycle_id: cycle.id, total_paid_auec: totalPaid, deferred_shares: deferredShares });
    }

    return Response.json({ checked: openCycles.length, closed: results });
  } catch (error) {
    console.error('closePaydayCycle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});