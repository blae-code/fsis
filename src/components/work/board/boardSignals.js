/**
 * What the board owes a comrade an answer on, and their own standing figures.
 * Read-only arithmetic over records already fetched — no fetching, no writing.
 */
export function boardModel({ mine = [], open = [], upcoming = [], userId, earned = 0 }) {
  const now = Date.now();

  const held = mine.filter((t) => ['claimed', 'submitted', 'returned'].includes(t.status));
  const returned = mine.filter((t) => t.status === 'returned');
  const filed = mine.filter((t) => t.status === 'submitted');
  const credited = mine.filter((t) => t.status === 'credited');
  const overdue = held.filter((t) => t.due_date && new Date(t.due_date).getTime() < now);

  const urgent = open.filter((t) => t.priority === 'urgent');
  const openValue = open.reduce((s, t) => s + Number(t.agreed_credit_auec || 0), 0);

  const answered = (op) => (op.rsvps || []).some((r) => r.user_id === userId && r.response !== 'out');
  const unanswered = upcoming.filter((op) => !answered(op));
  const soon = unanswered.filter((op) => op.starts_at && new Date(op.starts_at).getTime() < now + 48 * 3600e3);
  const standing = upcoming.filter((op) => answered(op));

  const counts = {
    mine: held.length,
    musters: unanswered.length,
    open: open.length,
    record: 0,
  };

  const signals = [
    returned.length && { desk: 'mine', severity: 'critical', count: returned.length, label: 'SENT BACK TO YOU', detail: 'The council asked for more work before it credits. Their reasoning is on the card.' },
    overdue.length && { desk: 'mine', severity: 'critical', count: overdue.length, label: 'PAST ITS DATE', detail: 'Work you hold is past the day it was wanted by. Say so rather than let it sit.' },
    soon.length && { desk: 'musters', severity: 'warning', count: soon.length, label: 'MUSTERS INSIDE TWO DAYS', detail: 'Called soon and you have not answered. Nobody is owed your time until you offer it.' },
    urgent.length && { desk: 'open', severity: 'warning', count: urgent.length, label: 'URGENT WORK POSTED', detail: 'Priced up front, yours to take or leave.' },
    filed.length && { desk: 'mine', severity: 'notice', count: filed.length, label: 'FILED, AWAITING CREDIT', detail: 'Your account of the work is in. The council owes you an answer.' },
    open.length && { desk: 'open', severity: 'notice', count: open.length, label: 'OPEN ON THE BOARD', detail: 'Every task carries its price before you take it up.' },
  ].filter(Boolean);

  const gauges = { held: held.length, filed: filed.length, returned: returned.length, credited: credited.length, earned, open: open.length, openValue, urgent: urgent.length, standing: standing.length, unanswered: unanswered.length };

  return { counts, signals, gauges };
}