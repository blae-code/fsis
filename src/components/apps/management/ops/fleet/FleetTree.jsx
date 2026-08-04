import React from 'react';
import FleetNodeRow from './FleetNodeRow';

/** The order of battle, drawn as it is flown: leads at the top, wings folded beneath them. */
export default function FleetTree({ nodes, openIds, onToggle, onSelect, selectedId, depth = 0 }) {
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
            />
            {open && n.children.length > 0 && (
              <FleetTree
                nodes={n.children}
                openIds={openIds}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedId={selectedId}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}