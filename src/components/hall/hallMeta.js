/** Shared visual language for the hall, so a lot reads the same wherever it appears. */
export const LOT_STATUS_META = {
  draft:      { label: 'DRAFT',        color: '#6B6155' },
  listed:     { label: 'ON THE FLOOR', color: '#E0A22E' },
  bidding:    { label: 'BIDDING',      color: '#6FA0C8' },
  won:        { label: 'WON',          color: '#8A8F45' },
  reserve_not_met: { label: 'RESERVE NOT MET', color: '#7A6E60' },
  no_bids:    { label: 'NO BIDS',      color: '#7A6E60' },
  expired:    { label: 'EXPIRED',      color: '#7A6E60' },
  settled:    { label: 'SETTLED',      color: '#8A8F45' },
  withdrawn:  { label: 'WITHDRAWN',    color: '#C05050' },
  disputed:   { label: 'IN DISPUTE',   color: '#C05050' },
};

export const CONDITION_COLOR = {
  new: '#6FA05B',
  refurbished: '#5BA08F',
  used: '#C8893B',
  worn: '#C05050',
};

export const fmtAuec = (n) => `${Math.round(Number(n) || 0).toLocaleString()} aUEC`;

/** How long a lot has left, in words rather than a raw timestamp. */
export function timeLeft(closesAt) {
  if (!closesAt) return '';
  const ms = new Date(closesAt) - Date.now();
  if (ms <= 0) return 'CLOSED';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}M LEFT`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}H ${mins % 60}M LEFT`;
  return `${Math.floor(hours / 24)}D LEFT`;
}

/** Closing soon enough that a comrade watching should be told plainly. */
export const closingSoon = (closesAt) =>
  !!closesAt && new Date(closesAt) - Date.now() < 3600000 && new Date(closesAt) > Date.now();