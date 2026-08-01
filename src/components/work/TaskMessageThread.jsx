import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';

/**
 * A plain exchange on a single task. A comrade may ask what the work involves before taking it up,
 * and answer for themselves when it is sent back — no worker should have to guess at the council's
 * meaning, and no ruling should be made on one side of a silence.
 */
export default function TaskMessageThread({ task, as, actor }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const { data: messages = [] } = useQuery({
    queryKey: ['task_messages', task.id],
    queryFn: () => base44.entities.task_message.filter({ task_id: task.id }, 'created_date', 100),
    enabled: open,
  });

  const send = useMutation({
    mutationFn: (message) => base44.entities.task_message.create({
      task_id: task.id,
      task_title: task.title,
      worker_user_id: task.assigned_user_id || actor?.id || '',
      sender: as,
      sender_handle: actor?.full_name || actor?.email || '',
      sender_email: actor?.email || '',
      message,
    }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['task_messages', task.id] });
    },
  });

  return (
    <div className="border-t pt-2" style={{ borderColor: '#2E2519' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.12em]"
        style={{ color: '#6FA0C8' }}
      >
        <MessageSquare className="w-2.5 h-2.5" /> {open ? 'CLOSE THE THREAD' : 'SPEAK ON THIS WORK'}
      </button>

      {open && (
        <div className="mt-1.5 space-y-1.5">
          {messages.length === 0 ? (
            <p className="text-[8px]" style={{ color: '#6B6155' }}>Nothing said yet. Ask plainly.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-auto">
              {messages.map((m) => (
                <div key={m.id} className="border-l pl-2" style={{ borderColor: m.sender === 'council' ? '#5C4424' : '#2E4055' }}>
                  <div className="text-[7px] tracking-[0.14em]" style={{ color: m.sender === 'council' ? '#C8A05B' : '#6FA0C8' }}>
                    {m.sender === 'council' ? 'COUNCIL' : 'WORKER'} · {m.sender_handle || m.sender_email}
                  </div>
                  <p className="text-[9px] leading-snug" style={{ color: '#A89C8A' }}>{m.message}</p>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder={as === 'council' ? 'Answer the worker' : 'Ask about this work'}
            className="w-full border px-2 py-1.5 text-[10px]"
            style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
          />
          <button
            disabled={send.isPending || !text.trim()}
            onClick={() => send.mutate(text.trim())}
            className="h-7 w-full border text-[8px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
          >
            {send.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null} SEND
          </button>
          {send.error && (
            <p className="text-[8px]" style={{ color: '#D08A6A' }}>{send.error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}