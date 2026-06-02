import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Package, BookOpen, FileText, Radio, Info, Settings } from 'lucide-react';

const ICON_MAP = {
  Wrench, Package, BookOpen, FileText, Radio, Info, Settings,
};

export default function AppIcon({ app, onClick, index }) {
  const Icon = ICON_MAP[app.icon] || Info;
  const isActive = app.status === 'active';
  const isComingOnline = app.status === 'coming-online';

  return (
    <motion.button
      onClick={() => onClick(app)}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon container with organic shape */}
      <div
        className="relative w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, hsl(180, 12%, 10%) 0%, hsl(180, 15%, 7%) 100%)`,
          border: `1px solid hsl(170, 25%, 18%, ${isComingOnline ? '0.3' : '0.5'})`,
          borderRadius: '18px 24px 18px 24px', // asymmetric Xi'an shape
        }}
      >
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 rounded-[18px_24px_18px_24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `0 0 20px ${app.color}33, inset 0 0 20px ${app.color}11`,
          }}
        />

        <Icon
          className={`w-7 h-7 transition-all duration-300 ${
            isComingOnline 
              ? 'text-muted-foreground/50 group-hover:text-muted-foreground/70' 
              : 'text-primary/80 group-hover:text-primary'
          }`}
        />

        {/* Status dot */}
        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${
          isActive ? 'bg-primary' : 'bg-muted-foreground/30'
        }`} />
      </div>

      {/* Label */}
      <span className={`font-mono text-[10px] tracking-wider transition-colors duration-300 ${
        isComingOnline 
          ? 'text-muted-foreground/50 group-hover:text-muted-foreground/70' 
          : 'text-foreground/70 group-hover:text-foreground'
      }`}>
        {app.name.toUpperCase()}
      </span>
    </motion.button>
  );
}