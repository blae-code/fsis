// FSIS corporate lore & branding constants — single source of truth
export const FSIS = {
  name: 'FairShare Industrial Solutions',
  abbr: 'FSIS',
  motto: 'Every credit accounted for.',
  founded: '2948',
  hq: 'Port Tressler, microTech — Stanton System',
  license: 'UEE-CR 2948/SAL-77741',
  divisionCodes: ['SALVAGE OPS', 'FABRICATION', 'LOGISTICS'],
  org: 'Redscar Nomads',
};

export const FOUNDING_STORY = `Founded in 2948 by a former Drake demolition crew that got tired of watching middlemen skim honest scrappers, FSIS started as a single Vulture working the Aaron Halo on a handshake-and-ledger basis. The rule was simple: show the customer the math. Market reference, margin, discount — all on the invoice, every time. Word spread. The fleet grew. The math stayed public.`;

export const FLEET_REGISTRY = [
  { hull: 'FSIS-01', ship: 'Drake Vulture', name: 'PENNY PINCHER', role: 'Light salvage' },
  { hull: 'FSIS-02', ship: 'Aegis Reclaimer', name: 'GROSS MARGIN', role: 'Heavy salvage & processing' },
  { hull: 'FSIS-03', ship: 'MISC Freelancer MAX', name: 'LINE ITEM', role: 'Cargo & delivery' },
  { hull: 'FSIS-04', ship: 'Argo SRV', name: 'WRITE-OFF', role: 'Wreck towing' },
];

export const CORE_VALUES = [
  { title: 'SHOW THE MATH', text: 'Every quote itemizes market reference, margin, and discount. No mystery numbers.' },
  { title: 'RECLAIM EVERYTHING', text: 'A wreck is inventory waiting to be filed. Nothing burns up that could be sold honest.' },
  { title: 'ORGMATES FIRST', text: 'Redscar Nomads get the best rate. Always have, always will.' },
];

// Deterministic pseudo-lot-number from a string id
export function lotNumber(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return `LOT-${String(h).padStart(5, '0')}`;
}