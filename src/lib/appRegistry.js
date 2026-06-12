// Central registry for all FSIS modules/apps
// To add a new app, import it and add to the APPS array

const APPS = [
  {
    id: 'salvage',
    name: 'Salvage',
    description: 'Salvage operations & inventory',
    icon: 'Wrench',
    status: 'coming-online', // 'active' | 'coming-online' | 'offline'
    color: 'hsl(168, 65%, 45%)',
  },
  {
    id: 'cargo',
    name: 'Cargo',
    description: 'Cargo manifest & hauling',
    icon: 'Package',
    status: 'coming-online',
    color: 'hsl(155, 50%, 35%)',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Income & operating costs',
    icon: 'BookOpen',
    status: 'active',
    color: 'hsl(180, 40%, 30%)',
  },
  {
    id: 'contracts',
    name: 'Contracts',
    description: 'Jobs & agreements',
    icon: 'FileText',
    status: 'coming-online',
    color: 'hsl(145, 45%, 40%)',
  },
  {
    id: 'comms',
    name: 'Comms',
    description: 'OD3ICA SRS relay & net plan',
    icon: 'Radio',
    status: 'active',
    color: 'hsl(190, 50%, 35%)',
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Customer order desk & fulfillment',
    icon: 'ClipboardList',
    status: 'active',
    color: 'hsl(190, 55%, 45%)',
  },
  {
    id: 'fabrication',
    name: 'Fabrication',
    description: 'Crafting recipes & material planning',
    icon: 'Factory',
    status: 'active',
    color: 'hsl(35, 60%, 45%)',
  },
  {
    id: 'about',
    name: 'About',
    description: 'System info & disclaimer',
    icon: 'Info',
    status: 'active',
    color: 'hsl(170, 30%, 40%)',
  },
];

export default APPS;