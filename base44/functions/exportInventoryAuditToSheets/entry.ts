import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_NAME = 'Audits';
const HEADER = ['Audit Timestamp (UTC)', 'Product', 'Code', 'Category', 'Unit', 'Recorded Stock', 'Counted', 'Variance', 'Status'];

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

async function appendRows(accessToken, spreadsheetId, rows) {
  if (rows.length === 0) return;
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED`,
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

    let payload = {};
    try { payload = await req.json(); } catch { /* empty ok */ }
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (!rows.length) {
      return Response.json({ error: 'No audit rows to export' }, { status: 400 });
    }
    if (rows.length > 10000) {
      return Response.json({ error: 'Too many audit rows to export (10000 max)' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Find or create the audit spreadsheet (ID persisted in app_setting)
    const settings = await base44.asServiceRole.entities.app_setting.filter({ key: 'inventory_audit_sheet_id' });
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
          properties: { title: 'FSIS Inventory Audits' },
          sheets: [{ properties: { title: SHEET_NAME } }],
        }),
      });
      spreadsheetId = created.spreadsheetId;
      await appendRows(accessToken, spreadsheetId, [HEADER]);

      if (settings[0]) {
        await base44.asServiceRole.entities.app_setting.update(settings[0].id, { value: spreadsheetId });
      } else {
        await base44.asServiceRole.entities.app_setting.create({ key: 'inventory_audit_sheet_id', value: spreadsheetId });
      }
    }

    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await appendRows(accessToken, spreadsheetId, rows.map((r) => [
      stamp,
      r.name || '',
      r.code || '',
      r.category || '',
      r.unit || 'SCU',
      r.recorded ?? 0,
      r.counted ?? '',
      r.variance ?? '',
      r.status || '',
    ]));

    return Response.json({
      status: 'success',
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      rows_exported: rows.length,
    });
  } catch (error) {
    console.error('exportInventoryAuditToSheets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});