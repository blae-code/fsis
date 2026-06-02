import React from 'react';
import { motion } from 'framer-motion';

export default function OnboardingStep({ index, current, label, prompt, children }) {
  if (index !== current) return null;
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="space-y-1.5">
        <div className="font-mono text-[10px] tracking-[0.3em] text-primary/70 uppercase">
          {label}
        </div>
        <h2 className="font-mono text-lg text-foreground leading-snug">{prompt}</h2>
      </div>
      {children}
    </motion.div>
  );
}