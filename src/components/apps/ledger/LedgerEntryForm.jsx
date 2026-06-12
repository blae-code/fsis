import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Paperclip, X } from 'lucide-react';

export const CATEGORIES = {
  salvage_sale: 'Salvage Sale',
  order_fulfillment: 'Order Fulfillment',
  hauling: 'Hauling',
  fuel: 'Fuel',
  repairs: 'Repairs',
  fees_fines: 'Fees / Fines',
  equipment: 'Equipment',
  crew_pay: 'Crew Pay',
  ship_rental: 'Ship Rental',
  other: 'Other',
};

const EMPTY = {
  entry_type: 'income',
  category: 'salvage_sale',
  amount_auec: '',
  description: '',
  counterparty: '',
  entry_date: new Date().toISOString().slice(0, 10),
};

export default function LedgerEntryForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAttach = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setScreenshotUrl(file_url);
    setUploading(false);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.ledger_entry.create({
        ...form,
        amount_auec: parseFloat(form.amount_auec),
        source: 'manual',
        ...(screenshotUrl ? { screenshot_url: screenshotUrl } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      setForm({ ...EMPTY, entry_type: form.entry_type, entry_date: form.entry_date });
      setScreenshotUrl(null);
    },
  });

  return (
    <div className="p-3 border-b space-y-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
      <div className="text-[9px] text-muted-foreground tracking-[0.2em]">NEW LEDGER ENTRY</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Select value={form.entry_type} onValueChange={(v) => set('entry_type', v)}>
          <SelectTrigger className="h-8 text-[10px] font-mono"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income" className="text-xs">Income</SelectItem>
            <SelectItem value="expense" className="text-xs">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.category} onValueChange={(v) => set('category', v)}>
          <SelectTrigger className="h-8 text-[10px] font-mono"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORIES).map(([k, label]) => (
              <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number" min="0" placeholder="aUEC"
          value={form.amount_auec}
          onChange={(e) => set('amount_auec', e.target.value)}
          className="h-8 text-[10px] font-mono"
        />
        <Input
          placeholder="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="h-8 text-[10px] font-mono"
        />
        <Input
          placeholder="Counterparty"
          value={form.counterparty}
          onChange={(e) => set('counterparty', e.target.value)}
          className="h-8 text-[10px] font-mono"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={form.entry_date}
            onChange={(e) => set('entry_date', e.target.value)}
            className="h-8 text-[10px] font-mono flex-1"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAttach(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 font-mono text-[10px] shrink-0"
            title={screenshotUrl ? 'Screenshot attached — click to remove' : 'Attach screenshot evidence'}
            style={screenshotUrl ? { borderColor: 'hsl(38, 50%, 35%)', color: 'hsl(42, 85%, 60%)' } : undefined}
            disabled={uploading}
            onClick={() => (screenshotUrl ? setScreenshotUrl(null) : fileRef.current?.click())}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : screenshotUrl ? <X className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 font-mono text-[10px] shrink-0"
            disabled={!form.amount_auec || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}