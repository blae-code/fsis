import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { readTerminalScreenshot } from '@/functions/readTerminalScreenshot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Check } from 'lucide-react';
import MaterialProposalRow from './MaterialProposalRow';
import LedgerProposalRow from './LedgerProposalRow';

const KIND_LABEL = {
  trade_terminal: 'A TRADE TERMINAL',
  inventory: 'AN INVENTORY LISTING',
  transaction: 'A TRANSACTION SCREEN',
  other: 'SOMETHING ELSE',
};

function Head({ label, meta }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
      <span className="text-[7px] tabular-nums" style={{ color: '#5F564A' }}>{meta}</span>
    </div>
  );
}

/**
 * One desk for any screen worth recording. Upload it, the reader says what it is, and the
 * readings come back as proposals set against the books — nothing is written until a hand
 * has looked at it, because a misread price silently applied is worse than no price at all.
 */
export default function ScanDesk() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [mats, setMats] = useState([]);
  const [led, setLed] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const read = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const { data } = await readTerminalScreenshot({ image_url: file_url });
      if (data?.error) throw new Error(data.error);
      return { ...data, file_url };
    },
    onSuccess: (d) => {
      setResult(d);
      setMats(d.materials || []);
      setLed(d.ledger || []);
      setImageUrl(d.file_url);
      setFile(null);
    },
  });

  const commitMats = useMutation({
    mutationFn: async () => {
      const updates = mats.filter((m) => m.existing_id).map((m) => ({
        id: m.existing_id,
        material_name: m.material_name,
        code: m.code,
        category: m.category,
        unit: m.unit || 'SCU',
        ...(m.ref_value_auec !== null ? { ref_value_auec: m.ref_value_auec } : {}),
      }));
      const creates = mats.filter((m) => !m.existing_id).map((m) => ({
        material_name: m.material_name,
        code: m.code,
        category: m.category,
        unit: m.unit || 'SCU',
        ref_value_auec: m.ref_value_auec || 0,
        salvage_derived: m.category === 'salvage_output',
        description: `Read from a ${KIND_LABEL[result?.kind]?.toLowerCase() || 'screenshot'}${result?.station ? ` at ${result.station}` : ''}.`,
      }));
      if (updates.length) await base44.entities.material.bulkUpdate(updates);
      if (creates.length) await base44.entities.material.bulkCreate(creates);
      return { updates: updates.length, creates: creates.length };
    },
    onSuccess: () => { setMats([]); qc.invalidateQueries({ queryKey: ['materials'] }); },
  });

  const commitLed = useMutation({
    mutationFn: () => base44.entities.ledger_entry.bulkCreate(led.map((l) => ({
      entry_type: l.entry_type,
      category: l.category,
      amount_auec: l.amount_auec,
      description: l.description,
      counterparty: l.counterparty || '',
      entry_date: today,
      source: 'ocr_scan',
      screenshot_url: imageUrl,
      ...(l.balance_after ? { balance_after: l.balance_after } : {}),
    }))),
    onSuccess: () => { setLed([]); qc.invalidateQueries({ queryKey: ['ledger_today'] }); },
  });

  const patch = (setter) => (i, changes) => setter((rs) => rs.map((x, j) => (j === i ? { ...x, ...changes } : x)));
  const drop = (setter) => (i) => setter((rs) => rs.filter((_, j) => j !== i));

  return (
    <section className="font-mono space-y-3" style={{ background: '#0B0906', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />

      <div className="px-3 space-y-3 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold tracking-[0.24em] flex items-center gap-1 shrink-0" style={{ color: '#E0A22E' }}>
            <Camera className="w-3 h-3" /> SCAN DESK
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
            className="px-3 py-1.5 border text-[8px] font-bold tracking-[0.16em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
            style={{ borderColor: '#8A6430', color: '#E0A22E' }}
          >
            {read.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} READ THE SCREEN
          </button>
        </div>

        <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>
          Upload a trade terminal, an inventory listing, or a transaction screen. The desk works out which it is,
          reads it, and sets every figure against what the books already say. Nothing is written until you commit it.
        </p>

        {read.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>{read.error?.message || 'That screen could not be read.'} Try a clearer shot.</p>}

        {result && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5 px-2" style={{ background: '#0D0A07', boxShadow: 'inset 0 0 0 1px #241C14' }}>
            <span className="text-[8px] tracking-[0.16em]" style={{ color: '#E0A22E' }}>{KIND_LABEL[result.kind] || 'A SCREEN'}</span>
            {result.station && <span className="text-[8px]" style={{ color: '#B8AC9A' }}>{result.station}</span>}
            <span className="text-[7px] tracking-[0.14em]" style={{ color: result.confidence === 'low' ? '#C05050' : '#5F564A' }}>
              READ {String(result.confidence || '').toUpperCase()}
            </span>
            {result.summary && <span className="text-[7px] w-full" style={{ color: '#6B6155' }}>{result.summary}</span>}
          </div>
        )}

        {mats.length > 0 && (
          <div className="space-y-1">
            <Head
              label="MATERIALS"
              meta={`${result?.counts?.new_materials || 0} NEW · ${result?.counts?.repriced || 0} REPRICED`}
            />
            {mats.map((m, i) => (
              <MaterialProposalRow key={i} m={m} onChange={(c) => patch(setMats)(i, c)} onDrop={() => drop(setMats)(i)} />
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[7px] tracking-[0.16em]" style={{ color: '#5F564A' }}>
                EXISTING MATERIALS ARE UPDATED IN PLACE — NEW ONES ARE ADDED TO THE CATALOGUE
              </span>
              <button
                disabled={commitMats.isPending}
                onClick={() => commitMats.mutate()}
                className="ml-auto px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
                style={{ borderColor: '#E0A22E', color: '#E0A22E' }}
              >
                {commitMats.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} WRITE {mats.length} MATERIALS
              </button>
            </div>
            {commitMats.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>Nothing was written — try again.</p>}
          </div>
        )}

        {led.length > 0 && (
          <div className="space-y-1">
            <Head label="LEDGER" meta={`${led.length} MOVEMENTS`} />
            {led.map((l, i) => (
              <LedgerProposalRow key={i} l={l} onChange={(c) => patch(setLed)(i, c)} onDrop={() => drop(setLed)(i)} />
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[7px] tracking-[0.16em]" style={{ color: '#5F564A' }}>
                THE SCREENSHOT IS FILED WITH EACH ENTRY AS ITS EVIDENCE
              </span>
              <button
                disabled={commitLed.isPending}
                onClick={() => commitLed.mutate()}
                className="ml-auto px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
                style={{ borderColor: '#E0A22E', color: '#E0A22E' }}
              >
                {commitLed.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} WRITE {led.length} ENTRIES
              </button>
            </div>
            {commitLed.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>Nothing was written — try again.</p>}
          </div>
        )}

        {result && !mats.length && !led.length && (
          <p className="text-[8px]" style={{ color: '#5F564A' }}>
            Nothing left to commit from this screen. Upload another.
          </p>
        )}
      </div>

      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />
    </section>
  );
}