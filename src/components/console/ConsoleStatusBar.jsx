import React, { useEffect, useState } from 'react';

/** Bottom deck strip — where you are, what the keys do, and station time. */
export default function ConsoleStatusBar({ groups, group, section }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="shrink-0 border-t px-3 py-1 flex items-center gap-3 text-[8px] tracking-[0.14em]"
      style={{ borderColor: '#2A2118', background: 'rgba(8,6,4,0.9)', color: '#5F564A' }}
    >
      <span style={{ color: '#8A8F45' }}>◈ {group.label} / {section.label}</span>
      <span className="hidden sm:inline">
        KEYS: {groups.map((g, i) => `${i + 1} ${g.label}`).join(' · ')}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7BA05B' }} />
        <span style={{ color: '#7A6E60' }}>DECK LIVE · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </span>
    </div>
  );
}