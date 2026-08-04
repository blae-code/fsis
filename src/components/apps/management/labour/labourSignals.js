/**
 * What labour owes an answer on, and its vitals. Read-only arithmetic over records
 * already fetched — never a second truth about work, seats or pay.
 */
const seatsWanted = (op) => {
  const slots = Array.isArray(op.role_slots) ? op.role_slots : [];
  const fromSlots = slots.reduce((s, r) => s + Number(r.wanted || 0), 0);
  return fromSlots || Number(op.crew_needed || 0);
};

const seatsHeld = (op) =>
  (Array.isArray(op.rsvps) ? op.rsvps : []).filter((r) => r.response === 'in' && !r.waitlisted).length;

export function labourModel({ tasks = [], operations = [], events = [], cycles = [], elections = [] }) {
  const posted = tasks.filter((t) => t.status === 'posted');
  const openPosted = posted.filter((t) => !t.is_blocked);
  const claimed = tasks.filter((t) => t.status === 'claimed');
  const submitted = tasks.filter((t) => t.status === 'submitted');
  const returned = tasks.filter((t) => t.status === 'returned');
  const owed = [...claimed, ...submitted].reduce((s, t) => s + Number(t.agreed_credit_auec || 0), 0);

  const now = Date.now();
  const upcoming = operations.filter(
    (o) => ['scheduled', 'mustering'].includes(o.status) && (!o.starts_at || new Date(o.starts_at).getTime() > now - 6 * 3600e3),
  );
  const short = upcoming.filter((o) => seatsHeld(o) < seatsWanted(o));
  const underway = operations.filter((o) => o.status === 'underway');
  const wanted = upcoming.reduce((s, o) => s + seatsWanted(o), 0);
  const held = upcoming.reduce((s, o) => s + seatsHeld(o), 0);

  const appeals = events.filter((e) => e.appeal_status === 'filed');
  const overdue = appeals.filter((e) => e.appeal_due_by && new Date(e.appeal_due_by).getTime() < now);

  const cycle = cycles.find((c) => c.status === 'open') || null;
  const cycleElections = cycle ? elections.filter((e) => e.cycle_id === cycle.id) : [];
  const rostered = cycle ? (cycle.shares_by_handle || []).length : 0;
  const silent = Math.max(0, rostered - cycleElections.length);

  const counts = {
    tasks: submitted.length + returned.length,
    runs: short.length,
    payday: silent,
    standing: appeals.length,
  };

  const signals = [
    submitted.length && { desk: 'tasks', severity: 'critical', count: submitted.length, label: 'WORK FILED, UNANSWERED', detail: 'Proof is in and nobody has credited or returned it. Work done and unpaid is the one debt we never let stand.' },
    overdue.length && { desk: 'standing', severity: 'critical', count: overdue.length, label: 'APPEALS PAST THEIR DATE', detail: 'The council promised an answer by a date that has passed. Silence must not work as a denial.' },
    appeals.length - overdue.length > 0 && { desk: 'standing', severity: 'warning', count: appeals.length - overdue.length, label: 'APPEALS AWAITING RULING', detail: 'A comrade has contested a mark against them and is owed reasons.' },
    short.length && { desk: 'runs', severity: 'warning', count: short.length, label: 'MUSTERS SHORT OF HANDS', detail: 'Places called for and not yet taken up — a run flown short is a run flown badly.' },
    silent && { desk: 'payday', severity: 'warning', count: silent, label: 'NO WORD ON PAY', detail: 'Comrades on the roster who have not said whether they cash in or defer this cycle.' },
    returned.length && { desk: 'tasks', severity: 'notice', count: returned.length, label: 'SENT BACK FOR MORE WORK', detail: 'Returned to the hand that filed it and still outstanding.' },
    openPosted.length && { desk: 'tasks', severity: 'notice', count: openPosted.length, label: 'POSTED, UNCLAIMED', detail: 'On the board with nobody on it yet.' },
  ].filter(Boolean);

  const gauges = {
    posted: openPosted.length,
    blocked: posted.length - openPosted.length,
    claimed: claimed.length,
    submitted: submitted.length,
    owed,
    upcoming: upcoming.length,
    underway: underway.length,
    seats: `${held}/${wanted}`,
    seatFill: wanted ? (held / wanted) * 100 : 0,
    pool: cycle ? Number(cycle.pool_auec || 0) : 0,
    shareValue: cycle ? Number(cycle.share_value_auec || 0) : 0,
    elected: `${cycleElections.length}/${rostered}`,
    electFill: rostered ? (cycleElections.length / rostered) * 100 : 0,
    appeals: appeals.length,
    cycleOpen: !!cycle,
  };

  return { counts, signals, gauges };
}