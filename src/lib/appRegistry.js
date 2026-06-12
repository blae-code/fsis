// Central registry for all FSIS modules/apps
// To add a new app, import it and add to the APPS array
// Accent palette: warm metals + steel blues. Red/yellow/green reserved for status.

const APPS = [
  {
    id: 'salvage',
    name: 'Salvage',
    description: 'Salvage operations & inventory',
    icon: 'Wrench',
    status: 'coming-online', // 'active' | 'coming-online' | 'offline'
    color: 'hsl(38, 75%, 52%)', // amber
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
    id: 'cargo',
    name: 'Cargo',
    description: 'Cargo manifest & hauling',
    icon: 'Package',
    status: 'coming-online',
    color: 'hsl(20, 60%, 50%)', // rust copper
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
    id: 'contracts',
    name: 'Contracts',
    description: 'Jobs & agreements',
    icon: 'FileText',
    status: 'active',
    color: 'hsl(30, 45%, 45%)', // bronze
  },
  {
    id: 'fairshare',
    name: 'FairShare',
    description: 'Crew payroll & work orders',
    icon: 'Coins',
    status: 'active',
    color: 'hsl(42, 60%, 50%)', // gold
  },
  {
    id: 'comms',
    name: 'Comms',
    description: 'OD3ICA SRS relay & net plan',
    icon: 'Radio',
    status: 'active',
    color: 'hsl(18, 65%, 52%)', // burnt orange
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
    id: 'fabrication',
    name: 'Fabrication',
    description: 'Crafting recipes & material planning',
    icon: 'Factory',
    status: 'active',
    color: 'hsl(28, 70%, 48%)', // copper
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
    id: 'about',
    name: 'About',
    description: 'System info & disclaimer',
    icon: 'Info',
    status: 'active',
    color: 'hsl(40, 18%, 65%)', // bone
  },
];

export default APPS;