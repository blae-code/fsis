// FSIS corporate lore & branding constants — single source of truth
// Canon per the Operator & Company Dossier (12 JUN 2956 SET)
export const FSIS = {
  name: 'FairShare Industrial Solutions',
  abbr: 'FSIS',
  motto: 'Every credit accounted for.',
  founded: '12 JUN 2956 SET',
  foundedReal: '12 JUN 2026',
  hq: 'Lorville, Hurston — Stanton System',
  license: 'UEE-CR 2956/SAL-77741',
  divisionCodes: ['SALVAGE OPS', 'FABRICATION', 'LOGISTICS'],
  org: 'Redscar Nomads',
  tagline: "A scrapper's hand-built software running on elegant alien bones",
};

export const OPERATOR = {
  handle: 'blae',
  role: 'Founder · sole operator · engineer of record',
  affiliation: 'Member, Redscar Nomads — served at a preferential rate',
  trade: 'Salvage & cargo hauling',
  disposition: 'Brainstorm before build · align on principle before execution',
};

export const FOUNDING_STORY = `Founded 12 June 2956 SET — the opening day of Alien Week — FairShare Industrial Solutions is a one-person salvage-and-haul operation that treats its own name as a design specification. "FairShare" is a trade name, an ethical commitment to cooperative economics, and a binding constraint on how the software behaves: a quote must show its work. Market reference, margin, discount — all on the invoice, every time. The operator is the entire firm; the ethics are load-bearing because one person bears them.`;

// Where the outfit actually is. A salvage firm is its floor space before it is anything
// else, and every quote, ETA and handoff on this app is reckoned from this berth.
export const HOME_BERTH = {
  city: 'Lorville',
  planet: 'Hurston',
  system: 'Stanton',
  authority: 'Hurston Dynamics — Central Business District oversight',
  berth: 'Teasa Spaceport — Workshop Bay, leased hangar frontage',
  district: 'Workers\u2019 District',
  summary: 'FSIS keeps its bench in Lorville, on Hurston, because that is where the work is and where the people doing it live. Teasa Spaceport puts a leased hangar frontage within a lift ride of the Workers\u2019 District, and Hurston\u2019s scrap economy means a stripped hull rarely travels far before somebody wants what came off it.',
  reason: 'Hurston Dynamics tolerates salvage because salvage feeds its foundries. FSIS pays the lease, files the manifests, and keeps its own books — the arrangement is commercial, not loyal.',
  landmarks: [
    { name: 'Teasa Spaceport', note: 'Leased hangar frontage — intake, appraisal bench and handoff floor.' },
    { name: 'Workers\u2019 District', note: 'Where the hands live. Musters are called on District time.' },
    { name: 'Central Business District', note: 'Hurston Dynamics oversight, filings and the licence on the wall.' },
    { name: 'Everus Harbor', note: 'Orbital transfer above Hurston — bulk cargo staged here before a run.' },
  ],
  handoffNote: 'Default handoff is Lorville, Teasa Spaceport, unless the buyer proposes otherwise. Anywhere else in Stanton is a run, and a run is priced as one.',
};

export const FLEET_NOTE = 'Prior fleet melted — credit returned. Rebuilding on alien iron during Alien Week, alien-manufacturer priority across the rebuild.';

export const FLEET_REGISTRY = [
  { hull: 'FSIS-01', ship: 'Gatac Railen', name: 'FAIR SHARE', role: "Xi'an medium cargo · ~640 SCU · lead ship" },
];

export const CORE_VALUES = [
  { title: 'SHOW THE MATH', text: 'Every quote itemizes market reference, margin, and discount. No mystery numbers.' },
  { title: 'RECLAIM EVERYTHING', text: 'A wreck is inventory waiting to be filed. Nothing burns up that could be sold honest.' },
  { title: 'ORGMATES FIRST', text: 'Redscar Nomads get the best rate. Always have, always will.' },
];

export const PRINCIPLES = [
  { ix: 'P-01', title: 'FairShare as architecture', text: 'The brand name drives a core UX decision — quotes expose the full pricing math, not just the final number.' },
  { ix: 'P-02', title: 'Branding with integrity', text: 'Construction lines, itemised receipts, cooperative tiers — every element expresses consistent values.' },
  { ix: 'P-03', title: 'Brainstorm before build', text: 'Ideation and alignment on principle precede implementation. Nothing is committed until derived from something.' },
  { ix: 'P-04', title: 'Immersive-first', text: 'The OS-shell framing is a deliberate choice that shapes how every future module is introduced and felt.' },
];

// Deterministic pseudo-lot-number from a string id
export function lotNumber(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return `LOT-${String(h).padStart(5, '0')}`;
}