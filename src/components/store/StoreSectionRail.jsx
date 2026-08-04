import React from 'react';
import { Link } from 'react-router-dom';

const DECKS = [
  { id: 'council', label: 'COUNCIL DECK', accent: '#C8893B' },
  { id: 'intel', label: 'INTEL DECK', accent: '#6FA0C8' },
];

const SECTIONS = [
  { id: 'catalog', label: 'INVENTORY', key: '1', accent: '#8A8F45' },
  { id: 'orders', label: 'ACTIVE ORDERS', key: '2', accent: '#C8893B' },
  { id: 'faq', label: 'FAQ', key: '3', accent: '#A35A2A' },
  { id: 'join', label: 'WORK WITH US', key: '4', accent: '#6FA0C8' },
];

const RailButton = ({ label, keyHint, accent, active, onClick, to }) => {
  const inner = (
    <span
      className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[9px] tracking-[0.22em]"
      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
    >
      {label}
      {keyHint && <span className="text-[7px]" style={{ color: active ? accent : '#54493B' }}>{keyHint}</span>}
    </span>
  );
  const style = {
    color: active ? '#F4ECDB' : '#6F6557',
    borderColor: active ? accent : '#2A2118',
    background: active ? `linear-gradient(180deg, ${accent}33, rgba(10,8,6,0.9))` : 'rgba(10,8,6,0.72)',
    boxShadow: active ? `inset 2px 0 0 ${accent}` : 'none',
  };
  const cls = 'flex items-center justify-center py-4 border w-full transition-colors';
  return to
    ? <Link to={to} className={cls} style={style}>{inner}</Link>
    : <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>;
};

/** Left vertical navigation rail — matches the hall and labour board chrome. */
export default function StoreSectionRail({ active, onChange, onOpenIntel, isProprietor }) {
  return (
    <nav className="hidden lg:flex flex-col gap-1.5 w-[42px] shrink-0 overflow-y-auto">
      {isProprietor && <RailButton {...DECKS[0]} accent={DECKS[0].accent} to="/ops" />}
      <RailButton label={DECKS[1].label} accent={DECKS[1].accent} onClick={onOpenIntel} />
      <div className="h-2" />
      {SECTIONS.map((s) => (
        <RailButton
          key={s.id}
          label={s.label}
          keyHint={s.key}
          accent={s.accent}
          active={active === s.id}
          onClick={() => onChange(s.id)}
        />
      ))}
    </nav>
  );
}