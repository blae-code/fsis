import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot payroll agent: when a FairShare work order is settled, compute each
// crew member's payout, auto-log crew_pay expense entries in the Ledger,
// and append a summary row to the configured Google Sheets master log.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let wo = payload.data;
    if (payload_too_large || !wo) {
      wo = await base44.asServiceRole.entities.work_order.get(event.entity_id);
    }

    if (wo.status !== 'settled') {
      return Response.json({ skipped: true, reason: 'Work order not settled' });
    }

    const svc = base44.asServiceRole.entities;
    const dedupeTag = `[wo:${wo.id}]`;

    // Guard against double-processing
    const existing = await svc.ledger_entry.filter({ category: 'crew_pay' }, '-created_date', 200);
    if (existing.some((e) => (e.notes || '').includes(dedupeTag))) {
      return Response.json({ skipped: true, reason: 'Payroll already booked' });
    }

    const gross = wo.gross_auec || 0;
    const expenses = (wo.expenses || []).reduce((t, e) => t + (e.amount_auec || 0), 0);
    const net = Math.max(0, gross - expenses);
    const totalShares = (wo.crew_shares || []).reduce((t, c) => t + (c.shares || 0), 0);

    if (net <= 0 || totalShares <= 0) {
      return Response.json({ skipped: true, reason: 'Nothing to pay out' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const perShare = net / totalShares;

    const entries = (wo.crew_shares || [])
      .filter((c) => (c.shares || 0) > 0)
      .map((c) => ({
        entry_type: 'expense',
        category: 'crew_pay',
        amount_auec: Math.round(perShare * c.shares),
        description: `Crew payout — ${c.handle} (${c.shares} share${c.shares === 1 ? '' : 's'}) for ${wo.order_name}`,
        counterparty: c.handle,
        entry_date: today,
        notes: `Auto-logged by FSIS.bot payroll agent. ${dedupeTag}`,
      }));

    await svc.ledger_entry.bulkCreate(entries);

    if (!wo.settled_date) {
      await svc.work_order.update(wo.id, { settled_date: today });
    }

    // ── Append to Google Sheets master log ──────────────────────────────────
    try {
      const sheetSettings = await svc.app_setting.filter({ key: 'work_order_log_sheet_id' });
      const sheetId = sheetSettings?.[0]?.value;

      if (sheetId) {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

        // Build one row per crew payout + a summary row
        const crewRows = entries.map((e) => [
          today,
          wo.id,
          wo.order_name,
          wo.session_name || '',
          gross,
          expenses,
          net,
          totalShares,
          e.counterparty,
          e.amount_auec,
          'crew_pay',
          e.notes,
        ]);

        // Append all rows in one API call
        const range = 'Work Orders!A:L';
        const appendRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: crewRows }),
          }
        );

        if (!appendRes.ok) {
          const err = await appendRes.text();
          console.error('Sheets append failed:', err);
        } else {
          console.log(`Appended ${crewRows.length} rows to Sheets log for work order ${wo.id}`);
        }
      } else {
        console.log('No Sheet ID configured — skipping Sheets log (set work_order_log_sheet_id in app_settings)');
      }
    } catch (sheetsErr) {
      // Non-fatal — payroll is already booked even if Sheets write fails
      console.error('Sheets logging error (non-fatal):', sheetsErr.message);
    }
    // ────────────────────────────────────────────────────────────────────────

    console.log(`Work order ${wo.id} settled: ${entries.length} crew payouts booked, net ${net}`);
    return Response.json({ applied: true, payouts: entries.length, net_auec: net });
  } catch (error) {
    console.error('onWorkOrderSettled error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});