import React from 'react';
import { motion } from 'framer-motion';
import StoreTip from '@/components/store/StoreTip';
import { CatalogSigil, QuoteSigil, OrdersSigil, JobsSigil, AboutSigil } from '@/components/brand/glyphs/DivisionSigils';

const TABS = [
  { id: 'catalog', label: 'CATALOG', icon: CatalogSigil, tip: 'Browse wares & add to manifest', key: '1' },
  { id: 'quote', label: 'BULK QUOTE', icon: QuoteSigil, tip: 'Build a bulk pricing estimate', key: '2' },
  { id: 'orders', label: 'MY ORDERS', icon: OrdersSigil, tip: 'Track orders by code', key: '3' },
  { id: 'jobs', label: 'JOBS', icon: JobsSigil, tip: 'Open contractor postings', key: '4' },
  { id: 'about', label: 'ABOUT FSIS', icon: AboutSigil, tip: 'Company dossier & system status', key: '5' },
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
            style={{ color: isActive ? '#F4ECDB' : '#6F6557' }}
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
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className="text-[7px] -mt-1.5" style={{ color: isActive ? '#E0A22E' : '#54493B' }}>{key}</span>
            </span>
          </button>
          </StoreTip>
        );
      })}
    </div>
  );
}