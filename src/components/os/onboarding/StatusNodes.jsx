import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Interactive status node track — bronze/charcoal. Completed nodes are clickable
// to jump back; the active node pulses; future nodes sit dormant.
export default function StatusNodes({ labels, current, onJump }) {
  return (
    <div className="flex items-center">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className="flex-1 h-px mx-1 relative overflow-hidden" style={{ background: 'hsl(33, 18%, 16%)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ background: 'linear-gradient(90deg, hsl(38, 72%, 52%), hsl(42, 85%, 60%))' }}
                  initial={false}
                  animate={{ width: i <= current ? '100%' : '0%' }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => done && onJump?.(i)}
              disabled={!done}
              className="relative flex flex-col items-center group"
              style={{ cursor: done ? 'pointer' : 'default' }}
              title={done ? `Return to ${label}` : label}
            >
              {/* Pulse halo on the active node */}
              {active && (
                <motion.span
                  className="absolute -top-1 w-6 h-6 rounded-full pointer-events-none"
                  style={{ border: '1px solid hsl(42, 85%, 60%, 0.7)' }}
                  animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <motion.span
                className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: done
                    ? 'hsl(38, 72%, 52%)'
                    : active
                      ? 'hsl(30, 12%, 7%)'
                      : 'hsl(30, 10%, 9%)',
                  border: `1px solid ${done || active ? 'hsl(42, 85%, 60%)' : 'hsl(33, 18%, 20%)'}`,
                  boxShadow: active ? '0 0 12px hsl(42, 85%, 60%, 0.5)' : 'none',
                }}
                animate={active ? { boxShadow: [
                  '0 0 6px hsl(42, 85%, 60%, 0.25)',
                  '0 0 14px hsl(42, 85%, 60%, 0.6)',
                  '0 0 6px hsl(42, 85%, 60%, 0.25)',
                ] } : {}}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={done ? { scale: 1.25 } : {}}
              >
                {done ? (
                  <Check className="w-2.5 h-2.5" style={{ color: 'hsl(30, 15%, 6%)' }} strokeWidth={3} />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: active ? 'hsl(42, 85%, 60%)' : 'hsl(33, 15%, 26%)' }}
                  />
                )}
              </motion.span>
              <span
                className="absolute top-5 font-mono text-[7px] tracking-[0.15em] whitespace-nowrap transition-colors"
                style={{
                  color: active
                    ? 'hsl(42, 85%, 60%)'
                    : done
                      ? 'hsl(35, 20%, 55%)'
                      : 'hsl(35, 12%, 35%)',
                }}
              >
                {label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}