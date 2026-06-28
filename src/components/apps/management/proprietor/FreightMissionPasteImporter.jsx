import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';

const field = { borderColor: '#3A2F20', background: '#0B0906', color: '#D8CFC0' };

export default function FreightMissionPasteImporter({ onImported }) {
  const [text, setText] = useState('');
  const importMissions = useMutation({ mutationFn: async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Parse these Star Citizen freight/cargo mission notes into structured missions. Extract up to 10 mission records. Infer risk from route wording only when obvious. Text:\n${text}`,
      response_json_schema: { type: 'object', properties: { missions: { type: 'array', items: { type: 'object', properties: { mission_name: { type: 'string' }, origin: { type: 'string' }, destination: { type: 'string' }, cargo_scu: { type: 'number' }, reward_auec: { type: 'number' }, priority: { type: 'string', enum: ['low', 'normal', 'high'] }, risk_level: { type: 'string', enum: ['low', 'medium', 'high'] }, notes: { type: 'string' } }, required: ['mission_name', 'origin', 'destination'] } } }, required: ['missions'] },
    });
    const rows = (result.missions || []).slice(0, 10).map((m) => ({ mission_name: m.mission_name, origin: m.origin, destination: m.destination, cargo_scu: Number(m.cargo_scu || 0), reward_auec: Number(m.reward_auec || 0), priority: m.priority || 'normal', risk_level: m.risk_level || 'medium', status: 'planned', notes: m.notes || 'Imported from pasted mission text.' }));
    const created = rows.length ? await base44.entities.freight_mission.bulkCreate(rows) : [];
    return created;
  }, onSuccess: (created) => { setText(''); onImported?.(created || []); } });

  return <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="flex items-center justify-between gap-2"><p className="text-[9px] tracking-[0.18em]" style={{ color: '#8A8F45' }}><ClipboardList className="w-3 h-3 inline mr-1" />PASTE MISSION STACK</p><button disabled={!text.trim() || importMissions.isPending} onClick={() => importMissions.mutate()} className="border px-3 py-1.5 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#8A6430', color: '#E0A22E' }}>{importMissions.isPending ? 'PARSING…' : 'IMPORT + OPTIMIZE'}</button></div><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste mission list, contract text, route notes, reward lines, pickup/drop-off locations…" className="w-full h-20 border p-2 text-[10px]" style={field} />{importMissions.isSuccess && <p className="text-[9px]" style={{ color: '#8A8F45' }}>Mission stack imported and ready to select.</p>}{importMissions.isError && <p className="text-[9px]" style={{ color: '#C05050' }}>Mission import failed.</p>}</div>;
}