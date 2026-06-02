import React from 'react';
import { Shield, Heart } from 'lucide-react';

export default function AboutContent() {
  return (
    <div className="h-full font-mono text-xs space-y-6 max-w-lg mx-auto py-4">
      {/* System info */}
      <div className="space-y-3">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          System Information
        </h2>
        <div className="space-y-1.5 text-foreground/60">
          <div className="flex justify-between">
            <span className="text-muted-foreground">System</span>
            <span>FSIS — FairShare Industrial Solutions</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>3.14.7-alpha</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Operator</span>
            <span>Solo Salvage & Cargo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Org</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary/50" />
              Redscar Nomads
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pricing</span>
            <span>Orgmate preferential rates active</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/30" />

      {/* Brand statement */}
      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.2em] text-primary/80 uppercase font-semibold">
          FairShare Promise
        </h2>
        <p className="text-foreground/50 leading-relaxed">
          Transparent pricing. Honest salvage. Every credit accounted for.
          What you see is what you pay. Orgmates get the best rate —
          always have, always will. No hidden fees. No mystery math.
          We show our work.
        </p>
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