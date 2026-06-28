import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Database, Download, LayoutDashboard, Maximize, ShoppingCart, ChevronRight, ChevronLeft, CheckCircle2, MonitorDown, Keyboard, ShieldCheck } from 'lucide-react';
import FsisLogo from '@/components/brand/FsisLogo';
import SerialStrip from '@/components/brand/SerialStrip';
import ScanlineOverlay from '@/components/onboarding/ScanlineOverlay';
import TypedStatus from '@/components/onboarding/TypedStatus';
import StatusNodes from '@/components/os/onboarding/StatusNodes';
import { useFullscreen } from '@/lib/useFullscreen';

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

const stepWrap = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3 },
};

/** First-visit patron onboarding: welcome → orientation → trust briefing → install → fullscreen → enter store. */
export default function StoreOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const { isFullscreen, enter: enterFullscreen } = useFullscreen();

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  const steps = ['WELCOME', 'ORIENTATION', 'TRUST', 'INSTALL', 'FULLSCREEN'];
  const isLast = step === steps.length - 1;

  const finish = () => {
    if (!isFullscreen && !isStandalone()) enterFullscreen();
    onComplete();
  };

  // Keyboard navigation: Enter advances, ← back, Esc skips
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') (isLast ? finish() : setStep((s) => s + 1));
      else if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
      else if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(10, 9, 8, 0.96)', backdropFilter: 'blur(10px)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full animate-breathe pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(42, 85%, 60%, 0.1), transparent 70%)' }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative w-full max-w-xl p-[3px]"
        style={{
          background: 'linear-gradient(135deg, #8A6430 0%, #4A3722 35%, #B0793A 65%, #5C4424 100%)',
          clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
        }}
      >
        <div
          className="relative p-6 sm:p-8 font-mono max-h-[88vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, #14110D 0%, #0E0C0A 100%)',
            clipPath: 'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <FsisLogo size={30} />
            <div>
              <div className="text-[10px] tracking-[0.3em]" style={{ color: '#D4920B' }}>FAIRSHARE INDUSTRIAL</div>
              <TypedStatus
                key={step}
                text={`NEW PATRON SETUP — ${steps[step]} ${step + 1}/${steps.length}`}
                className="block text-[9px]"
                style={{ color: '#8A7E6C' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="welcome" {...stepWrap} className="space-y-4">
                <h2 className="text-xl font-bold leading-tight" style={{ color: '#E5DDD0' }}>
                  Welcome aboard, <span style={{ color: '#C8893B' }}>patron.</span>
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>
                  This is the FSIS trade terminal — reclaimed materials, fabricated goods, and crew services,
                  delivered across the 'verse. Browse the catalog, transmit an order, and track it with a
                  code. No account needed; pay only in-game at handoff.
                </p>
                <div className="space-y-2">
                  {[
                    [ShoppingCart, 'Order from the catalog — pay only in the in-game trade window'],
                    [MonitorDown, 'Best experienced installed on your desktop'],
                    [Maximize, 'Designed to run in fullscreen, like a ship terminal'],
                  ].map(([Icon, text], i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.15, duration: 0.35 }}
                      className="flex items-center gap-2.5 text-[11px]"
                      style={{ color: '#9C9080' }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#C8A05B' }} /> {text}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="orientation" {...stepWrap} className="space-y-4">
                <h2 className="text-xl font-bold leading-tight" style={{ color: '#E5DDD0' }}>
                  Read the <span style={{ color: '#C8893B' }}>terminal map.</span>
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>
                  FSIS has two sides: the public storefront for buyers and the proprietor command layer for fulfillment, inventory, freight, and ledger work.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    [ShoppingCart, 'Storefront', 'Browse stock, build a manifest, schedule handoff, and track orders.'],
                    [LayoutDashboard, 'Command Center', 'Admin-only operations for intake, warehouse, freight, payouts, and QA.'],
                    [Keyboard, 'Fast Controls', 'Use / for search and number keys to jump between storefront sections.'],
                    [MonitorDown, 'Live Terminal', 'Status strips, market ticker, and order rail keep the active workflow visible.'],
                  ].map(([Icon, title, text]) => (
                    <div key={title} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
                      <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: '#E0A22E' }}><Icon className="w-3.5 h-3.5" />{title}</div>
                      <p className="text-[9px] leading-relaxed mt-1" style={{ color: '#9C9080' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="trust" {...stepWrap} className="space-y-4">
                <h2 className="text-xl font-bold leading-tight" style={{ color: '#E5DDD0' }}>
                  Data, privacy, and <span style={{ color: '#C8893B' }}>AI use.</span>
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>
                  The buyer path is intentionally low-friction: no public account is required, and handoff payment happens in-game.
                </p>
                <div className="space-y-2">
                  {[
                    [Database, 'Where data is stored', 'Orders, inventory, invoices, freight plans, and admin records are stored in the app database. This device also keeps a small local cache for your cart, pins, tracking codes, and onboarding status.'],
                    [ShieldCheck, 'Privacy posture', 'Only the details needed to coordinate a purchase are requested: handle, delivery preference, order notes, and optional contact/handoff details. Admin-only operations stay behind the proprietor role.'],
                    [Bot, 'AI-assisted tools', 'AI may be used for optional workflows like parsing intake notes, screenshots, manifests, salvage scans, ledger images, and operational summaries. AI output is reviewed before it becomes operational data.'],
                  ].map(([Icon, title, text]) => (
                    <div key={title} className="flex gap-3 border p-3" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C8A05B' }} />
                      <div><div className="text-[10px] font-bold" style={{ color: '#E0A22E' }}>{title}</div><p className="text-[9px] leading-relaxed mt-1" style={{ color: '#9C9080' }}>{text}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="install" {...stepWrap} className="space-y-4">
                <h2 className="text-xl font-bold leading-tight" style={{ color: '#E5DDD0' }}>
                  Install to your <span style={{ color: '#C8893B' }}>desktop.</span>
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>
                  FSIS runs as a standalone desktop app — its own window, its own icon, no browser clutter.
                  Perfect for a second monitor while you fly.
                </p>

                {installed ? (
                  <div className="flex items-center gap-2 text-[11px] p-3 border" style={{ borderColor: '#3E5C33', color: '#7BA05B', background: '#11150E' }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Already installed — you're running the desktop app.
                  </div>
                ) : deferred ? (
                  <button
                    onClick={install}
                    className="w-full h-10 text-xs font-bold inline-flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg, #E8B13A, #BD7E16)', color: '#1A1206' }}
                  >
                    <Download className="w-4 h-4" /> INSTALL FSIS NOW
                  </button>
                ) : (
                  <div className="space-y-2 p-3 border text-[10px] leading-relaxed" style={{ borderColor: '#3A2F20', color: '#9C9080', background: '#0E0C09' }}>
                    <div style={{ color: '#C8A05B' }}>MANUAL INSTALL:</div>
                    <div><span style={{ color: '#D8CFC0' }}>Chrome / Edge:</span> click the <MonitorDown className="w-3 h-3 inline" /> install icon at the right end of the address bar, then "Install".</div>
                    <div><span style={{ color: '#D8CFC0' }}>Safari (Mac):</span> File menu → "Add to Dock".</div>
                    <div><span style={{ color: '#D8CFC0' }}>Mobile:</span> browser menu → "Add to Home Screen".</div>
                  </div>
                )}
                <p className="text-[9px]" style={{ color: '#6B6155' }}>
                  Optional — you can keep using the browser and install later from the address bar.
                </p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="fullscreen" {...stepWrap} className="space-y-4">
                <h2 className="text-xl font-bold leading-tight" style={{ color: '#E5DDD0' }}>
                  Go <span style={{ color: '#C8893B' }}>fullscreen.</span>
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>
                  The terminal is built edge-to-edge with no page scrolling — fullscreen makes it feel like
                  real shipboard hardware. We'll switch you over when you enter.
                </p>
                <div className="flex items-center gap-2.5 text-[11px] p-3 border" style={{ borderColor: '#3A2F20', color: '#9C9080', background: '#0E0C09' }}>
                  <Keyboard className="w-4 h-4 shrink-0" style={{ color: '#C8A05B' }} />
                  <span>Toggle anytime with <span className="px-1.5 py-0.5 border font-bold" style={{ borderColor: '#5C4424', color: '#E0A22E' }}>F11</span> on desktop.</span>
                </div>
                {(isFullscreen || isStandalone()) && (
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: '#7BA05B' }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {isStandalone() ? 'Desktop app window detected — you\'re set.' : 'Fullscreen active — you\'re set.'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress + nav */}
          <div className="flex items-center justify-between mt-8 pt-5 pb-3 border-t" style={{ borderColor: '#2A2118' }}>
            <div className="w-36">
              <StatusNodes labels={steps} current={step} onJump={setStep} />
            </div>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="text-[10px] hover:opacity-80 inline-flex items-center gap-0.5" style={{ color: '#8A7E6C' }}>
                  <ChevronLeft className="w-3 h-3" /> BACK
                </button>
              )}
              <button onClick={onComplete} className="text-[10px] hover:opacity-80" style={{ color: '#6B6155' }}>
                SKIP
              </button>
              <motion.button
                onClick={() => (isLast ? finish() : setStep(step + 1))}
                whileHover="hover"
                whileTap={{ scale: 0.96 }}
                className="relative h-9 px-5 text-xs font-bold inline-flex items-center gap-1.5 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #E8B13A, #BD7E16)',
                  color: '#1A1206',
                  clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
                }}
              >
                {/* Light sweep on hover */}
                <motion.span
                  className="absolute inset-y-0 w-1/2 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent, rgba(255,240,200,0.55), transparent)' }}
                  initial={{ x: '-150%' }}
                  variants={{ hover: { x: '250%' } }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <span className="relative">{isLast ? 'ENTER THE STORE' : 'CONTINUE'}</span>
                <motion.span variants={{ hover: { x: 3 } }} className="relative inline-flex">
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.span>
              </motion.button>
            </div>
          </div>

          {/* Serial footer + keyboard hints */}
          <div className="flex items-center justify-between mt-5">
            <SerialStrip seed="FSIS-PATRON-LINK" label="PATRON LINK • SEC-7" />
            <span className="text-[8px] tracking-[0.2em]" style={{ color: '#54493B' }}>ENTER ↵ ADVANCE • ESC SKIP</span>
          </div>

          <ScanlineOverlay />
        </div>
      </motion.div>
    </motion.div>
  );
}