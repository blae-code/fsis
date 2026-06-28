import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wand2 } from 'lucide-react';
import { optimizeMissions } from '@/lib/freightMissionUtils';
import FreightMissionForm from './FreightMissionForm';
import FreightMissionList from './FreightMissionList';
import FreightOptimizedChain from './FreightOptimizedChain';

const emptyForm = { mission_name: '', origin: '', destination: '', cargo_scu: 1, reward_auec: 0, priority: 'normal', risk_level: 'medium' };

export default function FreightMissionOptimizer() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const { data: missions = [] } = useQuery({ queryKey: ['freight_missions'], queryFn: () => base44.entities.freight_mission.list('-updated_date', 100) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['freight_missions'] });
  const create = useMutation({ mutationFn: (d) => base44.entities.freight_mission.create(d), onSuccess: refresh });
  const update = useMutation({ mutationFn: (rows) => base44.entities.freight_mission.bulkUpdate(rows), onSuccess: refresh });
  const chosen = useMemo(() => optimizeMissions(missions.filter((m) => selected.includes(m.id)).slice(0, 10)), [missions, selected]);
  const submit = () => { if (!form.mission_name || !form.origin || !form.destination) return; create.mutate({ ...form, cargo_scu: Number(form.cargo_scu)||0, reward_auec: Number(form.reward_auec)||0 }); setForm(emptyForm); };
  const saveChain = () => update.mutate(chosen.map((m) => ({ id: m.id, chain_position: m.chain_position, status: 'accepted', chain_notes: `Optimized solo freight chain slot ${m.chain_position}/10` })));

  return <div className="border p-4 font-mono space-y-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><div className="flex justify-between gap-3"><div><p className="text-[10px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>MISSION CHAIN OPTIMIZER</p><h3 className="text-sm font-bold" style={{ color: '#F2EADC' }}>Chain up to 10 freight contracts</h3></div><button onClick={saveChain} disabled={!chosen.length || update.isPending} className="border px-3 text-[10px] tracking-[0.14em]" style={{ borderColor: '#8A6430', color: '#E0A22E' }}><Wand2 className="w-3 h-3 inline mr-1" />SAVE CHAIN</button></div><FreightMissionForm form={form} setForm={setForm} onSubmit={submit} /><div className="grid lg:grid-cols-2 gap-3"><FreightMissionList missions={missions} selected={selected} setSelected={setSelected} /><FreightOptimizedChain missions={chosen} /></div><p className="text-[9px]" style={{ color: '#8A7E6C' }}>Optimization favors reward per SCU, priority, and lower risk so solo freight chains stay profitable and survivable.</p></div>;
}