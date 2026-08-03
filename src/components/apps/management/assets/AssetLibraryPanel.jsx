import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listVisualAssets } from '@/functions/listVisualAssets';
import { upsertVisualAsset } from '@/functions/upsertVisualAsset';
import { Images, Loader2 } from 'lucide-react';
import AssetSlotCard from '@/components/apps/management/assets/AssetSlotCard';
import AssetSlotForm from '@/components/apps/management/assets/AssetSlotForm';

const VIEWS = [
  { key: 'gaps', label: 'STILL WANTED' },
  { key: 'filled', label: 'MADE' },
  { key: 'all', label: 'EVERY SLOT' },
];

/**
 * The visual asset library.
 *
 * Reads the slots the app actually has room for — derived from its real enums, never a hand-written
 * list — and shows what has been made and what has not. The gaps are the useful half: each one
 * carries its brief, so an artist can be given a commission rather than a screenshot and a vague ask.
 */
export default function AssetLibraryPanel() {
  const qc = useQueryClient();
  const [view, setView] = useState('gaps');
  const [family, setFamily] = useState('');
  const [editing, setEditing] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['visual_assets'],
    queryFn: () => listVisualAssets({ include_unfilled: true }).then((r) => r.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['visual_assets'] });
  const retire = useMutation({
    mutationFn: (slotKey) => upsertVisualAsset({ slot_key: slotKey, retire: true }),
    onSuccess: refresh,
  });

  const rows = useMemo(() => {
    const unfilled = (data?.unfilled || []).map((slot) => ({ slot, asset: null }));
    const filled = Object.values(data?.assets || {}).map((asset) => ({
      slot: {
        key: asset.slot_key,
        family: asset.slot_key.split('.')[0],
        family_label: asset.slot_key.split('.')[0].replace(/_/g, ' '),
        kind: asset.kind,
        guidance: '',
      },
      asset,
    }));
    const all = view === 'gaps' ? unfilled : view === 'filled' ? filled : [...filled, ...unfilled];
    return (family ? all.filter((r) => r.slot.family === family) : all)
      .sort((a, b) => a.slot.key.localeCompare(b.slot.key));
  }, [data, view, family]);

  const families = useMemo(() => {
    const keys = [
      ...(data?.unfilled || []).map((s) => s.family),
      ...Object.keys(data?.assets || {}).map((k) => k.split('.')[0]),
    ];
    return [...new Set(keys)].sort();
  }, [data]);

  const errText = error?.response?.data?.error || error?.message;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Images className="w-3.5 h-3.5" /> VISUAL ASSET LIBRARY
      </div>

      <p className="text-[9px] max-w-3xl leading-relaxed" style={{ color: '#8A7E6C' }}>
        Every slot here is optional and every one degrades: a slot with nothing in it renders as its
        absence, and no figure in this app is ever carried by an image alone. Slots come from the app's
        own lists, so the day a new category is added its slot appears here unfilled rather than being
        forgotten. Alt text is required, and the hand that made the work is credited — an asset is
        labour like any other.
      </p>

      <div className="grid grid-cols-3 gap-2 max-w-md">
        {[
          { label: 'MADE', value: data?.filled_count ?? '—', color: '#8A8F45' },
          { label: 'STILL WANTED', value: data?.unfilled_count ?? '—', color: '#C8893B' },
          { label: 'SLOTS IN ALL', value: data?.slot_count ?? '—', color: '#6FA0C8' },
        ].map((s) => (
          <div key={s.label} className="border p-1.5" style={{ borderColor: '#241C12', background: '#0C0A07' }}>
            <div className="text-[7px] tracking-[0.18em]" style={{ color: '#6B6155' }}>{s.label}</div>
            <div className="text-[15px]" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em]"
            style={{
              borderColor: view === v.key ? '#E0A22E' : '#2E2519',
              color: view === v.key ? '#E0A22E' : '#7A6E60',
              background: view === v.key ? '#E0A22E1A' : '#0C0A07',
            }}
          >
            {v.label}
          </button>
        ))}
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="h-8 border px-2 text-[8px] tracking-[0.12em] ml-auto"
          style={{ borderColor: '#2E2519', background: '#0C0A07', color: '#A89C8A' }}
        >
          <option value="">EVERY FAMILY</option>
          {families.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
      </div>

      {errText && (
        <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>{errText}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : rows.length === 0 ? (
        <p className="text-[9px] py-6 text-center border" style={{ color: '#6B6155', borderColor: '#241C12' }}>
          {view === 'gaps' ? 'Every slot in this family has work in it.' : 'Nothing made here yet.'}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {rows.map((r) => (
            <AssetSlotCard
              key={r.slot.key}
              slot={r.slot}
              asset={r.asset}
              retiring={retire.isPending}
              onEdit={(slot, asset) => setEditing({ slot, asset })}
              onRetire={(key) => retire.mutate(key)}
            />
          ))}
        </div>
      )}

      {editing && (
        <AssetSlotForm
          slot={editing.slot}
          asset={editing.asset}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}