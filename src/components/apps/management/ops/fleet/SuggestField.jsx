import React, { useEffect, useId, useState } from 'react';

const field = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };

/**
 * A field that offers what the yard already knows. Typing is still allowed —
 * the list is a memory aid, never a fence around what can be entered.
 * With commitOnBlur the value is only written once the hand leaves the field,
 * so an edited record is not saved letter by letter.
 */
export default function SuggestField({ value, onChange, options = [], placeholder, className = '', commitOnBlur = false, ...rest }) {
  const id = useId();
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);

  const live = commitOnBlur ? draft : (value ?? '');
  const handle = (v) => {
    setDraft(v);
    if (!commitOnBlur) onChange(v);
  };

  return (
    <>
      <input
        list={id}
        value={live}
        onChange={(e) => handle(e.target.value)}
        onBlur={() => { if (commitOnBlur && draft !== (value ?? '')) onChange(draft); }}
        placeholder={placeholder}
        autoComplete="off"
        className={`h-7 border px-2 text-[9px] ${className}`}
        style={field}
        {...rest}
      />
      <datalist id={id}>
        {options.filter(Boolean).map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}