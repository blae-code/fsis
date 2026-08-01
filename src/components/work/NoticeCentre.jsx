import React, { useState } from 'react';
import { listNotices } from '@/functions/listNotices';
import { markNoticesRead } from '@/functions/markNoticesRead';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import NoticeRow from '@/components/work/NoticeRow';

/**
 * What the collective owes this comrade in the way of being told.
 * A decision nobody is told about is a decision taken behind their back — so it is put in front of them.
 */
export default function NoticeCentre() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['my_notices'],
    queryFn: () => listNotices({ limit: 50 }).then((r) => r.data),
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: () => markNoticesRead({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my_notices'] }),
  });

  const notices = data?.notices || [];
  const unread = data?.unread || 0;

  return (
    <section className="border" style={{ borderColor: unread > 0 ? '#5C4424' : '#2E2519', background: '#0C0A07' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2"
      >
        <span className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>
          <Bell className="w-3.5 h-3.5" /> WHAT YOU ARE OWED NOTICE OF
          {unread > 0 && (
            <span
              className="px-1.5 py-0.5 text-[7px] font-bold tracking-[0.14em]"
              style={{ color: '#0C0A07', background: '#E0A22E' }}
            >
              {unread} UNREAD
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-3 h-3" style={{ color: '#7A6E60' }} /> : <ChevronDown className="w-3 h-3" style={{ color: '#7A6E60' }} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
            Every decision taken about your labour is reported here with its reason, who took it, and — where one
            stands — the date by which you may answer it. Nothing about you is decided in silence.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-5"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
          ) : notices.length === 0 ? (
            <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
              Nothing outstanding. Nothing has been decided about you that you have not been told.
            </p>
          ) : (
            <>
              <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                {notices.map((n) => <NoticeRow key={n.id} notice={n} />)}
              </div>
              {unread > 0 && (
                <button
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate()}
                  className="h-7 w-full border text-[8px] font-bold tracking-[0.14em] disabled:opacity-40"
                  style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
                >
                  {markRead.isPending ? 'MARKING…' : 'I HAVE READ THESE'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}