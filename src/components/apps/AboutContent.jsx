import React from 'react';
import { Shield, Heart } from 'lucide-react';
import FsisLogo from '@/components/brand/FsisLogo';
import FsisSeal from '@/components/brand/FsisSeal';
import SerialStrip from '@/components/brand/SerialStrip';
import { FSIS, OPERATOR, FOUNDING_STORY, FLEET_REGISTRY, FLEET_NOTE, CORE_VALUES, PRINCIPLES } from '@/lib/fsisLore';

export default function AboutContent() {
  return (
    <div className="h-full font-mono text-xs space-y-6 max-w-lg mx-auto py-4 overflow-auto">
      {/* Brand header */}
      <div className="flex items-center justify-between">
        <FsisLogo size={44} withWordmark glow />
        <FsisSeal size={64} />
      </div>
      <SerialStrip seed={FSIS.license} label={FSIS.license} />

      {/* System info */}
      <div className="space-y-3">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          System Information
        </h2>
        <div className="space-y-1.5 text-foreground/60">
          <div className="flex justify-between">
            <span className="text-muted-foreground">System</span>
            <span>FSIS — {FSIS.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>3.14.7-alpha</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Founded</span>
            <span>{FSIS.founded}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operator</span>
            <span>{OPERATOR.handle} — {OPERATOR.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Org</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary/50" />
              {FSIS.org}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pricing</span>
            <span>Orgmate preferential rates active</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/30" />

      {/* Founding story */}
      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          Company Dossier
        </h2>
        <p className="text-foreground/50 leading-relaxed">{FOUNDING_STORY}</p>
      </div>

      <div className="h-px bg-border/30" />

      {/* Core values */}
      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          FairShare Promise
        </h2>
        {CORE_VALUES.map((v) => (
          <div key={v.title}>
            <span className="text-primary/70 font-semibold">{v.title}</span>
            <span className="text-foreground/50"> — {v.text}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/30" />

      {/* Operating principles */}
      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          Operating Principles
        </h2>
        {PRINCIPLES.map((p) => (
          <div key={p.ix}>
            <span className="text-primary/50 mr-2">{p.ix}</span>
            <span className="text-primary/70 font-semibold uppercase">{p.title}</span>
            <span className="text-foreground/50"> — {p.text}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/30" />

      {/* Fleet registry */}
      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          Fleet Registry
        </h2>
        <p className="text-foreground/40 text-[10px] leading-relaxed">{FLEET_NOTE}</p>
        <div className="space-y-1 text-foreground/50">
          {FLEET_REGISTRY.map((f) => (
            <div key={f.hull} className="flex items-center gap-2">
              <span className="text-primary/60 w-14 shrink-0">{f.hull}</span>
              <span className="flex-1 truncate">{f.ship} "{f.name}"</span>
              <span className="text-muted-foreground/60 text-[10px]">{f.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border/30" />

      {/* Disclaimer */}
      <div className="space-y-2 p-3 rounded border border-border/20 bg-muted/20">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          <span className="text-muted-foreground/70 font-semibold">DISCLAIMER:</span>{' '}
          This is an unofficial Star Citizen fan project, not affiliated with
          Cloud Imperium Games. Star Citizen®, Squadron 42®, and related
          marks are property of Cloud Imperium Games Group LLC. This tool is
          made with{' '}
          <Heart className="w-2.5 h-2.5 inline text-primary/40" />{' '}
          by a solo scrapper for personal use and the community.
        </p>
      </div>

      <div className="text-center text-[9px] text-muted-foreground/30 tracking-wider">
        BUILT IN THE BLACK — FOR THE BLACK
      </div>
    </div>
  );
}