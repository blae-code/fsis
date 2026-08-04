import { tierFor, nextTier } from '@/lib/reputation';

/**
 * A contractor's own account of where they stand: how far through joining they are, what is
 * outstanding, and what their standing amounts to.
 *
 * Read-only, and derived from records the comrade can already see, so the dashboard can never tell
 * them something the board contradicts.
 */

/** The way in, stage by stage. Each is either done, in hand, or not yet reached. */
export function milestones({ state, mine = [] }) {
  const standing = state?.standing || 'guest';
  const request = state?.request || null;
  const credited = mine.filter((t) => t.status === 'credited');
  const held = mine.filter((t) => ['claimed', 'submitted', 'returned'].includes(t.status));

  const hasAccount = !!state?.has_account;
  const asked = !!request;
  const accepted = ['contractor', 'crew', 'proprietor'].includes(standing);
  const charterDone = !state?.charter || state.charter.signed === true;

  return [
    { key: 'account', label: 'ACCOUNT MADE', done: hasAccount, detail: hasAccount ? 'Your work follows you across devices.' : 'Without one, nothing can be credited to you.' },
    { key: 'asked', label: 'STANDING ASKED FOR', done: asked || accepted, detail: request ? `Asked ${new Date(request.created_date).toLocaleDateString()} — ${(request.status || '').toUpperCase()}` : accepted ? 'Granted.' : 'Offer your labour to the council.' },
    { key: 'accepted', label: 'STANDING GRANTED', done: accepted, detail: accepted ? `You hold ${standing} standing.` : 'The council answers every request in its own words.' },
    { key: 'charter', label: 'CHARTER SIGNED', done: accepted && charterDone, detail: charterDone ? 'Terms agreed and on the record.' : 'Awaiting your signature.' },
    { key: 'first_work', label: 'FIRST WORK TAKEN UP', done: held.length > 0 || credited.length > 0, detail: held.length > 0 ? `${held.length} in hand.` : credited.length > 0 ? 'Done.' : 'Nothing is assigned — you choose what you take.' },
    { key: 'first_credit', label: 'FIRST WORK CREDITED', done: credited.length > 0, detail: credited.length > 0 ? `${credited.length} task${credited.length === 1 ? '' : 's'} credited.` : 'Paid in full on settlement.' },
  ];
}

/** Everything presently waiting on the comrade, or on the council for them. */
export function outstanding({ state, mine = [], upcoming = [], userId }) {
  const items = [];
  const step = state?.next_step;

  if (step && step.key !== 'settled' && step.action !== 'none') {
    items.push({ key: 'next_step', on: 'you', label: step.title, detail: step.body || '', tone: 'notice' });
  }

  for (const t of mine) {
    if (t.status === 'returned') items.push({ key: `ret-${t.id}`, on: 'you', label: `SENT BACK — ${t.title}`, detail: t.review_notes || 'The council asked for more work on this.', tone: 'critical' });
    else if (t.status === 'claimed') {
      const late = t.due_date && new Date(t.due_date) < new Date();
      items.push({ key: `claim-${t.id}`, on: 'you', label: `FILE YOUR ACCOUNT — ${t.title}`, detail: late ? `Past its date of ${t.due_date}.` : t.due_date ? `Wanted by ${t.due_date}.` : 'No date set.', tone: late ? 'critical' : 'warning' });
    } else if (t.status === 'submitted') {
      items.push({ key: `sub-${t.id}`, on: 'council', label: `AWAITING REVIEW — ${t.title}`, detail: 'Filed. The council owes you an answer.', tone: 'notice' });
    }
  }

  const unanswered = upcoming.filter((o) => !(o.rsvps || []).some((r) => r.user_id === userId));
  if (unanswered.length > 0) {
    items.push({ key: 'musters', on: 'you', label: `${unanswered.length} MUSTER${unanswered.length === 1 ? '' : 'S'} UNANSWERED`, detail: 'Answering is voluntary — but a run cannot be planned on silence.', tone: 'warning' });
  }
  return items;
}

/** Standing as a figure, a tier, and the distance to the next one. */
export function standingModel(user) {
  const points = Number(user?.reputation) || 0;
  const tier = tierFor(points);
  const next = nextTier(points);
  const floor = Number.isFinite(tier.min) ? tier.min : 0;
  const ceiling = next ? next.min : floor + 1;
  const span = Math.max(1, ceiling - floor);
  return {
    points,
    tier,
    next,
    locked: !!user?.standing_locked,
    toNext: next ? Math.max(0, next.min - points) : 0,
    fill: next ? Math.max(0, Math.min(100, ((points - floor) / span) * 100)) : 100,
  };
}