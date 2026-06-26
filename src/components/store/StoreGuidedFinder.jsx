import React from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Truck, ClipboardList } from 'lucide-react';

const OPTIONS = [
  { key: 'materials', icon: Package, label: 'BUY MATERIALS', sub: 'RMC / CMR / CMS', action: 'salvage_commodity' },
  { key: 'loot', icon: Package, label: 'BROWSE LOOT', sub: 'Gear, weapons, components', action: 'loot' },
  { key: 'services', icon: Truck, label: 'BOOK LOGISTICS', sub: 'Delivery & service work', action: 'service' },
  { key: 'quote', icon: Search, label: 'BUILD BULK QUOTE', sub: 'Estimate larger loads', action: 'quote' },
  { key: 'orders', icon: ClipboardList, label: 'TRACK ORDER', sub: 'Use saved or manual code', action: 'orders' },
];

export default function StoreGuidedFinder({ onChoose }) {
  return (
    <div className="border p-3 font-mono" style={{ borderColor: '#2A2118', background: 'linear-gradient(135deg, rgba(17,14,10,0.92), rgba(10,8,6,0.86))', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <p className="text-[9px] tracking-[0.28em]" style={{ color: '#6FA08F' }}>// BUYER NAV</p>
          <h3 className="text-xs font-bold tracking-[0.18em]" style={{ color: '#EDE5D6' }}>WHAT DO YOU NEED TODAY?</h3>
        </div>
        <p className="text-[9px] max-w-md" style={{ color: '#7A6E60' }}>Choose a path and FSIS will focus the storefront for that task.</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
        {OPTIONS.map(({ key, icon: Icon, label, sub, action }) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => onChoose(action)}
            whileHover={{ y: -2, borderColor: '#8A6430' }}
            whileTap={{ scale: 0.98 }}
            className="text-left border p-2.5 transition-colors"
            style={{ borderColor: '#3A2F20', background: '#0C0A07', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: '#E0A22E' }} />
              <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: '#D8CFC0' }}>{label}</span>
            </div>
            <p className="text-[8px]" style={{ color: '#6B6155' }}>{sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}