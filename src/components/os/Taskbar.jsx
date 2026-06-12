import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '@/lib/windowContext.jsx';
import TaskbarItem from './TaskbarItem';

export default function Taskbar() {
  const { windows } = useWindows();

  if (windows.length === 0) return null;

  return (
    <motion.div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-1 px-3 py-1.5 rounded-full"
      style={{
        background: 'hsl(30, 10%, 7%, 0.85)',
        border: '1px solid hsl(33, 18%, 18%, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <AnimatePresence>
        {windows.map(win => (
          <motion.div
            key={win.appId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <TaskbarItem win={win} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}