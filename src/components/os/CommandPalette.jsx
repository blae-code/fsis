import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useWindows } from '@/lib/windowContext.jsx';
import { resolveAppContent } from '@/lib/resolveAppContent.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const COMMANDS = [
  { id: 'salvage',     label: 'Open Salvage',        category: 'APP',   appId: 'salvage' },
  { id: 'orders',      label: 'Open Orders Desk',    category: 'APP',   appId: 'orders' },
  { id: 'ledger',      label: 'Open Ledger',         category: 'APP',   appId: 'ledger' },
  { id: 'fairshare',   label: 'Open FairShare',      category: 'APP',   appId: 'fairshare' },
  { id: 'loot',        label: 'Open Loot Tracker',   category: 'APP',   appId: 'loot' },
  { id: 'performance', label: 'Open Performance',    category: 'APP',   appId: 'performance' },
  { id: 'station',     label: 'Open My Station',     category: 'APP',   appId: 'station' },
  { id: 'management',  label: 'Open Management',     category: 'APP',   appId: 'management' },
  { id: 'settings',    label: 'Open Settings',       category: 'APP',   appId: 'settings' },
  { id: 'comms',       label: 'Open Comms',          category: 'APP',   appId: 'comms' },
  { id: 'matdex',      label: 'Open MatDex',         category: 'APP',   appId: 'matdex' },
  { id: 'routemap',    label: 'Open Route Map',      category: 'APP',   appId: 'routemap' },
  { id: 'storefront',  label: 'Go to Storefront',    category: 'NAV',   href: '/' },
  { id: 'ops',         label: 'Go to Operator Terminal', category: 'NAV', href: '/ops' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const { openWindow } = useWindows();

  const { data: products = [] } = useQuery({
    queryKey: ['products_cmd'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order', 50),
    enabled: open,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders_cmd'],
    queryFn: () => base44.entities.order.list('-created_date', 20),
    enabled: open,
  });

  const dynamicCommands = [
    ...products.map(p => ({ id: `prod_${p.id}`, label: p.product_name, sub: `${p.price_auec?.toLocaleString()} aUEC · ${p.stock || 0} ${p.unit || 'SCU'} stock`, category: 'PRODUCT', appId: 'salvage' })),
    ...orders.map(o => ({ id: `ord_${o.id}`, label: `Order #${o.tracking_code || o.id.slice(-6).toUpperCase()}`, sub: `${o.customer_handle} · ${o.status?.toUpperCase()}`, category: 'ORDER', appId: 'orders' })),
  ];

  const all = [...COMMANDS, ...dynamicCommands];

  const filtered = query.trim()
    ? all.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.sub?.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS.slice(0, 8);

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => { if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const execute = useCallback((cmd) => {
    if (cmd.href) { window.location.href = cmd.href; onClose(); return; }
    if (cmd.appId) {
      const fake = { id: cmd.appId, name: cmd.appId };
      const { title, content } = resolveAppContent(fake);
      openWindow(cmd.appId, title, content);
      onClose();
    }
  }, [openWindow, onClose]);

  const onKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected]);
    if (e.key === 'Escape') onClose();
  }, [filtered, selected, execute, onClose]);

  const CAT_COLOR = { APP: '#E0A22E', NAV: '#6FA08F', PRODUCT: '#6FA0C8', ORDER: '#C8893B' };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[900]" style={{ background: 'rgba(8,6,4,0.7)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-[901] font-mono"
            style={{ top: '18vh', left: '50%', width: 'min(600px, 92vw)', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div style={{ background: '#0E0B08', border: '1px solid #3A2E1E', boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(224,162,46,0.08)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)' }}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#2A2118' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: '#E0A22E' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Search apps, products, orders…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: '#EDE5D6', caretColor: '#E0A22E' }}
                />
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px]" style={{ background: '#1A1510', border: '1px solid #3A2E1E', color: '#7A6E60' }}>ESC</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[380px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-[11px] text-center" style={{ color: '#5A4E40' }}>No results for "{query}"</p>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{ background: i === selected ? '#1A1510' : 'transparent', borderLeft: i === selected ? '2px solid #E0A22E' : '2px solid transparent' }}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => execute(cmd)}
                    >
                      <span className="text-[8px] font-bold tracking-[0.15em] w-16 shrink-0" style={{ color: CAT_COLOR[cmd.category] || '#7A6E60' }}>{cmd.category}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px]" style={{ color: i === selected ? '#F2EADC' : '#C8BFB0' }}>{cmd.label}</div>
                        {cmd.sub && <div className="text-[9px] truncate" style={{ color: '#5A4E40' }}>{cmd.sub}</div>}
                      </div>
                      {i === selected && <span className="text-[9px]" style={{ color: '#5A4E40' }}>↵</span>}
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t flex items-center gap-4 text-[9px]" style={{ borderColor: '#1A1510', color: '#3A2E1E' }}>
                <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
                <span className="ml-auto">⌘K · CTRL+K</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}