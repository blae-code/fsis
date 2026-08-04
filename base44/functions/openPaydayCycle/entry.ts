import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { groupLogsByMember } from '../../shared/members.js';
import { roundAuec, roundShares, sumShares } from '../../shared/money.js';
import { notifyMany } from '../../shared/notices.js';
import { reportError, recordSweep } from '../../shared/diagnostics.js';

// Opens a Pay Day cycle with a 72-hour decision window.
// Runs automatically every Friday morning (FSIS.bot), or manually by management.
// Pool defaults to the trailing 7-day ledger net (floored at 0) so the pool is
// anchored to real earnings — management can adjust it while the window is open.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sweepStartedAt = new Date();
  try {

    // Manual invocations must be admin; scheduled automation runs unauthenticated.
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Management access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));

    // Never open a second cycle while one is running
    const openCycles = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'open' });
    if (openCycles.length > 0) {
      return Response.json({ skipped: true, reason: 'A pay day cycle is already open', cycle_id: openCycles[0].id });
    }

    // Outstanding confirmed shares, gathered per comrade. Labour recorded against an account and
    // older labour recorded only against a callsign are the same hand and are counted once.
    const logs = await base44.asServiceRole.entities.time_log.filter({ status: 'confirmed' }, '-created_date', 1000);
    const members = groupLogsByMember(logs);
    const totalShares = sumShares(members.map((m) => m.shares));
    if (totalShares <= 0) {
      return Response.json({ skipped: true, reason: 'No outstanding shares — nothing to distribute' });
    }

    // Pool: explicit from management, else trailing 7-day ledger net
    let pool;
    let poolSource;
    if (payload.pool_auec > 0) {
      pool = roundAuec(payload.pool_auec);
      poolSource = 'Declared by management';
    } else {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const entries = await base44.asServiceRole.entities.ledger_entry.list('-created_date', 500);
      let net = 0;
      for (const e of entries) {
        if ((e.entry_date || e.created_date?.slice(0, 10) || '') < since) continue;
        net += e.entry_type === 'income' ? (e.amount_auec || 0) : -(e.amount_auec || 0);
      }
      pool = Math.max(0, roundAuec(net));
      poolSource = 'Auto: trailing 7-day ledger net';
    }

    const now = new Date();
    const closes = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const paydayDate = now.toISOString().slice(0, 10);
    const shareValue = pool > 0 ? pool / totalShares : 0;

    const cycle = await base44.asServiceRole.entities.payday_cycle.create({
      cycle_name: `Pay Day — ${paydayDate}`,
      payday_date: paydayDate,
      opens_at: now.toISOString(),
      closes_at: closes.toISOString(),
      status: 'open',
      pool_auec: pool,
      pool_source: poolSource,
      total_shares: roundShares(totalShares),
      share_value_auec: roundShares(shareValue),
      // The callsign is carried for display; the account is what the cycle settles against.
      shares_by_handle: members.map((member) => ({
        handle: member.handle,
        user_id: member.user_id,
        shares: roundShares(member.shares),
      })),
    });

    // Every comrade with shares in this cycle is told the window has opened.
    //
    // Without this the whole election is a trap: the window runs 72 hours, a comrade who says
    // nothing is deferred by default, and nobody was ever told there was anything to say. Deferring
    // never forfeits shares, so the loss is not of money — it is of the choice, which is the part
    // the cycle exists to give them.
    await notifyMany(base44, members
      .filter((member) => member.user_id && member.shares > 0)
      .map((member) => ({
        recipient_user_id: member.user_id,
        recipient_handle: member.handle,
        kind: 'payday_opened',
        title: `Pay day is open — ${roundShares(member.shares)} shares standing to you`,
        body: [
          `The pool for this cycle is ${pool.toLocaleString()} aUEC across ${roundShares(totalShares)} shares, which is about ${roundAuec(shareValue).toLocaleString()} aUEC a share.`,
          `You have ${roundShares(member.shares)} shares outstanding.`,
          `You have until ${closes.toISOString().slice(0, 16).replace('T', ' ')} UTC to say whether you are cashing in or deferring.`,
          'Saying nothing defers, and deferred shares roll forward — they are never forfeited. But the choice is yours to make rather than to miss, which is why you are being told rather than left to find out.',
        ].join('\n\n'),
        source_type: 'payday_cycle',
        source_id: cycle.id,
        source_name: cycle.cycle_name,
        actor_email: 'FSIS.bot',
        actor_role: 'system',
      })));

    // No emails / PII — crew see the open window in-app (Station → MY PAY DAY),
    // identified by callsign only.
    console.log(`Pay day cycle ${cycle.id} opened: pool ${pool}, ${totalShares} shares`);
    return Response.json({ opened: true, cycle_id: cycle.id, pool_auec: pool, total_shares: totalShares });
  } catch (error) {
    await reportError(base44, { source: 'openPaydayCycle', error, route: 'openPaydayCycle' });
    await recordSweep(base44, { job: 'openPaydayCycle', ok: false, error, startedAt: sweepStartedAt });
    return Response.json({ error: error.message }, { status: 500 });
  }
});