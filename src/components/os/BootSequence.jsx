import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FsisLogo from '@/components/brand/FsisLogo';

const BOOT_LINES = [
  { text: '> FSIS CORE v3.14.7 — INITIALIZING', delay: 200 },
  { text: '> Xi\'an subsystem handshake ............ OK', delay: 400 },
  { text: '> Quantum-link calibration ............. OK', delay: 300 },
  { text: '> Hull integrity monitor ............... ONLINE', delay: 250 },
  { text: '> Salvage array diagnostics ............ STANDBY', delay: 350 },
  { text: '> Cargo manifest sync .................. STANDBY', delay: 200 },
  { text: '> Redscar Nomads org-link .............. CONNECTED', delay: 400 },
  { text: '> FairShare pricing engine ............. LOADED', delay: 300 },
  { text: '> "Every credit accounted for."', delay: 600 },
  { text: '> OPERATOR TERMINAL READY', delay: 400 },
];

export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState('logo'); // logo | lines | fadein
  const [visibleLines, setVisibleLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(p => !p), 530);
    return () => clearInterval(interval);
  }, []);

  // Logo phase
  useEffect(() => {
    const timer = setTimeout(() => setPhase('lines'), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Boot lines phase
  useEffect(() => {
    if (phase !== 'lines') return;
    let totalDelay = 0;
    BOOT_LINES.forEach((line, i) => {
      totalDelay += line.delay;
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line.text]);
      }, totalDelay);
    });
    setTimeout(() => {
      setPhase('fadein');
      setTimeout(onComplete, 1200);
    }, totalDelay + 800);
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'hsl(180, 15%, 4%)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {/* Ambient organic background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03] animate-breathe"
              style={{ background: 'radial-gradient(circle, hsl(168, 80%, 55%), transparent)', filter: 'blur(80px)' }} />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.04] animate-breathe"
              style={{ background: 'radial-gradient(circle, hsl(155, 50%, 45%), transparent)', filter: 'blur(60px)', animationDelay: '2s' }} />
          </div>

          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
            <div className="w-full h-1 bg-primary" style={{ animation: 'scan-line 3s linear infinite' }} />
          </div>

          {phase === 'logo' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center relative z-10"
            >
              {/* Xi'an organic frame around logo */}
              <motion.div
                className="relative inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                {/* Organic border rings */}
                <div className="absolute -inset-12 rounded-full border border-primary/10 animate-breathe" />
                <div className="absolute -inset-20 rounded-full border border-primary/5 animate-breathe" style={{ animationDelay: '1s' }} />
                
                <motion.div
                  className="flex justify-center mb-6"
                  initial={{ opacity: 0, scale: 0.7, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 1.4, ease: 'easeOut' }}
                >
                  <FsisLogo size={96} glow />
                </motion.div>

                <motion.h1
                  className="text-7xl md:text-8xl font-bold tracking-[0.3em] font-mono xian-glow"
                  style={{ color: 'hsl(168, 65%, 45%)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1.2 }}
                >
                  FSIS
                </motion.h1>
                
                <motion.div
                  className="mt-4 flex items-center justify-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to right, transparent, hsl(168, 65%, 45%, 0.4))' }} />
                  <span className="text-sm tracking-[0.4em] uppercase font-mono" style={{ color: 'hsl(168, 65%, 45%, 0.7)' }}>
                    FairShare Industrial Solutions
                  </span>
                  <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to left, transparent, hsl(168, 65%, 45%, 0.4))' }} />
                </motion.div>

                <motion.p
                  className="mt-6 text-xs tracking-[0.25em] uppercase font-mono"
                  style={{ color: 'hsl(165, 20%, 50%, 0.5)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.8 }}
                >
                  Every credit accounted for
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {phase === 'lines' && (
            <motion.div
              className="w-full max-w-2xl px-8 font-mono text-sm relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-1">
                {visibleLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`${
                      line.includes('CONNECTED') ? 'text-primary xian-glow-subtle' :
                      line.includes('OK') || line.includes('ONLINE') || line.includes('LOADED') ? 'text-primary/70' :
                      line.includes('STANDBY') ? 'text-muted-foreground' :
                      line.includes('every credit') ? 'text-primary/50 italic' :
                      line.includes('READY') ? 'text-primary font-bold xian-glow-subtle' :
                      'text-foreground/60'
                    }`}
                  >
                    {line}
                  </motion.div>
                ))}
                {showCursor && (
                  <span className="text-primary">▊</span>
                )}
              </div>
            </motion.div>
          )}

          {phase === 'fadein' && (
            <motion.div
              className="text-center font-mono"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <span className="text-primary text-lg xian-glow-subtle">SYSTEM ONLINE</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}