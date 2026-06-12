import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Weekly ledger summary exported to Google Sheets.
// Creates (once) a "FSIS Ledger Reports" spreadsheet, then adds a tab per week
// with a summary block, category breakdown, and the full entry log.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // ---- Find or create the report spreadsheet ----
    const SETTING_KEY = 'ledger_report_spreadsheet_id';
    const settings = await base44.asServiceRole.entities.app_setting.filter({ key: SETTING_KEY });
    let spreadsheetId = settings[0]?.value;

    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ properties: { title: 'FSIS Ledger Reports' } }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(`Failed to create spreadsheet: ${created.error?.message}`);
      spreadsheetId = created.spreadsheetId;
      await base44.asServiceRole.entities.app_setting.create({ key: SETTING_KEY, value: spreadsheetId });
    }

    // ---- Gather last 7 days of ledger entries ----
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const all = await base44.asServiceRole.entities.ledger_entry.list('-entry_date', 1000);
    const entries = all.filter((e) => {
      const d = e.entry_date || (e.created_date || '').slice(0, 10);
      return d >= fmt(weekAgo) && d <= fmt(now);
    });

    const income = entries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
    const expenses = entries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);

    const byCategory = {};
    for (const e of entries) {
      const cat = e.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
      byCategory[cat][e.entry_type] += e.amount_auec || 0;
    }

    // ---- Build the report rows ----
    const rows = [
      ['FSIS WEEKLY LEDGER REPORT'],
      [`Period: ${fmt(weekAgo)} to ${fmt(now)}`],
      [],
      ['SUMMARY'],
      ['Total Income (aUEC)', income],
      ['Total Expenses (aUEC)', expenses],
      ['Net (aUEC)', income - expenses],
      ['Entry Count', entries.length],
      [],
      ['CATEGORY BREAKDOWN'],
      ['Category', 'Income (aUEC)', 'Expenses (aUEC)', 'Net (aUEC)'],
      ...Object.entries(byCategory).map(([cat, v]) => [cat, v.income, v.expense, v.income - v.expense]),
      [],
      ['ENTRIES'],
      ['Date', 'Type', 'Category', 'Description', 'Counterparty', 'Amount (aUEC)', 'Source', 'Screenshot'],
      ...entries.map((e) => [
        e.entry_date || (e.created_date || '').slice(0, 10),
        e.entry_type,
        e.category || 'other',
        e.description || '',
        e.counterparty || '',
        e.amount_auec || 0,
        e.source || 'manual',
        e.screenshot_url || '',
      ]),
    ];

    // ---- Add (or reuse) the weekly tab and write ----
    const tabTitle = `Week of ${fmt(now)}`;
    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabTitle } } }] }),
    });
    if (!addRes.ok) {
      const err = await addRes.json();
      // Tab already exists from an earlier run today — we'll just overwrite its values
      if (!`${err.error?.message}`.includes('already exists')) {
        throw new Error(`Failed to add sheet tab: ${err.error?.message}`);
      }
    }

    const range = encodeURIComponent(`'${tabTitle}'!A1`);
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      { method: 'PUT', headers, body: JSON.stringify({ values: rows }) }
    );
    if (!writeRes.ok) {
      const err = await writeRes.json();
      throw new Error(`Failed to write report: ${err.error?.message}`);
    }

    return Response.json({
      status: 'success',
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      tab: tabTitle,
      entries: entries.length,
      income,
      expenses,
      net: income - expenses,
    });
  } catch (error) {
    console.error('weeklyLedgerReport error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});