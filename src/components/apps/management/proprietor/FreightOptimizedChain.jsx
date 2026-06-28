import React from 'react';
import { GitBranch } from 'lucide-react';
import { riskColor } from '@/lib/warehouseUtils';
import { missionScore } from '@/lib/freightMissionUtils';

export default function FreightOptimizedChain({ missions = [] }) {
  return <div className="space-y-1">{missions.map((m)=><div key={m.id} className="border p-2 text-[10px] flex items-center gap-2" style={{ borderColor: riskColor(m.risk_level), color: '#D8CFC0' }}><GitBranch className="w-3 h-3"/><b style={{ color:'#E0A22E' }}>#{m.chain_position}</b><span className="flex-1">{m.origin} → {m.destination}</span><span>{Math.round(missionScore(m)).toLocaleString()}</span></div>)}</div>;
}