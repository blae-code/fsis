import React, { useState } from 'react';
import FormRow, { FormBand } from '@/components/apps/management/ops/fleet/FormRow';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };

/** Open a run on the bench: what to make, how many, and how urgently it is wanted. */
export default function FabProjectForm({ recipes, onCreate, pending }) {
  const [name, setName] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [qty, setQty] = useState(1);
  const [priority, setPriority] = useState('routine');
  const [bench, setBench] = useState('');
  const [due, setDue] = useState('');
  const [lines, setLines] = useState([]);

  const addLine = () => {
    if (!recipeName.trim()) return;
    const hit = recipes.find((r) => r.item_name === recipeName);
    setLines([...lines, { recipe_id: hit?.id || '', item_name: recipeName, quantity: Number(qty) || 1 }]);
    setRecipeName('');
    setQty(1);
  };

  const submit = () => {
    if (!name.trim() || !lines.length) return;
    onCreate({
      project_name: name.trim(),
      items: lines,
      status: 'planning',
      priority,
      bench_location: bench,
      due_date: due || undefined,
    });
    setName(''); setLines([]); setBench(''); setDue('');
  };

  return (
    <FormBand glyph="✛" title="OPEN A RUN" note="A run states what is to be made before any of it is gathered — a bench queue nobody wrote down is a bench queue somebody forgets.">
      <FormRow label="RUN NAME" hint="WHAT THE BENCH CALLS IT">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Medpen batch — Saturday" className="h-7 border px-2 text-[9px]" style={CONTROL} />
      </FormRow>
      <FormRow label="PRIORITY" hint="WHAT COMES FIRST">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL}>
          <option value="routine">ROUTINE</option>
          <option value="elevated">ELEVATED</option>
          <option value="urgent">URGENT</option>
        </select>
      </FormRow>
      <FormRow label="BENCH" hint="WHERE THE WORK HAPPENS">
        <input value={bench} onChange={(e) => setBench(e.target.value)} placeholder="e.g. base fabricator" className="h-7 border px-2 text-[9px]" style={CONTROL} />
      </FormRow>
      <FormRow label="WANTED BY" hint="OPTIONAL">
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL} />
      </FormRow>

      <FormRow label="ADD RECIPE" hint={`${lines.length} QUEUED ON THIS RUN`} span>
        <div className="flex gap-1">
          <input
            list="fab-recipe-list"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="item to craft"
            className="flex-1 h-7 border px-2 text-[9px]"
            style={CONTROL}
          />
          <datalist id="fab-recipe-list">
            {recipes.map((r) => <option key={r.id} value={r.item_name} />)}
          </datalist>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-16 h-7 border px-2 text-[9px]" style={CONTROL} />
          <button onClick={addLine} className="px-2 text-[8px] tracking-[0.16em]" style={{ boxShadow: 'inset 0 0 0 1px #2E2519', color: '#8A7E6C' }}>ADD</button>
        </div>
      </FormRow>

      {lines.length > 0 && (
        <FormRow label="ON THIS RUN" hint="TAP TO REMOVE" span>
          <div className="flex flex-wrap gap-1">
            {lines.map((l, i) => (
              <button
                key={i}
                onClick={() => setLines(lines.filter((_, n) => n !== i))}
                className="px-1.5 py-0.5 text-[7px]"
                style={{ boxShadow: 'inset 0 0 0 1px #3A2F20', color: '#EDE5D6' }}
              >
                {l.quantity} × {l.item_name} ✕
              </button>
            ))}
          </div>
        </FormRow>
      )}

      <FormRow label="" hint="" span>
        <button
          disabled={pending || !name.trim() || !lines.length}
          onClick={submit}
          className="h-7 px-3 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
          style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
        >
          {pending ? 'OPENING…' : 'OPEN RUN ON THE BENCH'}
        </button>
      </FormRow>
    </FormBand>
  );
}