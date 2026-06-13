import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/** Keycap badge for shortcut hints */
export function Kbd({ children }) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 font-mono text-[9px] font-bold border"
      style={{
        borderColor: '#3C5A50',
        color: '#8FBFAE',
        background: '#101614',
        boxShadow: 'inset 0 -1px 0 #3C5A50',
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}

/** Bronze command-deck tooltip — label, optional description and shortcut keycap. */
export default function StoreTip({ label, desc, kbd, shortcut, side = 'top', children }) {
  kbd = kbd || shortcut;
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={6}
          className="font-mono border rounded-none px-3 py-2 max-w-[220px]"
          style={{
            background: 'linear-gradient(160deg, #1A150E, #100D0A)',
            borderColor: '#5C4A33',
            color: '#D8CFC0',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.6), 0 0 10px rgba(212, 146, 11, 0.08)',
          }}
        >
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em]" style={{ color: '#E0C27E' }}>
            {label}
            {kbd && <Kbd>{kbd}</Kbd>}
          </span>
          {desc && (
            <span className="block mt-1 text-[9px] leading-relaxed font-normal" style={{ color: '#9C9080' }}>
              {desc}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}