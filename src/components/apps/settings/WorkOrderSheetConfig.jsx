import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, TableProperties } from 'lucide-react';

const SETTING_KEY = 'work_order_log_sheet_id';

export default function WorkOrderSheetConfig() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['app_setting', SETTING_KEY],
    queryFn: () => base44.entities.app_setting.filter({ key: SETTING_KEY }),
    onSuccess: (data) => { if (data[0]) setDraft(data[0].value || ''); },
  });

  const existing = settings[0];

  // initialise draft from fetched value once
  React.useEffect(() => {
    if (existing?.value && !draft) setDraft(existing.value);
  }, [existing]);

  const save = async () => {
    if (existing) {
      await base44.entities.app_setting.update(existing.id, { value: draft.trim() });
    } else {
      await base44.entities.app_setting.create({ key: SETTING_KEY, value: draft.trim() });
    }
    queryClient.invalidateQueries({ queryKey: ['app_setting', SETTING_KEY] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="border p-4 space-y-3 font-mono"
      style={{ background: '#111009', borderColor: '#2A2118', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)' }}>

      <div className="flex items-center gap-2">
        <TableProperties className="w-4 h-4" style={{ color: '#6FA08F' }} />
        <span className="text-[11px] font-bold tracking-[0.18em]" style={{ color: '#D8CFC0' }}>GOOGLE SHEETS — WORK ORDER LOG</span>
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: '#7A6E60' }}>
        When a work order is marked as settled, FSIS.bot will append a payout row to a sheet named
        <span style={{ color: '#6FA08F' }}> "Work Orders"</span> in the linked spreadsheet.
        Paste the Spreadsheet ID from the URL (the long string between <code>/d/</code> and <code>/edit</code>).
      </p>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          className="h-8 text-[11px] font-mono flex-1"
          style={{ background: '#0C0A07', borderColor: '#3A2E1E', color: '#EDE5D6' }}
        />
        <Button
          onClick={save}
          disabled={!draft.trim()}
          size="sm"
          className="h-8 text-[10px] font-mono gap-1.5 px-3"
          style={{ background: saved ? '#3A5A4A' : 'linear-gradient(160deg,#8A6430,#4A3722)', color: '#F2EADC', border: 'none' }}
        >
          {saved ? <><Check className="w-3 h-3" /> SAVED</> : 'SAVE'}
        </Button>
      </div>

      {existing?.value && (
        <p className="text-[9px]" style={{ color: '#5C4A33' }}>
          Current: {existing.value}
        </p>
      )}
    </div>
  );
}