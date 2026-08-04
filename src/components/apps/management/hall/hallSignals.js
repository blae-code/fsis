/**
 * What the hall owes an answer on, and its vitals. Read-only arithmetic over records
 * already fetched — debts, complaints, offers and the artwork that dresses the place.
 */
export function hallModel({ obligations = [], disputes = [], offers = [], assets = [], slots = [] }) {
  const now = Date.now();

  const owed = obligations.filter((o) => ['owed', 'overdue'].includes(o.status));
  const overdue = owed.filter((o) => o.status === 'overdue' || (o.due_at && new Date(o.due_at).getTime() < now));
  const suspended = obligations.filter((o) => o.listing_suspended && ['owed', 'overdue'].includes(o.status));
  const owedTotal = owed.reduce((s, o) => s + Number(o.amount_auec || 0), 0);

  const open = disputes.filter((d) => d.status === 'open');
  const answered = disputes.filter((d) => d.status === 'answered');
  const ruled = disputes.filter((d) => d.status === 'ruled');

  const offered = offers.filter((o) => o.status === 'offered');
  const lapsing = offered.filter((o) => o.expires_at && new Date(o.expires_at).getTime() < now + 24 * 3600e3);
  const accepted = offers.filter((o) => o.status === 'accepted');
  const offeredTotal = offered.reduce((s, o) => s + Number(o.offer_auec || 0), 0);

  const filled = new Set(assets.filter((a) => a.status === 'live').map((a) => a.slot_key));
  const placeholders = assets.filter((a) => a.status === 'placeholder');
  const noAlt = assets.filter((a) => a.status !== 'retired' && !String(a.alt_text || '').trim());
  const unfilled = slots.length ? slots.filter((s) => !filled.has(s)).length : 0;

  const counts = {
    collections: owed.length,
    disputes: open.length + answered.length,
    buyback: offered.length,
    assets: noAlt.length + placeholders.length,
  };

  const signals = [
    answered.length && { desk: 'disputes', severity: 'critical', count: answered.length, label: 'BOTH SIDES HEARD', detail: 'The other party has answered and the council can rule. Nothing further is waited on.' },
    overdue.length && { desk: 'collections', severity: 'critical', count: overdue.length, label: 'DEBTS PAST DUE', detail: 'Commission owed on sold lots past the date it was due.' },
    open.length && { desk: 'disputes', severity: 'warning', count: open.length, label: 'AWAITING AN ANSWER', detail: 'Raised, and the comrade complained of has not yet given their account.' },
    lapsing.length && { desk: 'buyback', severity: 'warning', count: lapsing.length, label: 'OFFERS ABOUT TO LAPSE', detail: 'Good for less than a day — a seller left to find out by silence is badly used.' },
    noAlt.length && { desk: 'assets', severity: 'warning', count: noAlt.length, label: 'ARTWORK WITHOUT ALT TEXT', detail: 'Images serving as information to everyone except those who cannot see them.' },
    owed.length - overdue.length > 0 && { desk: 'collections', severity: 'notice', count: owed.length - overdue.length, label: 'COMMISSION OUTSTANDING', detail: 'Owed and still within its terms.' },
    placeholders.length && { desk: 'assets', severity: 'notice', count: placeholders.length, label: 'PLACEHOLDERS STANDING IN', detail: 'Slots dressed with stand-ins until real work is made.' },
  ].filter(Boolean);

  const gauges = {
    owed: owed.length,
    owedTotal,
    overdue: overdue.length,
    suspended: suspended.length,
    open: open.length,
    answered: answered.length,
    ruled: ruled.length,
    offered: offered.length,
    offeredTotal,
    accepted: accepted.length,
    live: filled.size,
    slots: slots.length,
    unfilled,
    noAlt: noAlt.length,
  };

  return { counts, signals, gauges };
}