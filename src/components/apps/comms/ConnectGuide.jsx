import React, { useState } from 'react';
import { Copy, Check, Radio, ExternalLink, Siren } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 17%)' };
const ORANGE = 'hsl(18, 65%, 52%)';
const SERVER = 'main.od3ica-srs.space';

export default function ConnectGuide() {
  const [copied, setCopied] = useState(false);

  const copyServer = () => {
    navigator.clipboard.writeText(SERVER);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Relay identity */}
      <div className="p-4 rounded border" style={{ ...border, background: 'hsl(30, 12%, 8%)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-4 h-4" style={{ color: ORANGE }} />
          <span className="text-xs font-bold tracking-[0.2em]" style={{ color: ORANGE }}>OD3ICA SPACECOMMS RELAY SERVICE</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          All FSIS voice traffic is carried over the OD3ICA SRS public relay — a free, unbiased,
          community-run comms network. Up to 10 radios + intercom, AM/FM modulation, optional
          encryption. Flip the bird on Aciedo CommRelay.
        </p>
      </div>

      {/* Server address */}
      <div className="p-4 rounded border" style={{ ...border, background: 'hsl(30, 12%, 8%)' }}>
        <div className="text-[10px] text-muted-foreground mb-1 tracking-wider">RELAY ADDRESS — TUNE IN</div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm" style={{ color: ORANGE, textShadow: '0 0 10px hsl(18, 65%, 52%, 0.3)' }}>{SERVER}</span>
          <button
            onClick={copyServer}
            className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] hover:bg-muted transition-colors"
            style={border}
          >
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>

      {/* Emergency */}
      <div
        className="p-4 rounded border flex items-start gap-3"
        style={{ borderColor: 'hsl(0, 60%, 30%)', background: 'hsl(0, 40%, 8%)' }}
      >
        <Siren className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-bold text-destructive tracking-wider">EMERGENCY GUARD — 333.000 MHz FM</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Keep one radio on guard at all times. Listen in or call for rescue, refuel, or assistance.
          </p>
        </div>
      </div>

      {/* External links */}
      <div className="flex gap-3">
        <a
          href="https://od3ica-srs.webflow.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] hover:underline"
          style={{ color: ORANGE }}
        >
          <ExternalLink className="w-3 h-3" /> OD3ICA SRS — How to connect
        </a>
        <a
          href="https://od3ica-srs.webflow.io/list"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] hover:underline"
          style={{ color: ORANGE }}
        >
          <ExternalLink className="w-3 h-3" /> Public frequency list
        </a>
      </div>
    </div>
  );
}