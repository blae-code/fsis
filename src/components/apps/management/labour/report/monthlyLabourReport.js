/**
 * The month's labour, read by the hand that did it: hours filed, work credited, what was settled
 * and how standing moved.
 *
 * Built from what each hand filed about their own labour — a hand's own account of their hours is
 * the record, not a figure measured over them. Work that was never credited is left out of the
 * settled column but its hours still count, because time given is time given.
 */
export function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

/** Months that actually have labour in them, newest first. */
export function availableMonths(tasks, events) {
  const keys = new Set([monthKey(new Date())]);
  tasks.forEach((t) => { if (t.reviewed_at || t.submitted_at || t.created_date) keys.add(monthKey(t.reviewed_at || t.submitted_at || t.created_date)); });
  events.forEach((e) => { if (e.created_date) keys.add(monthKey(e.created_date)); });
  return [...keys].sort().reverse();
}

/** One row per hand: hours, tasks, settled sum and standing movement for the chosen month. */
export function buildMonthlyReport({ tasks = [], events = [], month }) {
  const rows = new Map();
  const row = (handle) => {
    const key = handle || 'unattributed';
    if (!rows.has(key)) rows.set(key, { handle: key, hours: 0, tasks: 0, credited: 0, standing: 0, marks: 0 });
    return rows.get(key);
  };

  tasks.forEach((task) => {
    const when = task.reviewed_at || task.submitted_at || task.created_date;
    if (!when || monthKey(when) !== month) return;
    const crew = (task.crew || []).length
      ? task.crew
      : [{ handle: task.assigned_handle, actual_hours: task.actual_hours, credited_auec: task.credited_auec }];

    crew.forEach((hand) => {
      if (!hand?.handle) return;
      const r = row(hand.handle);
      r.hours += Number(hand.actual_hours) || 0;
      r.credited += Number(hand.credited_auec) || 0;
      if (task.status === 'credited') r.tasks += 1;
    });
  });

  events.forEach((event) => {
    if (event.voided || !event.created_date || monthKey(event.created_date) !== month) return;
    const r = row(event.member_handle || event.member_email || 'unattributed');
    const delta = Number(event.effective_delta ?? event.delta) || 0;
    r.standing += delta;
    if (delta < 0) r.marks += 1;
  });

  const list = [...rows.values()].sort((a, b) => b.hours - a.hours || b.credited - a.credited);
  return {
    month,
    rows: list,
    totals: list.reduce(
      (t, r) => ({
        hours: t.hours + r.hours,
        tasks: t.tasks + r.tasks,
        credited: t.credited + r.credited,
        standing: t.standing + r.standing,
        marks: t.marks + r.marks,
      }),
      { hours: 0, tasks: 0, credited: 0, standing: 0, marks: 0 },
    ),
  };
}

const HEAD = ['Contractor', 'Hours filed', 'Tasks credited', 'Settled (aUEC)', 'Standing change', 'Marks'];

export function reportCsv(report) {
  const lines = [
    `FSIS contractor review — ${monthLabel(report.month)}`,
    HEAD.join(','),
    ...report.rows.map((r) => [
      `"${r.handle}"`, r.hours.toFixed(1), r.tasks, Math.round(r.credited), r.standing, r.marks,
    ].join(',')),
    ['"TOTAL"', report.totals.hours.toFixed(1), report.totals.tasks, Math.round(report.totals.credited), report.totals.standing, report.totals.marks].join(','),
  ];
  return lines.join('\n');
}

export function downloadCsv(report) {
  const blob = new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fsis-contractor-review-${report.month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}