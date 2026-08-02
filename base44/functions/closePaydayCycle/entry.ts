import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { PROPRIETOR_EMAIL } from '../../shared/roles.js';
import { contractorIndex, isContractorLine, logsBelongingTo, normaliseHandle, sameHandle, sharesInLogs } from '../../shared/members.js';
import { roundAuec, roundShares } from '../../shared/money.js';
import { notifyMany } from '../../shared/notices.js';

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

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Management access required' }, { status: 403 });
    }

    const openCycles = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'open' });
    const now = new Date();
    const results = [];

    for (const cycle of openCycles) {
      const due = new Date(cycle.closes_at) <= now;
      const targeted = force && (!payload.cycle_id || payload.cycle_id === cycle.id);
      if (!due && !targeted) continue;

      // Atomic claim: conditionally flip this cycle 'open' -> 'published' server-side
      // BEFORE computing any payout. Only the invocation that wins (updated === 1)
      // proceeds, so a concurrent hourly-bot run + management force-close cannot both
      // pay out the same cycle (double-pay). The final report/totals are filled in by
      // the update() below once payouts are computed.
      const claim = await base44.asServiceRole.entities.payday_cycle.updateMany(
        { id: cycle.id, status: 'open' },
        { $set: { status: 'published', published_at: now.toISOString() } }
      );
      if (!claim || claim.updated === 0) continue;

      const pool = cycle.pool_auec || 0;
      const totalShares = cycle.total_shares || 0;
      const shareValue = totalShares > 0 ? pool / totalShares : 0;

      // Elections made during the window, read back against the comrade who filed them — by
      // account where the election carries one, and only otherwise by callsign. A comrade whose
      // name changed mid-window must still have their own decision honoured.
      const elections = await base44.asServiceRole.entities.payday_election.filter({ cycle_id: cycle.id });
      const decisionFor = (line: any) => {
        const filed = elections.find((e) =>
          e.member_user_id && line.user_id
            ? e.member_user_id === line.user_id
            : sameHandle(e.handle, line.handle),
        );
        return filed?.decision || '';
      };

      const report = [];
      let totalPaid = 0;
      let deferredShares = 0;

      // Contractors never draw from the share pool — their labour is settled in full at the
      // point of work, so a contractor in an older snapshot is skipped here. Matched by account
      // where the snapshot carries one, and only otherwise by callsign.
      const contractorUsers = await base44.asServiceRole.entities.User.filter({ fsis_role: 'contractor' });
      const contractors = contractorIndex(contractorUsers);

      // The proprietor's cash-in is an owner draw and is labelled as one on the ledger. Read from
      // the record rather than from a name held in code, with the founding callsign kept as a
      // fallback so older snapshots still read correctly.
      const proprietorUsers = [
        ...(await base44.asServiceRole.entities.User.filter({ fsis_role: 'proprietor' })),
        ...(await base44.asServiceRole.entities.User.filter({ email: PROPRIETOR_EMAIL })),
      ];
      const proprietorIds = new Set(proprietorUsers.map((u) => u.id).filter(Boolean));
      const proprietorHandles = new Set(proprietorUsers.map((u) => normaliseHandle(u.handle)).filter(Boolean));

      // Every confirmed log at the moment of close, read once rather than queried per hand —
      // a query inside the loop is how this timed out before. Cash-in still takes ALL confirmed
      // labour including anything earned mid-window, which is the pro-labour reading.
      const confirmedLogs = await base44.asServiceRole.entities.time_log.filter({ status: 'confirmed' }, '-created_date', 1000);

      for (const snap of cycle.shares_by_handle || []) {
        if (isContractorLine(contractors, snap)) {
          report.push({ handle: snap.handle, user_id: snap.user_id || '', shares: 0, decision: 'contractor_paid_directly', payout_auec: 0 });
          continue;
        }
        const decision = decisionFor(snap) || 'defer';
        if (decision === 'cash_in' && shareValue > 0) {
          const logs = logsBelongingTo(confirmedLogs, { userId: snap.user_id, handle: snap.handle });
          const actualShares = sharesInLogs(logs);
          const payout = roundAuec(actualShares * shareValue);

          const isOwner = snap.user_id
            ? proprietorIds.has(snap.user_id)
            : proprietorHandles.has(normaliseHandle(snap.handle)) || normaliseHandle(snap.handle) === 'blae';
          await base44.asServiceRole.entities.ledger_entry.create({
            entry_type: 'expense',
            category: 'crew_pay',
            amount_auec: payout,
            counterparty: isOwner ? `${snap.handle} (owner draw — personal)` : snap.handle,
            description: `Pay day ${cycle.payday_date} — ${roundShares(actualShares)} shares @ ${roundAuec(shareValue).toLocaleString()} aUEC/share (cycle ${cycle.id})`,
            entry_date: now.toISOString().slice(0, 10),
            source: 'automation',
          });
          for (const l of logs) {
            await base44.asServiceRole.entities.time_log.update(l.id, {
              status: 'cashed',
              payday_date: cycle.payday_date,
              payout_auec: roundAuec((l.shares || 0) * shareValue),
            });
          }
          totalPaid += payout;
          report.push({ handle: snap.handle, user_id: snap.user_id || '', shares: roundShares(actualShares), decision: 'cash_in', payout_auec: payout });
        } else {
          deferredShares += snap.shares || 0;
          report.push({
            handle: snap.handle,
            user_id: snap.user_id || '',
            shares: snap.shares || 0,
            decision: decisionFor(snap) === 'defer' ? 'defer' : 'no_response_defer',
            payout_auec: 0,
          });
        }
      }

      await base44.asServiceRole.entities.payday_cycle.update(cycle.id, {
        status: 'published',
        published_at: now.toISOString(),
        share_value_auec: roundShares(shareValue),
        report,
        total_paid_auec: roundAuec(totalPaid),
        deferred_shares: roundShares(deferredShares),
        force_closed: targeted && !due,
      });

      // Each comrade is told their own line of the report. The transparency report has always been
      // published in-app; publishing it and telling nobody means a comrade learns what they were
      // paid by going and looking, which is the same as not being told.
      await notifyMany(base44, report
        .filter((line: any) => line.user_id)
        .map((line: any) => ({
          recipient_user_id: line.user_id,
          recipient_handle: line.handle,
          kind: 'payday_published',
          title: `Pay day ${cycle.payday_date} is settled`,
          body: [
            line.decision === 'cash_in'
              ? `${roundAuec(line.payout_auec).toLocaleString()} aUEC for ${roundShares(line.shares)} shares, at ${roundAuec(shareValue).toLocaleString()} aUEC a share — the same rate as everyone else.`
              : line.decision === 'contractor_paid_directly'
                ? 'You are settled in full at the point of work rather than from the share pool, so there is nothing here for you to draw.'
                : `${roundShares(line.shares)} shares deferred and rolled forward to the next cycle. Nothing is forfeited; they are still yours.`,
            line.decision === 'no_response_defer'
              ? 'You did not make an election this cycle, so they were deferred by default. That costs you nothing, and you can cash in next time.'
              : '',
            `The pool was ${roundAuec(pool).toLocaleString()} aUEC across ${roundShares(totalShares)} shares. The full report is published in-app for anybody to check, keyed by callsign.`,
          ].filter(Boolean).join('\n\n'),
          source_type: 'payday_cycle',
          source_id: cycle.id,
          source_name: cycle.cycle_name,
          actor_email: 'FSIS.bot',
          actor_role: 'system',
        })));

      // No emails / PII — the transparency report is published in-app, keyed by callsign only.
      console.log(`Cycle ${cycle.id} published: paid ${totalPaid}, deferred ${deferredShares} shares`);
      results.push({ cycle_id: cycle.id, total_paid_auec: totalPaid, deferred_shares: deferredShares });
    }

    return Response.json({ checked: openCycles.length, closed: results });
  } catch (error) {
    console.error('closePaydayCycle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});