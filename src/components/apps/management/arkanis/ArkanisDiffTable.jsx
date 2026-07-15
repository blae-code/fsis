import React from 'react';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const DIM = '#5A4A34';

const CATEGORIES = [
  ['salvage_commodity', 'SALVAGE COMMODITY'],
  ['fabricated', 'FABRICATED'],
  ['fps_gear', 'FPS GEAR'],
  ['weapon', 'WEAPON'],
  ['ship_component', 'SHIP COMPONENT'],
  ['vehicle_component', 'VEHICLE COMPONENT'],
];

/** Editable review table: matched rows show a stock diff, unmatched rows
 *  become new listings with an assignable category and price. */
export default function ArkanisDiffTable({ rows, setRows }) {
  const edit = (i, patch) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-1 font-mono">
      {rows.map((r, i) => {
        const resulting = r.match ? (r.action === 'add' ? r.match.stock + r.quantity : r.quantity) : r.quantity;
        return (
          <div key={`${r.name}-${i}`} className="border rounded px-3 py-2 flex flex-wrap items-center gap-3" style={{ borderColor: r.include ? (r.match ? `${GREEN}30` : `${AMBER}35`) : 'hsl(33,18%,14%)', background: 'hsl(30,10%,7%)', opacity: r.include ? 1 : 0.45 }}>
            <input type="checkbox" checked={r.include} onChange={(e) => edit(i, { include: e.target.checked })} className="accent-[#E0A22E]" />
            <div className="flex-1 min-w-[160px]">
              <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>
                {r.name}
                {r.match?.code && <span className="ml-1.5 text-[8px] px-1 rounded" style={{ background: '#3A2A14', color: AMBER }}>{r.match.code}</span>}
              </div>
              <div className="text-[8px]" style={{ color: r.match ? GREEN : AMBER }}>
                {r.match ? 'MATCHED — STOCK UPDATE' : 'NEW LISTING'} {r.condition_pct < 100 && <span style={{ color: DIM }}>· COND {r.condition_pct}%</span>}
              </div>
            </div>

            <div className="shrink-0">
              <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>QTY</div>
              <input
                type="number" min="0"
                value={r.quantity}
                onChange={(e) => edit(i, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                className="h-7 w-16 px-2 text-xs font-bold bg-transparent border rounded outline-none"
                style={{ borderColor: '#3A2F20', color: '#EDE5D6' }}
              />
            </div>

            {r.match ? (
              <>
                <div className="shrink-0">
                  <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>MODE</div>
                  <select
                    value={r.action}
                    onChange={(e) => edit(i, { action: e.target.value })}
                    className="h-7 px-1 text-[9px] bg-[#0C0A07] border rounded"
                    style={{ borderColor: '#3A2F20', color: '#EDE5D6' }}
                  >
                    <option value="set">SET</option>
                    <option value="add">ADD</option>
                  </select>
                </div>
                <div className="w-28 text-right shrink-0">
                  <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>STOCK</div>
                  <span className="text-[10px] font-bold" style={{ color: resulting === r.match.stock ? DIM : GREEN }}>
                    {r.match.stock.toLocaleString()} → {resulting.toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="shrink-0">
                  <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>CATEGORY</div>
                  <select
                    value={r.category}
                    onChange={(e) => edit(i, { category: e.target.value })}
                    className="h-7 px-1 text-[9px] bg-[#0C0A07] border rounded"
                    style={{ borderColor: '#3A2F20', color: '#EDE5D6' }}
                  >
                    {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="shrink-0">
                  <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>PRICE aUEC</div>
                  <input
                    type="number" min="0"
                    value={r.price_auec}
                    onChange={(e) => edit(i, { price_auec: Math.max(0, Number(e.target.value) || 0) })}
                    className="h-7 w-24 px-2 text-xs bg-transparent border rounded outline-none"
                    style={{ borderColor: '#3A2F20', color: '#EDE5D6' }}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}