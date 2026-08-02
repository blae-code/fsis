export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * The next time this standing run comes round.
 *
 * A weekly muster is written once and called again; retyping the date every week is how the time
 * quietly drifts and comrades turn up an hour out.
 */
export function nextOccurrence(weekday, timeOfDay, from = new Date()) {
  const [h, m] = String(timeOfDay || '20:00').split(':').map((n) => Number(n) || 0);
  const date = new Date(from);
  date.setSeconds(0, 0);
  date.setHours(h, m);
  const shift = (Number(weekday) - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + shift);
  if (date <= from) date.setDate(date.getDate() + 7);
  return date;
}

/** The muster a template calls for, at its next occurrence. */
export function operationFromTemplate(tpl, actorEmail) {
  return {
    op_name: tpl.op_name,
    brief: tpl.brief || '',
    op_type: tpl.op_type || 'salvage',
    starts_at: nextOccurrence(tpl.weekday, tpl.time_of_day).toISOString(),
    duration_hours: Number(tpl.duration_hours) || 0,
    muster_location: tpl.muster_location || '',
    ship: tpl.ship || '',
    crew_needed: Number(tpl.crew_needed) || 0,
    roles_wanted: tpl.roles_wanted || '',
    pay_basis: tpl.pay_basis || 'shares',
    flat_credit_auec: Math.max(0, Number(tpl.flat_credit_auec) || 0),
    status: 'scheduled',
    posted_by_email: actorEmail || '',
  };
}