import React from 'react';
import FsisSeal from '@/components/brand/FsisSeal';
import { FSIS, OPERATOR, FOUNDING_STORY, CORE_VALUES, FLEET_REGISTRY, FLEET_NOTE, PRINCIPLES } from '@/lib/fsisLore';

export default function AboutFsis() {
  return (
    <section className="border p-6 space-y-6 relative overflow-hidden" style={{ borderColor: '#2A2118', background: '#121110' }}>
      {/* Watermark seal */}
      <div className="absolute -right-6 -top-6 opacity-20 rotate-12">
        <FsisSeal size={140} />
      </div>

      <div>
        <h3 className="font-mono text-xs tracking-[0.25em] mb-1" style={{ color: '#C8A05B' }}>// COMPANY DOSSIER</h3>
        <h2 className="font-mono text-lg font-bold" style={{ color: '#D8CFC0' }}>About {FSIS.name}</h2>
        <p className="text-xs font-mono mt-0.5" style={{ color: '#8A7E6C' }}>
          EST. {FSIS.founded} • {FSIS.hq} • {FSIS.license}
        </p>
      </div>

      <p className="text-xs font-mono leading-relaxed max-w-2xl" style={{ color: '#B8AC9A' }}>{FOUNDING_STORY}</p>

      {/* Operator file */}
      <div className="border p-3 max-w-2xl" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
        <h4 className="font-mono text-[10px] tracking-[0.25em] mb-2" style={{ color: '#8A7E6C' }}>// OPERATOR FILE</h4>
        <div className="space-y-1 font-mono text-[10px]" style={{ color: '#9C9080' }}>
          <div className="flex gap-3"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>HANDLE</span><span style={{ color: '#D8CFC0' }}>{OPERATOR.handle}</span></div>
          <div className="flex gap-3"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>ROLE</span><span>{OPERATOR.role}</span></div>
          <div className="flex gap-3"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>AFFILIATION</span><span>{OPERATOR.affiliation}</span></div>
          <div className="flex gap-3"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>TRADE</span><span>{OPERATOR.trade}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CORE_VALUES.map((v) => (
          <div key={v.title} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
            <div className="font-mono text-[10px] font-bold tracking-[0.15em]" style={{ color: '#E0A22E' }}>{v.title}</div>
            <p className="font-mono text-[10px] mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{v.text}</p>
          </div>
        ))}
      </div>

      {/* Operating principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRINCIPLES.map((p) => (
          <div key={p.ix} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
            <div className="font-mono text-[9px] tracking-[0.15em]" style={{ color: '#C8A05B' }}>{p.ix}</div>
            <div className="font-mono text-[10px] font-bold tracking-[0.1em] mt-0.5 uppercase" style={{ color: '#E0A22E' }}>{p.title}</div>
            <p className="font-mono text-[10px] mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{p.text}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-mono text-[10px] tracking-[0.25em] mb-2" style={{ color: '#8A7E6C' }}>// FLEET REGISTRY</h4>
        <p className="font-mono text-[10px] mb-2 leading-relaxed" style={{ color: '#9C9080' }}>{FLEET_NOTE}</p>
        <div className="space-y-1">
          {FLEET_REGISTRY.map((f) => (
            <div key={f.hull} className="flex items-center gap-3 font-mono text-[10px]" style={{ color: '#9C9080' }}>
              <span className="w-14 shrink-0" style={{ color: '#C8A05B' }}>{f.hull}</span>
              <span className="w-44 shrink-0 truncate">{f.ship} "{f.name}"</span>
              <span className="text-muted-foreground hidden sm:inline">{f.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}