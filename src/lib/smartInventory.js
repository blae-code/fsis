export const gradeFor = (pct) => pct >= 95 ? 'new' : pct >= 80 ? 'refurb' : pct >= 55 ? 'used' : 'worn';
export const round100 = (n) => Math.round(Number(n || 0) / 100) * 100;
export const productCategoryFor = (type) => type === 'bulk_cargo' ? 'salvage_commodity' : (type || 'ship_component');
export const crateCode = () => `FSIS-AUTO-${Date.now().toString(36).toUpperCase().slice(-6)}`;

export function normalizeRows(rows = []) {
  return rows.filter((r) => r.item_name).map((r) => ({ ...r, quantity: Number(r.quantity || 1), condition_pct: Number(r.condition_pct || 100), condition_grade: gradeFor(Number(r.condition_pct || 100)), est_sell_auec: round100(r.est_sell_auec) }));
}

export function groupForProducts(rows = [], products = []) {
  const groups = {};
  rows.forEach((r) => {
    const key = `${String(r.item_name).toLowerCase()}|${productCategoryFor(r.item_type)}`;
    groups[key] ||= { ...r, quantity: 0 };
    groups[key].quantity += Number(r.quantity || 1);
  });
  return Object.values(groups).map((r) => ({ row: r, match: products.find((p) => String(p.product_name || '').toLowerCase() === String(r.item_name || '').toLowerCase()) }));
}

export function rowToLoot(r, meta) {
  return { item_name: r.item_name, item_type: r.item_type || 'ship_component', manufacturer: r.manufacturer || '', size_class: r.size_class || 'N/A', quantity: r.quantity, condition_pct: r.condition_pct, condition_grade: r.condition_grade, source_op: meta.sourceOp, source_location: meta.sourceLocation, crew_handle: meta.crewHandle, status: 'raw', est_sell_auec: r.est_sell_auec, notes: [r.notes, r.confidence ? `AI confidence: ${Math.round(r.confidence * 100)}%` : ''].filter(Boolean).join('\n') };
}

export function rowToProduct(r) {
  return { product_name: r.item_name, category: productCategoryFor(r.item_type), item_type: r.item_type || '', condition_grade: r.condition_grade, condition_pct: r.condition_pct, size_class: r.size_class || 'N/A', manufacturer: r.manufacturer || '', price_auec: r.est_sell_auec || 0, unit: r.item_type === 'bulk_cargo' ? 'SCU' : 'each', stock: r.quantity, available: true, description: r.notes || 'Auto-synced from FSIS smart inventory intake.' };
}

export function cratePayload(rows, meta) {
  return { crate_code: crateCode(), label: `Auto intake — ${meta.sourceOp || 'field stock'}`, location_code: meta.locationCode || '', destination: meta.sourceLocation || '', stage: 'intake', scu_used: rows.reduce((s, r) => s + (r.item_type === 'bulk_cargo' ? Number(r.quantity || 0) : 0), 0), cargo_value_auec: rows.reduce((s, r) => s + Number(r.est_sell_auec || 0) * Number(r.quantity || 1), 0), risk_level: 'medium', contents: rows.map((r) => ({ item_ref_type: 'manual', name: r.item_name, quantity: r.quantity, unit: r.item_type === 'bulk_cargo' ? 'SCU' : 'each', value_auec: r.est_sell_auec })), notes: 'Generated from approved Smart Inventory Intake.' };
}