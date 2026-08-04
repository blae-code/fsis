import React, { useState } from 'react';
import ConsoleGroupRail from '@/components/console/ConsoleGroupRail';
import ConsoleSectionTabs from '@/components/console/ConsoleSectionTabs';

/**
 * The council console deck — one fixed-viewport shell shared by every management
 * space, built to the storefront's standard: group rail on the left, section
 * tabs on top, and only the working pane scrolls.
 */
export default function ConsoleShell({ groups, header }) {
  const [activeGroup, setActiveGroup] = useState(groups[0].id);
  // Remember where you were in each group, so switching rooms doesn't lose your place
  const [sectionByGroup, setSectionByGroup] = useState({});

  const group = groups.find((g) => g.id === activeGroup) || groups[0];
  const activeSection = sectionByGroup[group.id] || group.sections[0].id;
  const section = group.sections.find((s) => s.id === activeSection) || group.sections[0];

  return (
    <div
      className="h-full flex flex-col font-mono overflow-hidden"
      style={{ background: '#080604', backgroundImage: 'radial-gradient(circle at 12% 8%, rgba(224,162,46,0.10), transparent 23%), radial-gradient(circle at 82% 18%, rgba(138,100,48,0.10), transparent 25%), linear-gradient(135deg, rgba(8,6,4,0.96), rgba(18,13,8,0.98) 42%, rgba(10,8,6,0.96))' }}
    >
      {header}
      <div className="flex-1 min-h-0 flex">
        <ConsoleGroupRail groups={groups} active={group.id} onChange={setActiveGroup} />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="shrink-0 px-4 pt-2 pb-1 flex items-baseline gap-3 border-b" style={{ borderColor: '#1E1810' }}>
            <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: '#EDE5D6' }}>{group.label}</span>
            <span className="text-[8px] tracking-[0.08em] truncate" style={{ color: '#7A6E60' }}>{group.blurb}</span>
          </div>
          <ConsoleSectionTabs group={group} active={section.id} onChange={(id) => setSectionByGroup((m) => ({ ...m, [group.id]: id }))} />
          <div className={`flex-1 min-h-0 overflow-y-auto ${section.bare ? '' : 'p-4'}`}>
            {section.render()}
          </div>
        </div>
      </div>
    </div>
  );
}