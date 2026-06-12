import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Loader2, Radio } from 'lucide-react';
import OnboardingStep from './OnboardingStep';
import StatusNodes from './StatusNodes';
import ScanlineOverlay from '@/components/onboarding/ScanlineOverlay';
import TypedStatus from '@/components/onboarding/TypedStatus';
import { useFullscreen } from '@/lib/useFullscreen';

const inputStyle = { borderColor: 'hsl(33, 18%, 18%)' };

export default function OperatorOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    handle: user?.handle || '',
    org_role: user?.org_role || '',
    org_tier: user?.org_tier || '',
    home_system: user?.home_system || '',
  });
  const [saving, setSaving] = useState(false);
  const { enter: enterFullscreen } = useFullscreen();

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricing_tiers_all'],
    queryFn: () => base44.entities.pricing_tier.list(),
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const steps = [
    { canAdvance: !!form.handle.trim() },
    { canAdvance: true },
    { canAdvance: true },
    { canAdvance: true },
    { canAdvance: true },
  ];

  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (!steps[step].canAdvance) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    await base44.auth.updateMe({ ...form, onboarded: true });
    setSaving(false);
    // "Enter FSIS" is a real user gesture — go fullscreen for the immersive OS experience
    enterFullscreen();
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'hsl(30, 12%, 4%, 0.96)', backdropFilter: 'blur(8px)' }}
    >
      {/* Ambient breathing glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full animate-breathe pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(42, 85%, 60%, 0.12), transparent 70%)' }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="relative w-full max-w-md p-8 rounded-2xl xian-border-glow overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(30, 10%, 7%, 0.95), hsl(30, 12%, 5%, 0.95))',
          border: '1px solid hsl(33, 18%, 18%, 0.6)',
        }}
      >
        <div className="flex items-center gap-2 mb-8">
          <Radio className="w-4 h-4 text-primary animate-pulse-glow" />
          <div className="flex-1">
            <span className="font-mono text-xs tracking-[0.3em] text-primary xian-glow-subtle">
              FSIS OPERATOR LINK
            </span>
            <TypedStatus
              key={step}
              text={`UPLINK SEGMENT ${step + 1}/${steps.length} — ${['IDENTITY', 'FUNCTION', 'AFFILIATION', 'ORIGIN', 'CONFIRM'][step]}`}
              className="block font-mono text-[9px] tracking-[0.2em] text-muted-foreground mt-0.5"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <OnboardingStep
            index={0}
            current={step}
            label="Identity / 01"
            prompt="What's your callsign, operator?"
          >
            <Input
              autoFocus
              value={form.handle}
              onChange={(e) => set('handle', e.target.value)}
              placeholder="e.g. Scrapper_01"
              className="h-10 text-sm font-mono"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
            <p className="text-[10px] font-mono text-muted-foreground">
              This is how the verse will know you across all FSIS systems.
            </p>
          </OnboardingStep>

          <OnboardingStep
            index={1}
            current={step}
            label="Function / 02"
            prompt="What's your role in the fleet?"
          >
            <Input
              value={form.org_role}
              onChange={(e) => set('org_role', e.target.value)}
              placeholder="e.g. Salvage Operator"
              className="h-10 text-sm font-mono"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
            <p className="text-[10px] font-mono text-muted-foreground">Optional — you can change this later in Settings.</p>
          </OnboardingStep>

          <OnboardingStep
            index={2}
            current={step}
            label="Affiliation / 03"
            prompt="Which pricing tier do you operate under?"
          >
            <Select value={form.org_tier} onValueChange={(v) => set('org_tier', v)}>
              <SelectTrigger className="h-10 text-sm font-mono" style={inputStyle}>
                <SelectValue placeholder="Select tier (optional)" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.tier_name}>{t.tier_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] font-mono text-muted-foreground">Sets your default FairShare rates.</p>
          </OnboardingStep>

          <OnboardingStep
            index={3}
            current={step}
            label="Origin / 04"
            prompt="Where's your base of operations?"
          >
            <Input
              value={form.home_system}
              onChange={(e) => set('home_system', e.target.value)}
              placeholder="e.g. Stanton"
              className="h-10 text-sm font-mono"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
            <p className="text-[10px] font-mono text-muted-foreground">Your home system, shown in your live presence.</p>
          </OnboardingStep>

          <OnboardingStep
            index={4}
            current={step}
            label="Uplink / 05"
            prompt="Confirm your operator dossier."
          >
            <div className="space-y-1.5 p-3 rounded border font-mono" style={{ ...inputStyle, background: 'hsl(30, 10%, 6%)' }}>
              {[
                ['CALLSIGN', form.handle || '—'],
                ['FUNCTION', form.org_role || 'Unassigned'],
                ['TIER', form.org_tier || 'Standard'],
                ['ORIGIN', form.home_system || 'Unknown'],
              ].map(([k, v], i) => (
                <motion.div
                  key={k}
                  className="flex justify-between text-[11px]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.13, duration: 0.3 }}
                >
                  <span className="text-muted-foreground tracking-[0.2em]">{k}</span>
                  <span className="text-primary">{v}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              All fields can be changed later in Settings. Welcome to the crew, {form.handle || 'operator'}.
            </p>
          </OnboardingStep>
        </AnimatePresence>

        {/* Status node track */}
        <div className="mt-8 pt-5 pb-4 px-1 border-t" style={inputStyle}>
          <StatusNodes
            labels={['IDENTITY', 'FUNCTION', 'AFFILIATION', 'ORIGIN', 'CONFIRM']}
            current={step}
            onJump={(i) => setStep(i)}
          />
        </div>

        {/* Advance controls */}
        <div className="flex items-center justify-end mt-3">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> BACK
              </button>
            )}
            <Button
              onClick={handleNext}
              disabled={!steps[step].canAdvance || saving}
              size="sm"
              className="font-mono text-xs gap-1.5"
              style={{ background: 'hsl(38, 72%, 52%)', color: 'hsl(30, 15%, 6%)' }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isLast ? 'Establish Link' : 'Continue'}
              {!saving && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <ScanlineOverlay />
      </motion.div>
    </motion.div>
  );
}