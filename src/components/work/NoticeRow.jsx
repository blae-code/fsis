import React from 'react';
import { noticeMeta, agoLabel } from '@/components/work/noticeMeta';

/** One thing the collective decided, told to the comrade it was decided about. */
export default function NoticeRow({ notice }) {
  const meta = noticeMeta(notice.kind);
  const unread = !notice.read_at;

  return (
    <div
      className="border-l-2 pl-2.5 py-1.5 pr-2"
      style={{ borderColor: unread ? meta.color : '#2E2519', background: unread ? `${meta.color}0A` : 'transparent' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em]"
          style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}
        >
          {meta.label}
        </span>
        <span className="text-[7px] tracking-[0.14em]" style={{ color: '#6B6155' }}>{agoLabel(notice.created_date)}</span>
        {unread && <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />}
      </div>

      <div className="text-[11px] mt-1 leading-snug" style={{ color: '#EDE5D6' }}>{notice.title}</div>
      {notice.body && (
        <p className="text-[9px] mt-0.5 leading-relaxed whitespace-pre-line" style={{ color: '#A89C8A' }}>{notice.body}</p>
      )}
      {notice.actor_email && (
        <div className="text-[7px] tracking-[0.14em] mt-1" style={{ color: '#6B6155' }}>
          DECIDED BY {notice.actor_email.toUpperCase()}
          {notice.actor_role ? ` · ${notice.actor_role.toUpperCase()}` : ''}
        </div>
      )}
    </div>
  );
}