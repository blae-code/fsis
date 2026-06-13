import React from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Info, Calculator, Briefcase } from 'lucide-react';
import StoreTip from '@/components/store/StoreTip';

const TABS = [
  { id: 'catalog', label: 'CATALOG', icon: Package, tip: 'Browse wares & add to manifest', key: '1' },
  { id: 'quote', label: 'BULK QUOTE', icon: Calculator, tip: 'Build a bulk pricing estimate', key: '2' },
  { id: 'orders', label: 'MY ORDERS', icon: ClipboardList, tip: 'Track orders by code', key: '3' },
  { id: 'jobs', label: 'JOBS', icon: Briefcase, tip: 'Open contractor postings', key: '4' },
  { id: 'about', label: 'ABOUT FSIS', icon: Info, tip: 'Company dossier & system status', key: '5' },
];

/** Storefront selector rail — bronze plate glides between sections instead of
 *  discrete buttons; active section gets a lit accent rail underneath. */
export default function StoreTabs({ active, onChange }) {
  return (
    <div
      className="relative flex gap-0.5 font-mono text-[10px] tracking-[0.15em] p-0.5"
      style={{ background: '#0E0C0A', border: '1px solid #2A2118', clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}
    >
      {TABS.map(({ id, label, icon: Icon, tip, key }) => {
        const isActive = active === id;
        return (
          <StoreTip key={id} label={tip} shortcut={key}>
          <button
            onClick={() => onChange(id)}
            className="relative flex items-center gap-1.5 px-3 py-2 transition-colors"
            style={{ color: isActive ? '#F0E6D2' : '#8A7E6C' }}
          >
            {isActive && (
              <motion.span
                layoutId="store-tab-plate"
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(160deg, #8A6430, #4A3722)',
                  border: '1px solid #B0793A',
                  clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
                  boxShadow: '0 0 14px rgba(212, 146, 11, 0.25)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {isActive && (
              <motion.span
                layoutId="store-tab-rail"
                className="absolute -bottom-px left-2 right-2 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, #E0A22E, transparent)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Icon className="w-3 h-3" />
              {label}
            </span>
          </button>
          </StoreTip>
        );
      })}
    </div>
  );
}