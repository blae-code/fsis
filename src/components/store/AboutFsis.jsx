import React from 'react';
import FsisSeal from '@/components/brand/FsisSeal';
import { FSIS, FOUNDING_STORY, CORE_VALUES, FLEET_REGISTRY } from '@/lib/fsisLore';

export default function AboutFsis() {
  return (
    <section className="rounded-lg border xian-panel p-6 space-y-6 relative overflow-hidden">
      {/* Watermark seal */}
      <div className="absolute -right-6 -top-6 opacity-20 rotate-12">
        <FsisSeal size={140} />
      </div>

      <div>
        <h3 className="font-mono text-xs tracking-[0.25em] text-primary mb-1">// COMPANY DOSSIER</h3>
        <h2 className="font-mono text-lg font-bold text-foreground">About {FSIS.name}</h2>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          EST. {FSIS.founded} • {FSIS.hq} • {FSIS.license}
        </p>
      </div>

      <p className="text-xs font-mono text-foreground/70 leading-relaxed max-w-2xl">{FOUNDING_STORY}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CORE_VALUES.map((v) => (
          <div key={v.title} className="rounded border p-3" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 6%)' }}>
            <div className="font-mono text-[10px] font-bold text-primary tracking-[0.15em]">{v.title}</div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1 leading-relaxed">{v.text}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-2">// FLEET REGISTRY</h4>
        <div className="space-y-1">
          {FLEET_REGISTRY.map((f) => (
            <div key={f.hull} className="flex items-center gap-3 font-mono text-[10px] text-foreground/60">
              <span className="text-primary w-14 shrink-0">{f.hull}</span>
              <span className="w-44 shrink-0 truncate">{f.ship} "{f.name}"</span>
              <span className="text-muted-foreground hidden sm:inline">{f.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}