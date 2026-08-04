import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FsisLogo from '@/components/brand/FsisLogo';
import SerialStrip from '@/components/brand/SerialStrip';
import ScanlineOverlay from '@/components/onboarding/ScanlineOverlay';
import TypedStatus from '@/components/onboarding/TypedStatus';
import StatusNodes from '@/components/os/onboarding/StatusNodes';
import { CONTRACTOR_STEPS } from '@/components/work/onboarding/contractorSteps';

const stepWrap = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3 },
};

/** First visit to the labour board: how work is taken up, filed, credited and recorded. */
export default function ContractorOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = CONTRACTOR_STEPS[step];
  const isLast = step === CONTRACTOR_STEPS.length - 1;
  const Icon = current.icon;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') (isLast ? onComplete() : setStep((s) => s + 1));
      else if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
      else if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, isLast, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(10, 9, 8, 0.96)', backdropFilter: 'blur(10px)' }}
    >
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
          <div className="flex items-center gap-3 mb-7">
            <FsisLogo size={30} />
            <div>
              <div className="text-[10px] tracking-[0.3em]" style={{ color: '#D4920B' }}>FAIRSHARE INDUSTRIAL</div>
              <TypedStatus
                key={step}
                text={`LABOUR BOARD — ${current.tag} ${step + 1}/${CONTRACTOR_STEPS.length}`}
                className="block text-[9px]"
                style={{ color: '#8A7E6C' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={current.key} {...stepWrap} className="space-y-4">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-1" style={{ color: '#C8A05B' }} />
                <h2 className="text-lg font-bold leading-tight" style={{ color: '#E5DDD0' }}>{current.title}</h2>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#B8AC9A' }}>{current.body}</p>

              <div className="space-y-2">
                {current.points.map(([title, body], i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.32 }}
                    className="border p-3"
                    style={{ borderColor: '#3A2F20', background: '#0E0C09' }}
                  >
                    <div className="text-[10px] font-bold tracking-[0.18em]" style={{ color: '#E0A22E' }}>{title}</div>
                    <p className="text-[9px] leading-relaxed mt-1" style={{ color: '#9C9080' }}>{body}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-5 pb-3 border-t" style={{ borderColor: '#2A2118' }}>
            <div className="w-36">
              <StatusNodes labels={CONTRACTOR_STEPS.map((s) => s.tag)} current={step} onJump={setStep} />
            </div>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="text-[10px] hover:opacity-80 inline-flex items-center gap-0.5" style={{ color: '#8A7E6C' }}>
                  <ChevronLeft className="w-3 h-3" /> BACK
                </button>
              )}
              <button onClick={onComplete} className="text-[10px] hover:opacity-80" style={{ color: '#6B6155' }}>SKIP</button>
              <motion.button
                onClick={() => (isLast ? onComplete() : setStep(step + 1))}
                whileTap={{ scale: 0.96 }}
                className="h-9 px-5 text-xs font-bold inline-flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(180deg, #E8B13A, #BD7E16)',
                  color: '#1A1206',
                  clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
                }}
              >
                {isLast ? 'OPEN THE BOARD' : 'CONTINUE'} <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <SerialStrip seed="FSIS-LABOUR-LINK" label="LABOUR LINK • SEC-4" />
            <span className="text-[8px] tracking-[0.2em]" style={{ color: '#54493B' }}>ENTER ↵ ADVANCE • ESC SKIP</span>
          </div>

          <ScanlineOverlay />
        </div>
      </motion.div>
    </motion.div>
  );
}