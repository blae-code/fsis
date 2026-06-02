import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      // Don't nag if already dismissed this session
      if (sessionStorage.getItem('fsis.install.dismissed') !== '1') setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('fsis.install.dismissed', '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: 'hsl(180, 12%, 7%, 0.92)',
            border: '1px solid hsl(170, 25%, 18%, 0.4)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 32px hsl(180, 15%, 2%, 0.6)',
          }}
        >
          <Download className="w-4 h-4 text-primary shrink-0" />
          <div className="font-mono text-[11px]">
            <div className="text-foreground">Install FSIS</div>
            <div className="text-muted-foreground text-[10px]">Run as a desktop / mobile app</div>
          </div>
          <button
            onClick={install}
            className="ml-2 px-3 py-1 rounded text-[10px] font-mono text-primary-foreground"
            style={{ background: 'hsl(168, 65%, 45%)' }}
          >
            Install
          </button>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}