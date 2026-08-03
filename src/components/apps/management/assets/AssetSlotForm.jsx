import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { upsertVisualAsset } from '@/functions/upsertVisualAsset';
import { Loader2, Upload, X } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const KINDS = ['icon', 'badge', 'illustration', 'banner', 'portrait', 'texture', 'seal'];

/**
 * Putting a piece of work into a slot.
 *
 * Alt text is asked for on its own line and refused if empty, because an image without it is
 * decoration that has become information for everyone except the comrades it excludes. The maker's
 * name is a field, not a courtesy.
 */
export default function AssetSlotForm({ slot, asset, onDone, onClose }) {
  const [imageUrl, setImageUrl] = useState(asset?.image_url || '');
  const [altText, setAltText] = useState(asset?.alt_text || '');
  const [kind, setKind] = useState(asset?.kind || slot.kind || 'icon');
  const [theme, setTheme] = useState(asset?.theme || 'any');
  const [status, setStatus] = useState(asset?.status || 'placeholder');
  const [artist, setArtist] = useState(asset?.artist_handle || '');
  const [licence, setLicence] = useState(asset?.licence || '');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => upsertVisualAsset({
      slot_key: slot.key,
      image_url: imageUrl,
      alt_text: altText,
      kind,
      theme,
      status,
      artist_handle: artist,
      licence,
      notes,
    }).then((r) => r.data),
    onSuccess: onDone,
  });

  const err = save.error?.response?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto" style={{ background: 'rgba(4,3,2,0.86)' }}>
      <div className="w-full max-w-lg border my-4 font-mono" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: '#241C12' }}>
          <div className="text-[9px] tracking-[0.22em] truncate" style={{ color: '#E0A22E' }}>SLOT — {slot.key}</div>
          <button onClick={onClose} className="h-7 w-7 border inline-flex items-center justify-center" style={{ borderColor: '#2E2519', color: '#8A7E6C' }}>
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          <p className="text-[9px] leading-relaxed border px-2 py-1.5" style={{ color: '#C8A05B', borderColor: '#4A3A22', background: '#14100A' }}>
            {slot.guidance}
          </p>

          <label className="h-9 border px-2 text-[9px] tracking-[0.14em] flex items-center gap-2 cursor-pointer" style={box}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {imageUrl ? 'REPLACE THE FILE' : 'UPLOAD AN IMAGE'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="…or paste an image URL" className="h-9 border px-2 text-[9px] w-full" style={box} />
          {imageUrl && <img src={imageUrl} alt={altText || 'Preview of the work being placed'} className="w-full h-32 object-contain border" style={{ borderColor: '#241C12' }} />}

          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows={2}
            placeholder="Alt text — what this image says, for a comrade who cannot see it. Required."
            className="w-full border px-2 py-1.5 text-[9px]"
            style={box}
          />

          <div className="grid grid-cols-3 gap-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 border px-2 text-[9px]" style={box}>
              {KINDS.map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
            </select>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="h-9 border px-2 text-[9px]" style={box}>
              <option value="any">ANY GROUND</option>
              <option value="dark">DARK ONLY</option>
              <option value="light">LIGHT ONLY</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 border px-2 text-[9px]" style={box}>
              <option value="placeholder">PLACEHOLDER</option>
              <option value="live">LIVE</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Made by (handle)" className="h-9 border px-2 text-[9px]" style={box} />
            <input value={licence} onChange={(e) => setLicence(e.target.value)} placeholder="Terms it was given under" className="h-9 border px-2 text-[9px]" style={box} />
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for whoever comes next" className="h-9 border px-2 text-[9px] w-full" style={box} />

          {err?.error && (
            <div className="border p-2 text-[9px] leading-relaxed" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
              {err.error}
              {err.did_you_mean?.length > 0 && <div className="mt-1" style={{ color: '#C8A05B' }}>NEAREST REAL SLOTS: {err.did_you_mean.join(', ')}</div>}
            </div>
          )}

          <button
            disabled={save.isPending || uploading}
            onClick={() => save.mutate()}
            className="h-9 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#E0A22E', background: '#14100A' }}
          >
            {save.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            {asset ? 'PLACE IT — THE OLD ONE IS KEPT, RETIRED' : 'PLACE IT IN THE SLOT'}
          </button>
          <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
            Replacing never overwrites. The previous version is retired and kept on the record, so a change can be pointed at.
          </p>
        </div>
      </div>
    </div>
  );
}