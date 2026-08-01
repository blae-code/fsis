/** Shared visual language for labour tasks, used by both the council console and the worker board. */
export const TASK_STATUS_META = {
  posted:    { label: 'ON THE BOARD', color: '#E0A22E' },
  claimed:   { label: 'TAKEN UP',     color: '#6FA0C8' },
  submitted: { label: 'WORK FILED',   color: '#C8893B' },
  credited:  { label: 'PAID IN FULL', color: '#8A8F45' },
  returned:  { label: 'SENT BACK',    color: '#C05050' },
  cancelled: { label: 'WITHDRAWN',    color: '#6B6155' },
};

export const PRIORITY_COLOR = { routine: '#7A6E60', elevated: '#C8893B', urgent: '#C05050' };

export const fmtAuec = (n) => `${Math.round(Number(n) || 0).toLocaleString()} aUEC`;

/** Days until due — negative means the work is overdue. */
export function daysUntil(dueDate) {
  if (!dueDate) return null;
  const diff = new Date(dueDate).setHours(23, 59, 59) - Date.now();
  return Math.ceil(diff / 86400000);
}