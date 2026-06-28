import React from 'react';
import { CheckCircle2, CircleDot, Flag, MapPin, PackageCheck, XCircle } from 'lucide-react';

const stages = ['planned', 'accepted', 'loaded', 'delivered'];
const icons = { planned: CircleDot, accepted: Flag, loaded: PackageCheck, delivered: CheckCircle2, cancelled: XCircle };
const colors = { planned: '#8A7E6C', accepted: '#E0A22E', loaded: '#C8893B', delivered: '#8A8F45', cancelled: '#C05050' };

function pct(status) {
  if (status === 'cancelled') return 100;
  return ((Math.max(0, stages.indexOf(status || 'planned')) + 1) / stages.length) * 100;
}

export default function FreightMissionTimeline({ missions = [] }) {
  if (!missions.length) return null;
  return <div className="border p-3 space-y-3" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><p className="text-[9px] tracking-[0.18em]" style={{ color: '#8A8F45' }}>VISUAL MISSION TIMELINE</p>{missions.map((m)=><div key={m.id} className="space-y-1"><div className="flex items-center gap-2 text-[10px]"><b style={{ color:'#E0A22E' }}>#{m.chain_position}</b><MapPin className="w-3 h-3" style={{ color:'#8A6430' }}/><span className="flex-1" style={{ color:'#D8CFC0' }}>{m.origin} → {m.destination}</span><span style={{ color: colors[m.status || 'planned'] }}>{(m.status || 'planned').toUpperCase()}</span></div><div className="relative h-2 border" style={{ borderColor:'#2A2118', background:'#080604' }}><div className="absolute inset-y-0 left-0" style={{ width:`${pct(m.status)}%`, background:`linear-gradient(90deg, ${colors[m.status || 'planned']}, rgba(224,162,46,0.25))` }}/></div><div className="grid grid-cols-4 text-[8px] tracking-[0.12em]">{stages.map((s)=>{ const Icon = icons[s]; const active = stages.indexOf(s) <= stages.indexOf(m.status || 'planned'); return <span key={s} style={{ color: active ? colors[s] : '#4A4036' }}><Icon className="w-3 h-3 inline mr-1"/>{s.toUpperCase()}</span>; })}</div></div>)}</div>;
}