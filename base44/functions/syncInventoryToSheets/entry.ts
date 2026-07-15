import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_NAME = 'Inventory';
const HEADER = ['Product', 'Code', 'Category', 'Condition', 'Unit', 'Stock', 'Price (aUEC)', 'Available', 'Last Synced (UTC)'];

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Find or create the inventory spreadsheet (ID persisted in app_setting)
    const settings = await base44.asServiceRole.entities.app_setting.filter({ key: 'inventory_sync_sheet_id' });
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
          properties: { title: 'FSIS Inventory' },
          sheets: [{ properties: { title: SHEET_NAME } }],
        }),
      });
      spreadsheetId = created.spreadsheetId;
      if (settings[0]) {
        await base44.asServiceRole.entities.app_setting.update(settings[0].id, { value: spreadsheetId });
      } else {
        await base44.asServiceRole.entities.app_setting.create({ key: 'inventory_sync_sheet_id', value: spreadsheetId });
      }
    }

    // Full current inventory snapshot (services excluded — no stock levels)
    const products = await base44.asServiceRole.entities.product.list('sort_order', 500);
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const values = [
      HEADER,
      ...products
        .filter((p) => p.category !== 'service')
        .map((p) => [
          p.product_name || '',
          p.code || '',
          (p.category || '').replace(/_/g, ' '),
          p.condition_grade || '',
          p.unit || 'SCU',
          Number(p.stock || 0),
          Number(p.price_auec || 0),
          p.available ? 'YES' : 'NO',
          stamp,
        ]),
    ];

    // Clear then overwrite so the sheet always mirrors current shop levels
    await sheetsFetch(accessToken, `/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A:Z:clear`, { method: 'POST' });
    await sheetsFetch(
      accessToken,
      `/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A1?valueInputOption=USER_ENTERED`,
      { method: 'PUT', body: JSON.stringify({ values }) }
    );

    return Response.json({
      status: 'success',
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      products_synced: values.length - 1,
      synced_at: stamp,
    });
  } catch (error) {
    console.error('syncInventoryToSheets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});