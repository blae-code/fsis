import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

const FAQ_SECTIONS = [
  { id: 'start', title: 'START HERE', items: [
    ['How do I use the storefront?', 'Browse the catalog, add wares to your manifest, choose a delivery location, enter your in-game handle, then hold the transmit control to place the order. No account is required.'],
    ['What should I do first?', 'Use Buyer Nav on the catalog: Buy Materials for salvage commodities, Book Logistics for services, Build Bulk Quote for larger orders, or Track Order if you already have a code.'],
    ['Do I need an account?', 'No. Your tracking code and private passphrase identify the order. If you are logged in, the order is also linked to your profile automatically.'],
  ]},
  { id: 'ordering', title: 'ORDERING', items: [
    ['How do I add items?', 'Open Catalog, find a ware, then use the crate/add control on the product card. Adjust quantities in the Order Manifest panel.'],
    ['What is the Bulk Quote builder?', 'Bulk Quote estimates large orders and volume discounts before loading the selected ware into your manifest. Final stock and route details are confirmed by FSIS.'],
    ['Is stock reserved right away?', 'Not permanently. The storefront caps visible quantities, then FSIS reviews availability before confirming fulfillment.'],
  ]},
  { id: 'handoff', title: 'PAYMENT & HANDOFF', items: [
    ['How do I pay?', 'All prices are in aUEC. Pay only in the in-game trade window at the handoff. Do not send aUEC outside the trade window.'],
    ['What is the passphrase?', 'Your passphrase proves you are the buyer at meetup. Keep it private until the handoff and use it to verify the exchange.'],
    ['How is delivery scheduled?', 'After confirmation, open My Orders and propose a handoff time, location, and contact route. FSIS confirms or suggests an alternative.'],
  ]},
  { id: 'tracking', title: 'TRACKING & HELP', items: [
    ['Where do I find my order?', 'Open My Orders. Saved tracking codes appear automatically on the same device, or you can paste a tracking code manually.'],
    ['Can I cancel?', 'You can cancel while the order is still NEW. After confirmation, use the order message thread and FSIS will review case-by-case.'],
    ['How do restock alerts work?', 'For out-of-stock wares, leave your handle and contact method. Email can be automated; Discord, Spectrum, and in-game contacts are followed up manually.'],
  ]},
];

const QUICK_LINKS = [
  { label: 'BROWSE CATALOG', tab: 'catalog' },
  { label: 'BUILD QUOTE', tab: 'quote' },
  { label: 'TRACK ORDER', tab: 'orders' },
  { label: 'ABOUT FSIS', tab: 'about' },
];

export default function StoreFaq({ onNavigate }) {
  const [active, setActive] = useState('start');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState('start-0');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sections = query ? FAQ_SECTIONS : FAQ_SECTIONS.filter((s) => s.id === active);
    return sections.map((s) => ({ ...s, items: s.items.filter(([question, answer]) => !q || `${question} ${answer}`.toLowerCase().includes(q)) })).filter((s) => s.items.length);
  }, [active, query]);

  return (
    <section className="max-w-4xl space-y-4 pb-6 font-mono">
      <div className="border p-4" style={{ borderColor: '#5C4424', background: '#12100C', clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)' }}>
        <p className="text-[9px] tracking-[0.3em]" style={{ color: '#6FA08F' }}>// VISITOR FAQ</p>
        <h2 className="text-lg font-bold tracking-[0.14em]" style={{ color: '#EDE5D6' }}>HOW TO SUCCESSFULLY USE FSIS</h2>
        <p className="text-[10px] mt-1 max-w-2xl leading-relaxed" style={{ color: '#9C9080' }}>Fast answers for browsing, ordering, tracking, payment, and in-game handoff.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {QUICK_LINKS.map((link) => (
            <button key={link.tab} type="button" onClick={() => onNavigate(link.tab)} className="border px-3 py-2 text-[9px] font-bold tracking-[0.14em] hover:brightness-125" style={{ borderColor: '#3A2F20', color: '#D8CFC0', background: '#0C0A07' }}>{link.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-44 shrink-0 space-y-2">
          {FAQ_SECTIONS.map((section) => (
            <button key={section.id} type="button" onClick={() => { setActive(section.id); setQuery(''); }} className="w-full border px-3 py-2 text-left text-[9px] font-bold tracking-[0.14em]" style={{ borderColor: active === section.id && !query ? '#B0793A' : '#2A2118', color: active === section.id && !query ? '#E0A22E' : '#8A7E6C', background: '#0E0C09' }}>{section.title}</button>
          ))}
        </div>

        <div className="flex-1 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A7E6C' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FAQ..." className="w-full h-9 pl-9 pr-3 text-xs bg-transparent border outline-none" style={{ borderColor: '#3A2F20', color: '#D8CFC0', background: '#0E0C09' }} />
          </div>

          {visible.length === 0 ? <p className="text-[10px]" style={{ color: '#8A7E6C' }}>No FAQ entries match that search.</p> : visible.map((section) => (
            <div key={section.id} className="space-y-2">
              {query && <h3 className="text-[9px] tracking-[0.22em]" style={{ color: '#6FA08F' }}>{section.title}</h3>}
              {section.items.map(([question, answer], idx) => {
                const key = `${section.id}-${idx}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border" style={{ borderColor: isOpen ? '#5C4424' : '#2A2118', background: '#0E0C09' }}>
                    <button type="button" onClick={() => setOpen(isOpen ? '' : key)} className="w-full flex items-center justify-between gap-3 p-3 text-left">
                      <span className="text-[10px] font-bold" style={{ color: isOpen ? '#E0A22E' : '#D8CFC0' }}>{question}</span>
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown className="w-3.5 h-3.5" style={{ color: '#6B6155' }} /></motion.span>
                    </button>
                    <AnimatePresence initial={false}>{isOpen && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-3 pb-3 text-[10px] leading-relaxed" style={{ color: '#9C9080' }}>{answer}</motion.p>}</AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}