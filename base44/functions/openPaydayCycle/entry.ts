import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Opens a Pay Day cycle with a 72-hour decision window.
// Runs automatically every Friday morning (FSIS.bot), or manually by management.
// Pool defaults to the trailing 7-day ledger net (floored at 0) so the pool is
// anchored to real earnings — management can adjust it while the window is open.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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

    // Outstanding confirmed shares per handle
    const logs = await base44.asServiceRole.entities.time_log.filter({ status: 'confirmed' }, '-created_date', 1000);
    const byHandle = {};
    for (const l of logs) {
      byHandle[l.handle] = (byHandle[l.handle] || 0) + (l.shares || 0);
    }
    const totalShares = Object.values(byHandle).reduce((t, s) => t + s, 0);
    if (totalShares <= 0) {
      return Response.json({ skipped: true, reason: 'No outstanding shares — nothing to distribute' });
    }

    // Pool: explicit from management, else trailing 7-day ledger net
    let pool;
    let poolSource;
    if (payload.pool_auec > 0) {
      pool = Math.round(payload.pool_auec);
      poolSource = 'Declared by management';
    } else {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const entries = await base44.asServiceRole.entities.ledger_entry.list('-created_date', 500);
      let net = 0;
      for (const e of entries) {
        if ((e.entry_date || e.created_date?.slice(0, 10) || '') < since) continue;
        net += e.entry_type === 'income' ? (e.amount_auec || 0) : -(e.amount_auec || 0);
      }
      pool = Math.max(0, Math.round(net));
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
      total_shares: Math.round(totalShares * 100) / 100,
      share_value_auec: Math.round(shareValue * 100) / 100,
      shares_by_handle: Object.entries(byHandle).map(([handle, shares]) => ({
        handle,
        shares: Math.round(shares * 100) / 100,
      })),
    });

    // No emails / PII — crew see the open window in-app (Station → MY PAY DAY),
    // identified by callsign only.
    console.log(`Pay day cycle ${cycle.id} opened: pool ${pool}, ${totalShares} shares`);
    return Response.json({ opened: true, cycle_id: cycle.id, pool_auec: pool, total_shares: totalShares });
  } catch (error) {
    console.error('openPaydayCycle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});