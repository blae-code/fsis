import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function OperatorOnboarding({ onComplete }) {
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await base44.auth.updateMe({ onboarded: true });
      } finally {
        if (active) onComplete?.();
      }
    })();
    return () => { active = false; };
  }, [onComplete]);

  return null;
}