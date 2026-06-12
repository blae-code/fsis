import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SUMMARY_SHEET = 'Weekly Summary';
const ENTRIES_SHEET = 'Entries';

const CATEGORY_LABELS = {
  salvage_sale: 'Salvage Sale',
  order_fulfillment: 'Order Fulfillment',
  hauling: 'Hauling',
  fuel: 'Fuel',
  repairs: 'Repairs',
  fees_fines: 'Fees & Fines',
  equipment: 'Equipment',
  crew_pay: 'Crew Pay',
  ship_rental: 'Ship Rental',
  other: 'Other',
};

async function sheetsFetch(accessToken, path, options = {}) {
  const res = await fetch(`${SHEETS_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API ${res.status}: ${text}`);
  }
  return res.json();
}

async function appendRows(accessToken, spreadsheetId, sheetName, rows) {
  if (rows.length === 0) return;
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    { method: 'POST', body: JSON.stringify({ values: rows }) }
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Find or create the report spreadsheet (ID persisted in app_setting)
    const settings = await base44.asServiceRole.entities.app_setting.filter({ key: 'ledger_sheet_id' });
    let spreadsheetId = settings[0]?.value || null;

    if (spreadsheetId) {
      const check = await fetch(`${SHEETS_API}/${spreadsheetId}?fields=spreadsheetId`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!check.ok) spreadsheetId = null;
    }

    if (!spreadsheetId) {
      const created = await sheetsFetch(accessToken, '', {
        method: 'POST',
        body: JSON.stringify({
          properties: { title: 'FSIS Ledger Reports' },
          sheets: [
            { properties: { title: SUMMARY_SHEET } },
            { properties: { title: ENTRIES_SHEET } },
          ],
        }),
      });
      spreadsheetId = created.spreadsheetId;

      await appendRows(accessToken, spreadsheetId, SUMMARY_SHEET, [[
        'Week Ending', 'Entries', 'Income (aUEC)', 'Expenses (aUEC)', 'Net (aUEC)', 'Top Income Category', 'Top Expense Category',
      ]]);
      await appendRows(accessToken, spreadsheetId, ENTRIES_SHEET, [[
        'Date', 'Type', 'Category', 'Amount (aUEC)', 'Description', 'Counterparty', 'Source',
      ]]);

      if (settings[0]) {
        await base44.asServiceRole.entities.app_setting.update(settings[0].id, { value: spreadsheetId });
      } else {
        await base44.asServiceRole.entities.app_setting.create({ key: 'ledger_sheet_id', value: spreadsheetId });
      }
    }

    // Collect the past week's ledger entries
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const all = await base44.asServiceRole.entities.ledger_entry.list('-entry_date', 1000);
    const weekEntries = all.filter((e) => new Date(e.entry_date || e.created_date) >= since);

    let income = 0;
    let expense = 0;
    const byCat = { income: {}, expense: {} };
    weekEntries.forEach((e) => {
      const amt = e.amount_auec || 0;
      const cat = CATEGORY_LABELS[e.category] || 'Other';
      if (e.entry_type === 'income') {
        income += amt;
        byCat.income[cat] = (byCat.income[cat] || 0) + amt;
      } else {
        expense += amt;
        byCat.expense[cat] = (byCat.expense[cat] || 0) + amt;
      }
    });
    const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const today = new Date().toISOString().slice(0, 10);

    await appendRows(accessToken, spreadsheetId, SUMMARY_SHEET, [[
      today, weekEntries.length, income, expense, income - expense, top(byCat.income), top(byCat.expense),
    ]]);

    await appendRows(
      accessToken,
      spreadsheetId,
      ENTRIES_SHEET,
      weekEntries.map((e) => [
        e.entry_date || (e.created_date || '').slice(0, 10),
        e.entry_type,
        CATEGORY_LABELS[e.category] || e.category || 'Other',
        e.amount_auec || 0,
        e.description || '',
        e.counterparty || '',
        e.source || 'manual',
      ])
    );

    return Response.json({
      status: 'success',
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      entries_synced: weekEntries.length,
      income,
      expense,
      net: income - expense,
    });
  } catch (error) {
    console.error('syncLedgerToSheets error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});