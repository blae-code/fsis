import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Loader2, Radio } from 'lucide-react';
import OnboardingStep from './OnboardingStep';

const inputStyle = { borderColor: 'hsl(170, 25%, 18%)' };

export default function OperatorOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    handle: user?.handle || '',
    org_role: user?.org_role || '',
    org_tier: user?.org_tier || '',
    home_system: user?.home_system || '',
  });
  const [saving, setSaving] = useState(false);

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
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'hsl(180, 15%, 4%, 0.96)', backdropFilter: 'blur(8px)' }}
    >
      {/* Ambient breathing glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full animate-breathe pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(168, 80%, 55%, 0.12), transparent 70%)' }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="relative w-full max-w-md p-8 rounded-2xl xian-border-glow"
        style={{
          background: 'linear-gradient(135deg, hsl(180, 12%, 7%, 0.95), hsl(180, 15%, 5%, 0.95))',
          border: '1px solid hsl(170, 25%, 18%, 0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-8">
          <Radio className="w-4 h-4 text-primary animate-pulse-glow" />
          <span className="font-mono text-xs tracking-[0.3em] text-primary xian-glow-subtle">
            FSIS OPERATOR LINK
          </span>
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
        </AnimatePresence>

        {/* Progress + advance */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t" style={inputStyle}>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  background: i <= step ? 'hsl(168, 65%, 45%)' : 'hsl(170, 25%, 18%)',
                }}
              />
            ))}
          </div>
          <Button
            onClick={handleNext}
            disabled={!steps[step].canAdvance || saving}
            size="sm"
            className="font-mono text-xs gap-1.5"
            style={{ background: 'hsl(168, 65%, 45%)', color: 'hsl(180, 15%, 5%)' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isLast ? 'Enter FSIS' : 'Continue'}
            {!saving && <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}