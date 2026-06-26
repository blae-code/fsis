import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AGENT = 'fsis_operations_assistant';

function ToolLine({ call }) {
  const label = call.display_projection?.label || call.name || 'tool';
  const active = ['pending', 'running', 'in_progress'].includes(call.status);
  const failed = ['failed', 'error'].includes(call.status);
  return <div className="mt-1 text-[8px]" style={{ color: failed ? '#C05050' : active ? '#E0A22E' : '#8A8F45' }}>▸ {active ? call.display_projection?.active_label || label : failed ? call.display_projection?.error_label || `${label} failed` : label}</div>;
}

export default function OpsAssistantPanel() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const existing = await base44.agents.listConversations({ agent_name: AGENT });
      const convo = existing?.[0] || await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: 'FSIS Command Chat', description: 'Proprietor operations assistant' } });
      const full = await base44.agents.getConversation(convo.id);
      if (!alive) return;
      setConversation(full);
      setMessages(full.messages || []);
    }
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => setMessages(data.messages || []));
    return () => unsubscribe?.();
  }, [conversation?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !conversation || busy) return;
    setBusy(true);
    const content = text.trim();
    setText('');
    const fresh = await base44.agents.getConversation(conversation.id);
    await base44.agents.addMessage(fresh, { role: 'user', content });
    setBusy(false);
  };

  return (
    <section className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div className="flex items-center gap-2"><Bot className="w-4 h-4" style={{ color: '#E0A22E' }} /><div><div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>FSIS OPERATIONS ASSISTANT</div><p className="text-[9px]" style={{ color: '#8A7E6C' }}>Ask for order triage, stock risks, loot priorities, or market summaries.</p></div></div>
      <div className="h-56 overflow-y-auto border p-2 space-y-2" style={{ borderColor: '#2A2118', background: '#080604' }}>
        {messages.length === 0 && <p className="text-[9px]" style={{ color: '#7A6E60' }}>No command thread yet. Try: “What needs my attention today?”</p>}
        {messages.map((m, i) => <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}><div className="inline-block max-w-[92%] border px-2 py-1 text-[10px]" style={{ borderColor: m.role === 'user' ? '#5C4424' : '#3A2F20', color: '#D8CFC0', background: m.role === 'user' ? '#1A1209' : '#0C0A07' }}>{m.role === 'assistant' ? <ReactMarkdown>{m.content || ''}</ReactMarkdown> : m.content}{m.tool_calls?.map((c, idx) => <ToolLine key={idx} call={c} />)}</div></div>)}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Ask FSIS.bot…" className="flex-1 bg-transparent border px-2 py-2 text-[10px]" style={{ borderColor: '#3A2F20', color: '#EDE5D6' }} /><button disabled={busy || !text.trim()} onClick={send} className="border px-3 disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}><Send className="w-3.5 h-3.5" /></button></div>
    </section>
  );
}