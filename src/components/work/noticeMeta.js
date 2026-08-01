/** Visual language for notice — grouped by what happened to the comrade, not by what sent it. */
export const NOTICE_META = {
  work_claimed:          { label: 'WORK TAKEN UP',   color: '#6FA0C8' },
  work_returned:         { label: 'SENT BACK',       color: '#C05050' },
  work_credited:         { label: 'PAID IN FULL',    color: '#8A8F45' },
  work_released:         { label: 'HANDED BACK',     color: '#C8893B' },
  claim_lapsed:          { label: 'CLAIM LAPSED',    color: '#C8893B' },
  standing_marked:       { label: 'STANDING MARK',   color: '#C05050' },
  standing_lapsed:       { label: 'MARK LAPSED',     color: '#8A8F45' },
  trade_marked:          { label: 'TRADE MARK',      color: '#C05050' },
  trade_standing_lapsed: { label: 'TRADE MARK LAPSED', color: '#8A8F45' },
  appeal_answered:       { label: 'APPEAL ANSWERED', color: '#E0A22E' },
  muster_called:         { label: 'MUSTER CALLED',   color: '#6FA0C8' },
  muster_reminder:       { label: 'MUSTER SOON',     color: '#6FA0C8' },
  muster_stood_down:     { label: 'STOOD DOWN',      color: '#7A6E60' },
  payday_opened:         { label: 'PAY DAY OPEN',    color: '#E0A22E' },
  payday_published:      { label: 'PAY DAY POSTED',  color: '#8A8F45' },
  order_update:          { label: 'ORDER',           color: '#C8A05B' },
  council_message:       { label: 'FROM THE COUNCIL', color: '#C8A05B' },
};

export const noticeMeta = (kind) => NOTICE_META[kind] || NOTICE_META.council_message;

/** Plain relative time — a comrade reads "3 days ago", not a timestamp. */
export function agoLabel(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}