import React from 'react';
import { motion } from 'framer-motion';
import StoreTip from '@/components/store/StoreTip';
import { HelpCircle } from 'lucide-react';
import { CatalogSigil, OrdersSigil } from '@/components/brand/glyphs/DivisionSigils';
// ARCHIVED: JobsSigil, ReportSigil, DashboardSigil — sequestered for future operator development

// ARCHIVED TABS (operator features — sequestered for future development):
// { id: 'jobs',      label: 'JOBS',      icon: JobsSigil,      tip: 'Open contractor postings',            key: '4' },
// { id: 'dashboard', label: 'DASHBOARD', icon: DashboardSigil, tip: 'Inventory levels & revenue charts',   key: '5' },
// { id: 'report',    label: 'REPORT',    icon: ReportSigil,    tip: 'Weekly sales & cargo output summary', key: '6' },

const TABS = [
  { id: 'catalog', label: 'INVENTORY', icon: CatalogSigil, tip: 'Browse wares and add them to your manifest', key: '1', accent: '#8A8F45', dark: '#263E36' },
  { id: 'orders', label: 'ACTIVE ORDERS', icon: OrdersSigil, tip: 'Track current orders by code', key: '2', accent: '#C8893B', dark: '#5A3718' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, tip: 'Read purchase, delivery, and safety answers', key: '3', accent: '#A35A2A', dark: '#4A2A18' },
];

/** Storefront selector rail — bronze plate glides between sections instead of
 *  discrete buttons; active section gets a lit accent rail underneath. */
export default function StoreTabs({ active, onChange }) {
  return (
    <div
      className="relative flex gap-1 font-mono text-[10px] tracking-[0.15em] p-1 max-w-full overflow-x-auto"
      style={{ background: 'linear-gradient(180deg, #17120C, #0A0806)', border: '1px solid #5C4424', boxShadow: 'inset 0 1px 0 rgba(224,162,46,0.12), 0 12px 28px rgba(0,0,0,0.24)', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
    >
      {TABS.map(({ id, label, icon: Icon, tip, key, accent, dark }) => {
        const isActive = active === id;
        return (
          <StoreTip key={id} label={tip} shortcut={key}>
          <motion.button
            onClick={() => onChange(id)}
            whileHover={!isActive ? { color: '#B8AC9A', y: -1 } : {}}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="relative flex items-center gap-1.5 px-3 py-2 shrink-0"
            style={{ color: isActive ? '#F4ECDB' : '#6F6557' }}
          >
            {isActive && (
              <motion.span
                layoutId="store-tab-plate"
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(160deg, ${accent}, ${dark})`,
                  border: `1px solid ${accent}`,
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
                style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className="text-[7px] -mt-1.5" style={{ color: isActive ? accent : '#54493B' }}>{key}</span>
            </span>
          </motion.button>
          </StoreTip>
        );
      })}
    </div>
  );
}