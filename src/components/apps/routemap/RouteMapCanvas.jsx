import React from 'react';

/**
 * SVG starmap: origin system node on the left, destination terminals fanned
 * out on the right, jump lines weighted by rank (best = brightest).
 * props: originSystem (string), routes (deduped, sorted best-first)
 */
export default function RouteMapCanvas({ originSystem, routes }) {
  const W = 640;
  const H = Math.max(260, routes.length * 64 + 40);
  const ox = 90;
  const oy = H / 2;

  return (
    <div className="rounded border overflow-hidden" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 12%, 4%)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 420 }}>
        {/* grid backdrop */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`g${i}`} x1={(i + 1) * (W / 9)} y1="0" x2={(i + 1) * (W / 9)} y2={H} stroke="hsl(33, 18%, 18%)" strokeWidth="0.5" opacity="0.3" />
        ))}

        {/* jump lines */}
        {routes.map((r, i) => {
          const ty = 30 + i * ((H - 60) / Math.max(1, routes.length - 1) || 1);
          const tx = W - 200;
          const best = i === 0;
          const mx = (ox + tx) / 2;
          return (
            <g key={r.id || i}>
              <path
                d={`M ${ox + 14} ${oy} Q ${mx} ${(oy + ty) / 2 - 20} ${tx - 10} ${ty}`}
                fill="none"
                stroke={best ? 'hsl(42, 85%, 60%)' : 'hsl(35, 50%, 42%)'}
                strokeWidth={best ? 2 : 1}
                strokeDasharray={best ? 'none' : '4 4'}
                opacity={best ? 0.9 : 0.35}
              />
              {/* distance label */}
              <text x={mx} y={(oy + ty) / 2 - 26} textAnchor="middle" fontSize="8" fontFamily="monospace" fill={best ? 'hsl(42, 85%, 60%)' : 'hsl(35, 12%, 52%)'}>
                {r.distance ? `${Number(r.distance).toLocaleString()} u` : '—'}
              </text>
              {/* destination node */}
              <circle cx={tx} cy={ty} r={best ? 5 : 3.5} fill={best ? 'hsl(42, 85%, 60%)' : 'hsl(30, 12%, 8%)'} stroke="hsl(35, 50%, 42%)" strokeWidth="1.2" />
              <text x={tx + 12} y={ty + 1} fontSize="9" fontFamily="monospace" fill="hsl(38, 25%, 85%)">
                {r.destination_terminal}
              </text>
              <text x={tx + 12} y={ty + 11} fontSize="7" fontFamily="monospace" fill="hsl(35, 12%, 52%)">
                {r.destination_system || ''} {r.profit_per_scu ? `• +${Number(r.profit_per_scu).toLocaleString()}/SCU` : ''}
              </text>
            </g>
          );
        })}

        {/* origin node */}
        <circle cx={ox} cy={oy} r="10" fill="hsl(38, 72%, 52%, 0.15)" stroke="hsl(42, 85%, 60%)" strokeWidth="1.5" />
        <circle cx={ox} cy={oy} r="3" fill="hsl(42, 85%, 60%)" />
        <text x={ox} y={oy + 26} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="hsl(42, 85%, 60%)">
          {originSystem?.toUpperCase() || 'ORIGIN'}
        </text>
        <text x={ox} y={oy + 36} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="hsl(35, 12%, 52%)">
          CURRENT SYSTEM
        </text>
      </svg>
    </div>
  );
}