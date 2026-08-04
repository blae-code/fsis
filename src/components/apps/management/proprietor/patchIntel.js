// Patch intelligence — Alpha 4.9 is LIVE; Alpha 4.10 is on the PTU.
// Compiled from the official 4.9 LIVE patch notes and the 4.10 PTU Wave 1 notes.
export const LIVE_PATCH = '4.9';
export const PTU_PATCH  = '4.10';

// Kept for the many call sites that just want "the patch we trade on today".
export const PATCH_VERSION = LIVE_PATCH;
export const PATCH_PHASE   = 'patch_4.10';

export const INTEL = [
  {
    severity: 'high', tag: 'ECONOMY',
    title: '4.10 PTU runs Long Term Persistence — no wipe signalled for the 4.10 transition',
    impact: 'LTP is enabled across 4.10 PTU builds, so aUEC, reputation, and stored goods are expected to carry over rather than reset. That makes a pre-patch fire-sale unnecessary — but it is a PTU signal, not a LIVE guarantee.',
    action: 'Hold stock rather than dumping it, but keep the inventory audit ready to run the moment 4.10 hits LIVE.',
    source: '4.10 PTU Wave 1 patch notes',
  },
  {
    severity: 'high', tag: 'LOGISTICS',
    title: 'Hydrogen fuel balance pass in 4.10',
    impact: 'Hydrogen consumption is being rebalanced again on top of the 4.9 quantum changes. Per-run handling and delivery costs will move, in either direction, once it lands.',
    action: 'Re-check freight plan handling costs and delivery pricing after 4.10 goes LIVE — do not re-cost off PTU figures.',
    source: '4.10 PTU Wave 1 patch notes',
  },
  {
    severity: 'medium', tag: 'REVENUE',
    title: 'Recco Battaglia returns · Orison Relief Support',
    impact: 'The Battaglia mission line comes back and Orison relief contracts open a fresh hauling and recovery pipeline — both are sourcing channels for salvage and reclamation stock.',
    action: 'Plan intake capacity for relief hauling and Battaglia reclamation loot ahead of the LIVE date.',
    source: '4.10 PTU Wave 1 patch notes',
  },
  {
    severity: 'medium', tag: 'OPS',
    title: 'Instanced Siege of Orison',
    impact: 'Orison siege content moves into instances, changing traffic and risk around the Crusader corridor. Known PTU issues include elevator UI faults on instance transitions.',
    action: 'Re-check route risk on Crusader-side runs once live, and expect instance entry to eat muster time.',
    source: '4.10 PTU Wave 1 patch notes',
  },
  {
    severity: 'medium', tag: 'SALVAGE',
    title: '4.9 salvage and refining rebalance is now the live baseline',
    impact: 'RMC/CMR/CMS yields and terminal prices settled on 4.9 values. Any pricing anchored to 4.8 references is stale.',
    action: 'Confirm UEX cached data reads 4.9 and that catalogue prices were re-anchored after go-live.',
    source: '4.9 LIVE patch notes',
  },
  {
    severity: 'low', tag: 'CARGO',
    title: 'Wikelo updates · ordnance cargo holders',
    impact: 'Wikelo exchange terms shift in 4.10, and the 4.9 ordnance holders remain a handleable cargo class for recovered missiles and torpedoes.',
    action: 'Re-read Wikelo trade terms after the 4.10 transition; keep ordnance listed as its own ware category.',
    source: '4.10 PTU notes · 4.9 LIVE patch notes',
  },
];

export const CHECKLIST_SEED = [
  { check_key: 'p410_confirm_live',   group: 'BEFORE PATCH', label: 'Confirm 4.10 LIVE date and whether CIG announces a wipe (PTU ran LTP enabled)', priority: 'blocker' },
  { check_key: 'p410_export_ledger',  group: 'BEFORE PATCH', label: 'Export ledger & invoices (Sheets sync) for pre-patch records', priority: 'important' },
  { check_key: 'p410_pause_orders',   group: 'BEFORE PATCH', label: 'Pause storefront orders before servers go down', priority: 'important' },
  { check_key: 'p410_resync_uex',     group: 'PATCH DAY',    label: 'Re-sync UEX market data once it reports 4.10 prices', priority: 'blocker' },
  { check_key: 'p410_reprice',        group: 'PATCH DAY',    label: 'Re-anchor product prices to 4.10 market references', priority: 'blocker' },
  { check_key: 'p410_audit_stock',    group: 'PATCH DAY',    label: 'Run inventory audit — confirm what carried over under LTP', priority: 'blocker' },
  { check_key: 'p410_resume_orders',  group: 'AFTER PATCH',  label: 'Resume storefront orders with an updated public message', priority: 'blocker' },
  { check_key: 'p410_fuel_costs',     group: 'AFTER PATCH',  label: 'Re-cost freight handling after the hydrogen fuel balance pass', priority: 'polish' },
  { check_key: 'p410_battaglia',      group: 'AFTER PATCH',  label: 'Scout returning Recco Battaglia + Orison relief work as sourcing pipelines', priority: 'polish' },
  { check_key: 'p410_orison_risk',    group: 'AFTER PATCH',  label: 'Re-check Crusader route risk with Siege of Orison instanced', priority: 'polish' },
];