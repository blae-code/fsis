export const ITEM_TYPES = [
  ['ship_component', 'Ship Component'],
  ['vehicle_component', 'Vehicle Component'],
  ['fps_gear', 'FPS Gear'],
  ['weapon', 'Weapon'],
  ['bulk_cargo', 'Bulk Cargo'],
];

export const SIZE_CLASSES = ['S1', 'S2', 'S3', 'S4', 'S5', 'M', 'L', 'XL', 'N/A'];

export function conditionGrade(pct) {
  const value = Number(pct) || 0;
  if (value >= 90) return 'new';
  if (value >= 60) return 'refurb';
  if (value >= 30) return 'used';
  return 'worn';
}

export function formatAuec(value) {
  return `${(Number(value) || 0).toLocaleString()} aUEC`;
}