import React from 'react';
import { Package, ClipboardList, Info, Calculator } from 'lucide-react';

const TABS = [
  { id: 'catalog', label: 'CATALOG', icon: Package },
  { id: 'quote', label: 'BULK QUOTE', icon: Calculator },
  { id: 'orders', label: 'MY ORDERS', icon: ClipboardList },
  { id: 'about', label: 'ABOUT FSIS', icon: Info },
];

/** Storefront section tab bar — bronze command deck style */
export default function StoreTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 font-mono text-[10px] tracking-[0.15em]">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5 px-3 py-2 transition-colors"
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
              background: isActive ? 'linear-gradient(160deg, #8A6430, #4A3722)' : '#161310',
              color: isActive ? '#F0E6D2' : '#8A7E6C',
              border: `1px solid ${isActive ? '#B0793A' : '#2A2118'}`,
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        );
      })}
    </div>
  );
}