import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsoleGroupRail from '@/components/console/ConsoleGroupRail';
import ConsoleSectionTabs from '@/components/console/ConsoleSectionTabs';
import ConsoleStatusBar from '@/components/console/ConsoleStatusBar';
import ConsoleRoom from '@/components/console/ConsoleRoom';

/**
 * The council console deck — one fixed-viewport shell shared by every management
 * space, built to the storefront's standard: group rail on the left, section
 * tabs on top, only the working pane scrolls, and the whole deck answers the
 * keyboard: 1–5 switch rooms, [ and ] walk the sections of the room you're in.
 */
export default function ConsoleShell({ groups, header }) {
  const [activeGroup, setActiveGroup] = useState(groups[0].id);
  // Remember where you were in each group, so switching rooms doesn't lose your place
  const [sectionByGroup, setSectionByGroup] = useState({});

  const group = groups.find((g) => g.id === activeGroup) || groups[0];
  const activeSection = sectionByGroup[group.id] || group.sections[0].id;
  const section = group.sections.find((s) => s.id === activeSection) || group.sections[0];
  const setSection = (id) => setSectionByGroup((m) => ({ ...m, [group.id]: id }));

  // Deck keyboard: 1–5 rooms, [ / ] cycle sections — never while typing
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      const n = Number(e.key);
      if (n >= 1 && n <= groups.length) { setActiveGroup(groups[n - 1].id); return; }
      if (e.key === '[' || e.key === ']') {
        const idx = group.sections.findIndex((s) => s.id === section.id);
        const next = (idx + (e.key === ']' ? 1 : -1) + group.sections.length) % group.sections.length;
        setSection(group.sections[next].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [groups, group, section]);

  return (
    <div
      className="h-full flex flex-col font-mono overflow-hidden"
      style={{ background: '#080604', backgroundImage: 'radial-gradient(circle at 12% 8%, rgba(224,162,46,0.10), transparent 23%), radial-gradient(circle at 82% 18%, rgba(138,100,48,0.10), transparent 25%), radial-gradient(circle at 70% 90%, rgba(92,68,36,0.12), transparent 30%), linear-gradient(135deg, rgba(8,6,4,0.96), rgba(18,13,8,0.98) 42%, rgba(10,8,6,0.96))' }}
    >
      {header}
      <div className="shrink-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #E0A22E, #8A8F45, transparent)' }} />
      <div className="flex-1 min-h-0 flex">
        <ConsoleGroupRail groups={groups} active={group.id} onChange={setActiveGroup} />
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Room masthead — storefront hero-strip treatment */}
          <div
            className="shrink-0 mx-3 mt-2 px-3 py-1.5 border flex items-baseline gap-3 relative overflow-hidden"
            style={{ borderColor: '#3A2F20', background: 'linear-gradient(90deg, rgba(20,15,9,0.9), rgba(12,9,6,0.85))', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <span className="text-[10px] font-bold tracking-[0.28em]" style={{ color: '#EDE5D6' }}>{group.label}</span>
            <span className="text-[8px] tracking-[0.08em] truncate" style={{ color: '#8A7E6C' }}>{group.blurb}</span>
            <span className="ml-auto hidden md:block text-[8px] tracking-[0.14em]" style={{ color: '#5F564A' }}>
              {group.sections.length} SECTIONS · [ ] TO WALK THEM
            </span>
          </div>
          <ConsoleSectionTabs group={group} active={section.id} onChange={setSection} />
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${group.id}:${section.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={`absolute inset-0 ${section.bare ? '' : 'overflow-hidden'}`}
              >
                <ConsoleRoom group={group} section={section} />
              </motion.div>
            </AnimatePresence>
          </div>
          <ConsoleStatusBar groups={groups} group={group} section={section} />
        </div>
      </div>
    </div>
  );
}