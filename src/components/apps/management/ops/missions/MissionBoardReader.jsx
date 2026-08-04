import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';

const LIMIT = 10;

/**
 * Photograph the contract board and have it become missions ready to chain. Typing ten
 * hauling contracts by hand is the largest piece of manual entry left in the yard, and it
 * is entry the game already has on screen.
 */
export default function MissionBoardReader() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);

  const read = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `This is a screenshot of a Star Citizen hauling or cargo contract board or contract detail screen. Extract every contract you can read, up to ${LIMIT}. For each: the contract or mission title, the pickup location (origin), the delivery location (destination), the cargo volume in SCU, and the reward in aUEC. Infer risk only where the wording clearly says so. Omit any contract whose origin or destination you cannot actually read.`,
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            missions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mission_name: { type: 'string' },
                  origin: { type: 'string' },
                  destination: { type: 'string' },
                  cargo_scu: { type: 'number' },
                  reward_auec: { type: 'number' },
                  risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                },
                required: ['mission_name', 'origin', 'destination'],
              },
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['missions'],
        },
      });
      const rows = (r.missions || []).slice(0, LIMIT).map((m) => ({
        mission_name: m.mission_name,
        origin: m.origin,
        destination: m.destination,
        cargo_scu: Number(m.cargo_scu) || 0,
        reward_auec: Number(m.reward_auec) || 0,
        priority: 'normal',
        risk_level: m.risk_level || 'medium',
        status: 'planned',
        notes: 'Read from a contract board photograph — check the volumes before flying.',
      }));
      if (!rows.length) throw new Error('No contract could be read from that shot.');
      await base44.entities.freight_mission.bulkCreate(rows);
      return { count: rows.length, confidence: r.confidence };
    },
    onSuccess: () => { setFile(null); qc.invalidateQueries({ queryKey: ['chain_missions'] }); },
  });

  return (
    <div className="p-2 space-y-1.5" style={{ boxShadow: 'inset 0 -1px 0 #241C14' }}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] tracking-[0.18em] flex items-center gap-1 shrink-0" style={{ color: '#8A8F45' }}>
          <Camera className="w-3 h-3" /> READ THE BOARD
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-[8px] flex-1 min-w-0"
          style={{ color: '#8A7E6C' }}
        />
        <button
          disabled={!file || read.isPending}
          onClick={() => read.mutate()}
          className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
          style={{ borderColor: '#8A6430', color: '#E0A22E' }}
        >
          {read.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} ADD CONTRACTS
        </button>
      </div>
      {read.isSuccess && (
        <p className="text-[8px]" style={{ color: '#8A8F45' }}>
          {read.data.count} contract{read.data.count > 1 ? 's' : ''} added to the board
          {read.data.confidence === 'low' ? ' — read poorly, check the volumes and rewards.' : ' — tick the ones you are flying.'}
        </p>
      )}
      {read.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>{read.error?.message || 'That board could not be read.'} Try a closer shot.</p>}
    </div>
  );
}