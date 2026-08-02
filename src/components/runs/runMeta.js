/** Shared visual language for live runs. */
export const RUN_STATUS_META = {
  underway: { label: 'UNDERWAY', color: '#8A8F45' },
  closed:   { label: 'SETTLED',  color: '#7A6E60' },
  abandoned:{ label: 'ENDED UNSETTLED', color: '#C05050' },
};

export const fmtAuec = (n) => `${Math.round(Number(n) || 0).toLocaleString()} aUEC`;

/** Minutes as a clock reading — presence is a clock, never a productivity measure. */
export function fmtMinutes(minutes) {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}