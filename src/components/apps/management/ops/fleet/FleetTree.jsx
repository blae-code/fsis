import React from 'react';
import FleetNodeRow from './FleetNodeRow';

/** The order of battle, drawn as it is flown: leads at the top, wings folded beneath them. */
export default function FleetTree({ nodes, openIds, onToggle, onSelect, selectedId, checkedIds, onCheck, depth = 0 }) {
  return (
    <div className="space-y-0.5">
      {nodes.map((n) => {
        const open = openIds.has(n.id);
        return (
          <div key={n.id}>
            <FleetNodeRow
              node={n}
              depth={depth}
              open={open}
              onToggle={onToggle}
              onSelect={onSelect}
              selected={selectedId === n.id}
              checked={checkedIds.has(n.id)}
              onCheck={onCheck}
            />
            {open && n.children.length > 0 && (
              <FleetTree
                nodes={n.children}
                openIds={openIds}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedId={selectedId}
                checkedIds={checkedIds}
                onCheck={onCheck}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}