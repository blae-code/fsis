export const AMBER = '#E0A22E';
export const EARTH = '#C8893B';
export const OLIVE = '#8A8F45';
export const DIM = '#7A6E60';
export const PANEL = '#100E0B';
export const BORDER = '#2A2118';

export function money(value) {
  return `${(Number(value) || 0).toLocaleString()} aUEC`;
}

export function suggestedLootPrice(item) {
  const base = Number(item.est_sell_auec || item.actual_sell_auec || 0);
  const pct = Number(item.condition_pct ?? 70);
  const multiplier = pct >= 90 ? 0.85 : pct >= 60 ? 0.65 : pct >= 30 ? 0.42 : 0.25;
  return Math.round((base || 10000) * multiplier / 100) * 100;
}

export function shortItems(items = []) {
  return items.map((i) => `${i.quantity}× ${i.code || i.product_name}`).join(' • ');
}