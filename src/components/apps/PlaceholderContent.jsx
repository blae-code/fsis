import React from 'react';
import { Loader, Terminal } from 'lucide-react';

export default function PlaceholderContent({ name, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 font-mono">
      {/* Animated loading indicator */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center">
          <Terminal className="w-6 h-6 text-primary/40" />
        </div>
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm tracking-[0.3em] text-foreground/70 uppercase">
          {name}
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground/50">
        <Loader className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-[10px] tracking-wider uppercase">
          Module initializing — coming online
        </span>
      </div>

      <div className="mt-4 p-3 rounded border border-border/30 max-w-sm">
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          This module is being developed. When complete, it will dock into
          this window automatically. All data will be tracked with full
          transparency — every credit accounted for.
        </p>
      </div>
    </div>
  );
}