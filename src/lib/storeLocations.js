// Known delivery destinations with ETA hints — used by checkout, quotes and tracking
export const DELIVERY_LOCATIONS = [
  { name: 'Port Tressler', region: 'microTech', eta: '2–6h', note: 'FSIS home port — fastest turnaround' },
  { name: 'New Babbage', region: 'microTech', eta: '4–8h' },
  { name: 'Everus Harbor', region: 'Hurston', eta: '6–12h' },
  { name: 'Lorville', region: 'Hurston', eta: '8–14h' },
  { name: 'Baijini Point', region: 'ArcCorp', eta: '6–12h' },
  { name: 'Area18', region: 'ArcCorp', eta: '8–14h' },
  { name: 'Seraphim Station', region: 'Crusader', eta: '6–12h' },
  { name: 'Orison', region: 'Crusader', eta: '8–16h' },
  { name: 'GrimHEX', region: 'Yela', eta: '10–18h', note: 'Escort surcharge may apply' },
];

// Volume discount tiers by total SCU — confirmed by the operator at order confirmation
export const VOLUME_TIERS = [
  { min: 2500, pct: 10 },
  { min: 1000, pct: 6 },
  { min: 500, pct: 3 },
];

export function volumeDiscount(totalScu) {
  const tier = VOLUME_TIERS.find((t) => totalScu >= t.min);
  return tier ? tier.pct : 0;
}

export function etaFor(name) {
  return DELIVERY_LOCATIONS.find((l) => l.name === name)?.eta || null;
}