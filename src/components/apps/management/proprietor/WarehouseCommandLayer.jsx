import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SoloOpsConsole from './SoloOpsConsole';
import WarehouseLocationPanel from './WarehouseLocationPanel';
import FreightStagingBoard from './FreightStagingBoard';
import CargoLoadPlanner from './CargoLoadPlanner';
import FreightMissionOptimizer from './FreightMissionOptimizer';
import FreightPayoutDashboard from './FreightPayoutDashboard';

const input = { borderColor: '#5C4424', background: '#0B0906', color: '#EDE5D6' };

function CrateCreator({ locations, onCreate, pending }) {
  const [f, setF] = useState({ crate_code: '', label: '', location_code: '', destination: '', scu_used: 1, cargo_value_auec: 0, risk_level: 'medium' });
  const submit = () => { if (!f.crate_code) return; onCreate({ ...f, crate_code: f.crate_code.toUpperCase(), scu_used: Number(f.scu_used)||0, cargo_value_auec: Number(f.cargo_value_auec)||0 }); setF({ crate_code: '', label: '', location_code: '', destination: '', scu_used: 1, cargo_value_auec: 0, risk_level: 'medium' }); };
  return <div className="border p-4 font-mono space-y-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><p className="text-[10px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>CRATE REGISTRY</p><div className="grid grid-cols-2 gap-2"><input placeholder="CRATE CODE" value={f.crate_code} onChange={(e)=>setF({...f,crate_code:e.target.value})} className="h-8 border px-2 text-xs" style={input}/><input placeholder="LABEL" value={f.label} onChange={(e)=>setF({...f,label:e.target.value})} className="h-8 border px-2 text-xs" style={input}/><select value={f.location_code} onChange={(e)=>setF({...f,location_code:e.target.value})} className="h-8 border px-2 text-xs" style={input}><option value="">LOCATION</option>{locations.map((l)=><option key={l.id} value={l.code}>{l.code}</option>)}</select><input placeholder="DESTINATION" value={f.destination} onChange={(e)=>setF({...f,destination:e.target.value})} className="h-8 border px-2 text-xs" style={input}/><input type="number" placeholder="SCU" value={f.scu_used} onChange={(e)=>setF({...f,scu_used:e.target.value})} className="h-8 border px-2 text-xs" style={input}/><select value={f.risk_level} onChange={(e)=>setF({...f,risk_level:e.target.value})} className="h-8 border px-2 text-xs" style={input}><option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option></select></div><button disabled={pending} onClick={submit} className="w-full border py-2 text-[10px] tracking-[0.18em]" style={{ borderColor: '#8A6430', color: '#E0A22E' }}>REGISTER CRATE</button></div>;
}

export default function WarehouseCommandLayer({ orders = [] }) {
  const qc = useQueryClient();
  const { data: crates = [] } = useQuery({ queryKey: ['cargo_crates'], queryFn: () => base44.entities.cargo_crate.list('-updated_date', 200) });
  const { data: locations = [] } = useQuery({ queryKey: ['warehouse_locations'], queryFn: () => base44.entities.warehouse_location.list('code', 200) });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const done = () => { qc.invalidateQueries({ queryKey: ['cargo_crates'] }); qc.invalidateQueries({ queryKey: ['warehouse_locations'] }); };
  const createCrate = useMutation({ mutationFn: (data) => base44.entities.cargo_crate.create(data), onSuccess: done });
  const createLoc = useMutation({ mutationFn: (data) => base44.entities.warehouse_location.create(data), onSuccess: done });
  const stage = useMutation({ mutationFn: ({ crate, next }) => base44.entities.cargo_crate.update(crate.id, { stage: next }), onSuccess: done });
  return <div className="space-y-4"><SoloOpsConsole orders={orders} crates={crates} locations={locations} products={products} /><div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4"><WarehouseLocationPanel locations={locations} onCreate={(d)=>createLoc.mutate(d)} pending={createLoc.isPending} /><CrateCreator locations={locations} onCreate={(d)=>createCrate.mutate(d)} pending={createCrate.isPending} /></div><FreightStagingBoard crates={crates} onStage={(crate,next)=>stage.mutate({ crate, next })} /><FreightMissionOptimizer /><FreightPayoutDashboard /><CargoLoadPlanner crates={crates} /></div>;
}