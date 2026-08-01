/**
 * A brief written once, posted as often as the work comes round.
 *
 * The council was retyping the same brief every week, one at a time, which is not only tedious —
 * it is how the terms quietly drift. The same job posted from memory pays a little differently
 * each time and asks for a little more, and a comrade comparing this week's board to last week's
 * has no way to tell whether the work changed or only the mood did. A standing brief fixes the
 * terms in one place where they can be read, argued with and changed deliberately.
 *
 * A template is not a task. It holds a span rather than a deadline, because a brief that recurs
 * has no one due date, and each posting takes its dates from the day it actually goes up.
 */

import { roundAuec } from './money.js';
import { handsNeeded } from './tasks.js';

export const CADENCES = ['none', 'daily', 'weekly', 'fortnightly', 'monthly'];

/** How long between postings. A month is taken as 30 days — stated, so nobody has to guess. */
export const CADENCE_DAYS = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30 };

const DAY_MS = 86400000;

/** No brief posts more than this at once, however it is asked. */
export const MAX_BULK = 20;

/** When this brief should next put itself up. */
export function nextDueAt(template, from = new Date()) {
  const days = CADENCE_DAYS[template?.cadence];
  if (!days) return '';
  return new Date(from.getTime() + days * DAY_MS).toISOString();
}

/** Whether a standing brief is owed a posting. */
export function isDue(template, now = new Date()) {
  if (!template?.active) return false;
  if (!CADENCE_DAYS[template?.cadence]) return false;
  // A brief that has never been posted is due immediately, so setting a cadence starts it.
  if (!template.next_due_at) return true;
  return new Date(template.next_due_at) <= now;
}

/**
 * One task, as this brief would post it today.
 *
 * The posting carries an empty crew rather than inheriting anything, because nobody is assigned —
 * every hand on a task put themselves there, and a template cannot put them there on their behalf.
 */
export function taskFromTemplate(template, { now = new Date(), postedByEmail = '' } = {}) {
  const dueDays = Number(template?.due_in_days);
  const span = Number.isFinite(dueDays) && dueDays > 0 ? Math.floor(dueDays) : 7;

  return {
    title: template?.title || template?.template_name || 'Untitled work',
    brief: template?.brief || '',
    category: template?.category || 'salvage',
    priority: template?.priority || 'routine',
    agreed_credit_auec: roundAuec(template?.agreed_credit_auec),
    ...(Number(template?.estimated_hours) > 0 ? { estimated_hours: Number(template.estimated_hours) } : {}),
    hands_needed: handsNeeded(template),
    location: template?.location || '',
    due_date: new Date(now.getTime() + span * DAY_MS).toISOString().slice(0, 10),
    status: 'posted',
    // Explicitly empty. A posting starts with nobody on it.
    crew: [],
    crew_user_ids: [],
    crew_count: 0,
    is_blocked: false,
    blocked_by: [],
    serves_type: template?.serves_type || 'none',
    template_id: template?.id || '',
    template_name: template?.template_name || '',
    posted_by_email: postedByEmail,
  };
}

/** How many postings to make, kept inside what a board can sensibly carry. */
export function bulkCount(requested) {
  const n = Math.floor(Number(requested) || 1);
  return Math.min(MAX_BULK, Math.max(1, n));
}
