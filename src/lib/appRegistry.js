// Central registry for all FSIS modules/apps
// To add a new app, import it and add to the APPS array
// Accent palette: warm metals + steel blues. Red/yellow/green reserved for status.

// ── SOLO PROPRIETOR MODE — cooperative apps sequestered until crew joins ──────
// Set status: 'offline' to hide from dock. 'coming-online' shows dimmed.
// Core solo workflow: management, salvage, ledger, orders, loot, performance, matdex, settings, about.

const APPS = [
  // ── ACTIVE — Solo proprietor core ──────────────────────────────────────────
  {
    id: 'management',
    name: 'Management',
    description: 'Admin console — storefront & operations',
    icon: 'Briefcase',
    status: 'active',
    color: 'hsl(0, 45%, 55%)', // command red
  },
  {
    id: 'salvage',
    name: 'Salvage',
    description: 'Salvage operations & market data',
    icon: 'Wrench',
    status: 'active',
    color: 'hsl(38, 75%, 52%)', // amber
  },
  {
    id: 'loot',
    name: 'Loot',
    description: 'Recovery, repair pipeline & resale',
    icon: 'Package2',
    status: 'active',
    color: 'hsl(20, 60%, 50%)', // rust copper
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Customer order desk & fulfillment',
    icon: 'ClipboardList',
    status: 'active',
    color: 'hsl(205, 45%, 55%)', // sky steel
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Income & operating costs',
    icon: 'BookOpen',
    status: 'active',
    color: 'hsl(220, 30%, 58%)', // slate blue
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Salvage volume & revenue analytics',
    icon: 'TrendingUp',
    status: 'active',
    color: 'hsl(160, 30%, 50%)', // verdigris
  },
  {
    id: 'matdex',
    name: 'MatDex',
    description: 'Materials & components index',
    icon: 'Database',
    status: 'active',
    color: 'hsl(45, 35%, 58%)', // brass
  },
  {
    id: 'routemap',
    name: 'Routemap',
    description: 'Jump paths to salvage terminals',
    icon: 'Map',
    status: 'active',
    color: 'hsl(210, 45%, 55%)', // steel blue
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System settings & integrations',
    icon: 'Settings',
    status: 'active',
    color: 'hsl(40, 18%, 55%)',
  },
  {
    id: 'about',
    name: 'About',
    description: 'System info & disclaimer',
    icon: 'Info',
    status: 'active',
    color: 'hsl(40, 18%, 65%)', // bone
  },

  // ── SEQUESTERED — Cooperative/crew features, offline until crew expands ─────
  {
    id: 'station',
    name: 'Station',
    description: 'Crew duty dashboard — sequestered',
    icon: 'MonitorDot',
    status: 'offline',
    color: 'hsl(38, 30%, 60%)',
  },
  {
    id: 'fairshare',
    name: 'FairShare',
    description: 'Crew payroll & work orders',
    icon: 'Coins',
    status: 'active',
    color: 'hsl(42, 60%, 50%)',
  },
  {
    id: 'contracts',
    name: 'Contracts',
    description: 'Jobs & agreements — sequestered',
    icon: 'FileText',
    status: 'offline',
    color: 'hsl(30, 45%, 45%)',
  },
  {
    id: 'comms',
    name: 'Comms',
    description: 'OD3ICA SRS relay — sequestered',
    icon: 'Radio',
    status: 'offline',
    color: 'hsl(18, 65%, 52%)',
  },
  {
    id: 'fabrication',
    name: 'Fabrication',
    description: 'Crafting & materials — sequestered',
    icon: 'Factory',
    status: 'offline',
    color: 'hsl(28, 70%, 48%)',
  },
  {
    id: 'cargo',
    name: 'Cargo',
    description: 'Cargo manifest & hauling — sequestered',
    icon: 'Package',
    status: 'offline',
    color: 'hsl(20, 60%, 50%)',
  },
];

export default APPS;