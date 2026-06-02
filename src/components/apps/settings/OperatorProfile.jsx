import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Check, User as UserIcon } from 'lucide-react';

export default function OperatorProfile() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ handle: '', org_role: '', org_tier: '', avatar_url: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: tiers = [] } = useQuery({
    queryKey: ['pricing_tiers_all'],
    queryFn: () => base44.entities.pricing_tier.list(),
  });

  useEffect(() => {
    if (user) {
      setForm({
        handle: user.handle || '',
        org_role: user.org_role || '',
        org_tier: user.org_tier || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    queryClient.invalidateQueries({ queryKey: ['user'] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (label, key, placeholder) => (
    <div>
      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="h-8 text-xs font-mono mt-1"
        style={{ borderColor: 'hsl(170, 25%, 18%)' }}
      />
    </div>
  );

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
        <div
          className="w-12 h-12 rounded flex items-center justify-center overflow-hidden shrink-0"
          style={{ background: 'hsl(180, 12%, 12%)', border: '1px solid hsl(170, 25%, 18%)' }}
        >
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="text-sm text-foreground">{form.handle || user?.full_name || 'Operator'}</div>
          <div className="text-[10px] text-muted-foreground">{user?.email}</div>
        </div>
      </div>

      {field('Handle / Callsign', 'handle', 'e.g. Scrapper_01')}
      {field('Org Role', 'org_role', 'e.g. Salvage Operator')}

      <div>
        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Pricing Tier</Label>
        <Select value={form.org_tier} onValueChange={(v) => setForm({ ...form, org_tier: v })}>
          <SelectTrigger className="h-8 text-xs font-mono mt-1" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
            <SelectValue placeholder="Select tier" />
          </SelectTrigger>
          <SelectContent>
            {tiers.map((t) => (
              <SelectItem key={t.id} value={t.tier_name}>{t.tier_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {field('Avatar URL', 'avatar_url', 'https://...')}

      <Button
        onClick={handleSave}
        disabled={saving}
        variant="outline"
        size="sm"
        className="w-full font-mono text-xs gap-2 mt-2"
        style={{ borderColor: 'hsl(170, 25%, 18%)' }}
      >
        {saved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? 'Saved' : saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}