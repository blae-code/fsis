import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BadgeCheck, IdCard, Save } from 'lucide-react';
import { upsertFsisProfile } from '@/functions/upsertFsisProfile';
import { storeCache } from '@/lib/localCache';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

export default function BuyerProfilePanel({ profile, onProfileSaved }) {
  const [open, setOpen] = useState(!profile?.profile_key);
  const [form, setForm] = useState({
    handle: profile?.handle || '',
    display_name: profile?.display_name || '',
    contact_method: profile?.contact_method || 'spectrum',
    contact_handle: profile?.contact_handle || '',
    preferred_location: profile?.preferred_location || '',
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await upsertFsisProfile({ ...form, profile_key: profile?.profile_key });
      return res.data.profile;
    },
    onSuccess: (saved) => {
      storeCache.setProfile(saved);
      onProfileSaved(saved);
      setOpen(false);
    },
  });

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="border font-mono" style={{ borderColor: profile?.profile_key ? '#8A8F45' : '#5C4424', background: 'rgba(12, 10, 7, 0.82)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)' }}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-3 flex items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2">
          <IdCard className="w-4 h-4" style={{ color: '#E0A22E' }} />
          <span>
            <span className="block text-[9px] tracking-[0.22em] font-bold" style={{ color: '#8A8F45' }}>OPTIONAL FSIS PROFILE</span>
            <span className="block text-[10px]" style={{ color: '#A89C8A' }}>{profile?.profile_key ? `Linked as ${profile.handle}` : 'Create a local FSIS profile without a Base44 account'}</span>
          </span>
        </span>
        {profile?.profile_key && <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: '#8A8F45' }}><BadgeCheck className="w-3.5 h-3.5" /> LINKED</span>}
      </button>

      {open && (
        <div className="border-t p-3 grid md:grid-cols-[1fr_1fr_0.8fr_1fr_auto] gap-2" style={{ borderColor: '#3A2F20' }}>
          <input value={form.handle} onChange={(e) => patch('handle', e.target.value)} placeholder="RSI handle" className="h-9 px-3 text-[10px] border outline-none" style={fieldStyle} />
          <input value={form.display_name} onChange={(e) => patch('display_name', e.target.value)} placeholder="Display name" className="h-9 px-3 text-[10px] border outline-none" style={fieldStyle} />
          <select value={form.contact_method} onChange={(e) => patch('contact_method', e.target.value)} className="h-9 px-3 text-[10px] border outline-none" style={fieldStyle}>
            <option value="spectrum">Spectrum</option>
            <option value="discord">Discord</option>
            <option value="in_game">In-game</option>
            <option value="other">Other</option>
            <option value="none">No contact</option>
          </select>
          <input value={form.contact_handle} onChange={(e) => patch('contact_handle', e.target.value)} placeholder="Contact handle" className="h-9 px-3 text-[10px] border outline-none" style={fieldStyle} />
          <button disabled={save.isPending || !form.handle.trim()} onClick={() => save.mutate()} className="h-9 px-3 border text-[9px] font-bold tracking-[0.14em] flex items-center justify-center gap-1 disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45', background: '#0C0A07' }}>
            <Save className="w-3 h-3" /> {save.isPending ? 'SAVING' : 'SAVE'}
          </button>
          {save.isError && <p className="md:col-span-5 text-[9px]" style={{ color: '#C05050' }}>{save.error?.response?.data?.error || 'Profile save failed.'}</p>}
          <p className="md:col-span-5 text-[9px] leading-relaxed" style={{ color: '#6B6155' }}>This is the custom FSIS profile table. It is not the Base44 native user table and does not create a login account.</p>
        </div>
      )}
    </section>
  );
}