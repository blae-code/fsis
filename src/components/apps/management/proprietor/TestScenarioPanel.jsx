import React from 'react';
import { TEST_SCENARIOS } from './launchReadinessConfig';

export default function TestScenarioPanel() {
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASE 4 · TESTING AGENT SCENARIOS</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-2 mt-3">
        {TEST_SCENARIOS.map(([label, prompt]) => <div key={label} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><b className="text-[10px]" style={{ color: '#D8CFC0' }}>{label}</b><p className="text-[9px] mt-2 leading-relaxed" style={{ color: '#A89C8A' }}>{prompt}</p></div>)}
      </div>
    </div>
  );
}