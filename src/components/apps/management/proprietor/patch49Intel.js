// Alpha 4.9 go-live intelligence — compiled from the official roadmap,
// ISC patch report, PTU patch notes, and community wipe trackers (July 2026).
export const PATCH_VERSION = '4.9';
export const PATCH_PHASE = 'patch_4.9';

export const INTEL = [
  {
    severity: 'high', tag: 'ECONOMY',
    title: 'No full wipe — but consumables & cargo reset expected',
    impact: 'aUEC and reputation persist, but stored consumables, cargo, and mined/refined goods are expected to reset. Physical RMC/CMR/CMS stock may vanish at go-live.',
    action: 'Sell down salvage stock before patch; run an inventory audit and zero out wiped stock immediately after.',
    source: 'CIG confirmation · SC Focus wipe tracker',
  },
  {
    severity: 'high', tag: 'SALVAGE',
    title: 'Salvage rework & refining rebalance',
    impact: 'Salvage output and refining returns are being rebalanced — PTU testing showed shifted RMC/CM yields and terminal prices.',
    action: 'Re-sync UEX market data after go-live, then re-anchor all product prices to fresh 4.9 references.',
    source: '4.9 PTU patch notes · salvage community testing',
  },
  {
    severity: 'medium', tag: 'LOGISTICS',
    title: 'Quantum fuel rebalance (partially reverted in PTU)',
    impact: 'Fuel consumption greatly reduced — delivery and handling costs per freight run will drop.',
    action: 'Review freight plan handling costs and delivery pricing assumptions once live.',
    source: '4.9 PTU patch notes',
  },
  {
    severity: 'medium', tag: 'REVENUE',
    title: '"Support the Miners" mission pack — Recco Battaglia (Levski)',
    impact: 'New repeatable contracts including salvage, recovery, and ship reclamation — a fresh sourcing pipeline for FSIS stock, with reputation unlocks continuing into 4.10.',
    action: 'Plan intake capacity for reclamation loot and track new commodity flows after launch.',
    source: 'Official 4.9 roadmap · ISC patch report',
  },
  {
    severity: 'low', tag: 'CARGO',
    title: 'Ordnance cargo holders',
    impact: 'Dedicated storage frames for missiles, torpedoes, and bombs on cargo grids — a new handleable cargo class.',
    action: 'Evaluate listing recovered ordnance as a new ware category if it proves sellable.',
    source: 'Official 4.9 roadmap',
  },
  {
    severity: 'low', tag: 'OPS',
    title: 'Combat, boarding, and Valakkar behavior updates',
    impact: 'New hit markers, ship boarding missions, and more aggressive Valakkar — route risk profiles may shift near contested zones.',
    action: 'Re-check high-risk route warnings once live data comes in.',
    source: 'ISC 4.9 patch report',
  },
];

export const CHECKLIST_SEED = [
  { check_key: 'p49_pause_orders',  group: 'BEFORE PATCH', label: 'Pause storefront orders before servers go down', priority: 'blocker' },
  { check_key: 'p49_sell_down',     group: 'BEFORE PATCH', label: 'Sell down / deliver physical salvage stock ahead of the cargo reset', priority: 'important' },
  { check_key: 'p49_export_ledger', group: 'BEFORE PATCH', label: 'Export ledger & invoices (Sheets sync) for pre-patch records', priority: 'important' },
  { check_key: 'p49_resync_uex',    group: 'PATCH DAY',    label: 'Re-sync UEX market data on 4.9 prices', priority: 'blocker' },
  { check_key: 'p49_reprice',       group: 'PATCH DAY',    label: 'Re-anchor product prices to 4.9 market references', priority: 'blocker' },
  { check_key: 'p49_audit_stock',   group: 'PATCH DAY',    label: 'Run inventory audit — zero out wiped cargo, confirm surviving stock', priority: 'blocker' },
  { check_key: 'p49_resume_orders', group: 'AFTER PATCH',  label: 'Resume storefront orders with an updated public message', priority: 'blocker' },
  { check_key: 'p49_freight_costs', group: 'AFTER PATCH',  label: 'Review freight handling costs after the fuel rebalance', priority: 'polish' },
  { check_key: 'p49_recco_missions',group: 'AFTER PATCH',  label: 'Scout Recco Battaglia salvage/reclamation contracts as a sourcing pipeline', priority: 'polish' },
];