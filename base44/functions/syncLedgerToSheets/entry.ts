import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SETTING_KEY = 'ledger_sheets_spreadsheet_id';

// Weekly ledger → Google Sheets sync. Creates the report spreadsheet on first run,
// then appends a weekly summary row + the week's transactions on every run.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Get or create the report spreadsheet
    let spreadsheetId = null;
    let spreadsheetUrl = null;
    const settings = await base44.asServiceRole.entities.app_setting.filter({ key: SETTING_KEY });
    if (settings.length > 0 && settings[0].value) {
      spreadsheetId = settings[0].value;
    } else {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          properties: { title: 'FSIS Ledger Report' },
          sheets: [
            { properties: { title: 'Weekly Summary' } },
            { properties: { title: 'Transactions' } },
          ],
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(`Sheets create failed: ${created.error?.message}`);
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = created.spreadsheetUrl;

      // Write header rows
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: "'Weekly Summary'!A1",
              values: [['Week', 'Income (aUEC)', 'Expenses (aUEC)', 'Net (aUEC)', 'Entries', 'Top Income Category', 'Top Expense Category']],
            },
            {
              range: "'Transactions'!A1",
              values: [['Date', 'Type', 'Category', 'Amount (aUEC)', 'Counterparty', 'Description', 'Source']],
            },
          ],
        }),
      });

      await base44.asServiceRole.entities.app_setting.create({ key: SETTING_KEY, value: spreadsheetId });
    }

    // Collect last 7 days of ledger entries
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const all = await base44.asServiceRole.entities.ledger_entry.list('-entry_date', 1000);
    const entries = all.filter((e) => (e.entry_date || e.created_date?.slice(0, 10) || '') >= weekStartStr);

    const income = entries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
    const expenses = entries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);

    const topCategory = (type) => {
      const sums = {};
      entries.filter((e) => e.entry_type === type).forEach((e) => {
        sums[e.category || 'other'] = (sums[e.category || 'other'] || 0) + (e.amount_auec || 0);
      });
      const top = Object.entries(sums).sort((a, b) => b[1] - a[1])[0];
      return top ? `${top[0]} (${Math.round(top[1]).toLocaleString()})` : '—';
    };

    // Append weekly summary row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Weekly Summary'!A1")}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        values: [[
          `${weekStartStr} → ${todayStr}`,
          income,
          expenses,
          income - expenses,
          entries.length,
          topCategory('income'),
          topCategory('expense'),
        ]],
      }),
    });

    // Append the week's transactions
    if (entries.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'Transactions'!A1")}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          values: entries.map((e) => [
            e.entry_date || e.created_date?.slice(0, 10) || '',
            e.entry_type,
            e.category || 'other',
            e.entry_type === 'expense' ? -(e.amount_auec || 0) : (e.amount_auec || 0),
            e.counterparty || '',
            e.description || '',
            e.source || 'manual',
          ]),
        }),
      });
    }

    return Response.json({
      status: 'success',
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      entries_synced: entries.length,
      income,
      expenses,
      net: income - expenses,
    });
  } catch (error) {
    console.error('syncLedgerToSheets error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});