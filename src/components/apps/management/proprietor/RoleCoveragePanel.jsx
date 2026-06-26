import React from 'react';
import { ROLE_COVERAGE } from './launchReadinessConfig';

export default function RoleCoveragePanel() {
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASE 1 · USER ROLE COVERAGE</p>
      <div className="grid lg:grid-cols-5 gap-2 mt-3">
        {ROLE_COVERAGE.map(([role, can, guard]) => <div key={role} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><b className="text-[10px]" style={{ color: '#D8CFC0' }}>{role}</b><p className="text-[9px] mt-2" style={{ color: '#A89C8A' }}>{can}</p><p className="text-[8px] mt-2" style={{ color: '#7A6E60' }}>Guard: {guard}</p></div>)}
      </div>
    </div>
  );
}