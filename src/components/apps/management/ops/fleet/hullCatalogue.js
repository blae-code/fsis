/**
 * Hulls we actually fly, with what they hold and what they are for. A callsign typed
 * from memory is a callsign typed wrong — so the yard offers the hull and fills the rest.
 */
export const HULLS = [
  { hull: 'Drake Vulture',            scu: 12,   role: 'salvage' },
  { hull: 'Aegis Reclaimer',          scu: 420,  role: 'salvage' },
  { hull: 'RSI Perseus',              scu: 0,    role: 'escort' },
  { hull: 'Drake Cutlass Black',      scu: 46,   role: 'hauler' },
  { hull: 'Drake Caterpillar',        scu: 576,  role: 'hauler' },
  { hull: 'MISC Freelancer MAX',      scu: 120,  role: 'hauler' },
  { hull: 'MISC Hull C',              scu: 4608, role: 'hauler' },
  { hull: 'Argo RAFT',                scu: 96,   role: 'hauler' },
  { hull: 'Crusader C2 Hercules',     scu: 696,  role: 'hauler' },
  { hull: 'Crusader A2 Hercules',     scu: 216,  role: 'escort' },
  { hull: 'RSI Constellation Andromeda', scu: 96, role: 'escort' },
  { hull: 'Anvil Carrack',            scu: 456,  role: 'commander' },
  { hull: 'Aegis Hammerhead',         scu: 40,   role: 'escort' },
  { hull: 'Anvil Valkyrie',           scu: 30,   role: 'support' },
  { hull: 'Aegis Avenger Titan',      scu: 8,    role: 'scout' },
  { hull: 'Anvil Arrow',              scu: 0,    role: 'scout' },
  { hull: 'Aegis Sabre',              scu: 0,    role: 'escort' },
  { hull: 'Anvil Hornet F7C',         scu: 0,    role: 'escort' },
  { hull: 'ARGO MOLE',                scu: 96,   role: 'mining' },
  { hull: 'MISC Prospector',          scu: 32,   role: 'mining' },
  { hull: 'RSI Apollo',               scu: 24,   role: 'medical' },
  { hull: 'Drake Cutlass Red',        scu: 0,    role: 'medical' },
  { hull: 'Aegis Vulcan',             scu: 12,   role: 'support' },
  { hull: 'Crusader Starlifter M2',   scu: 522,  role: 'hauler' },
  { hull: 'Origin 400i',              scu: 60,   role: 'scout' },
  { hull: 'Origin 890 Jump',          scu: 388,  role: 'commander' },
];

export const HULL_NAMES = HULLS.map((h) => h.hull);

/** Match a typed hull to the catalogue, loosely — 'vulture' finds the Vulture. */
export function lookupHull(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return null;
  return (
    HULLS.find((h) => h.hull.toLowerCase() === q) ||
    HULLS.find((h) => h.hull.toLowerCase().includes(q)) ||
    null
  );
}

/** A sensible callsign for a hull — VULTURE-1, VULTURE-2 — so no two hulls answer to one name. */
export function suggestCallsign(hull, existing = []) {
  const words = String(hull || '').trim().split(/\s+/);
  const stem = (words[words.length - 1] || 'HULL').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const taken = new Set(existing.map((c) => String(c || '').toUpperCase()));
  for (let i = 1; i < 40; i += 1) {
    const candidate = `${stem}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return stem;
}