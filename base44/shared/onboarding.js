/**
 * Where a person stands with the collective, and what happens next.
 *
 * The app knows exactly what to do with a contractor. It has never known what to do with somebody
 * who is merely interested — and that is the path that decides whether any of the rest gets used.
 *
 * Three ways in, and they are genuinely different rather than three grades of the same thing:
 *
 *   PATRON     buys. Never needs an account at all; ordering works for a stranger. An account is
 *              offered because it is USEFUL to them — claiming a guest order, a trade record that
 *              earns a better price — and never because the collective wants their details.
 *   CONTRACTOR gives labour. Asks, is read by a person, and is answered either way.
 *   OWNER      shares the running of it. Invitation only, and never applied for: a route to ask
 *              for it would be a route to lobby for it.
 *
 * The state is computed rather than stored, because a stored onboarding flag is a thing that drifts
 * from the records it summarises. Everything here is derived from what is actually true.
 */

import { fsisRole } from './roles.js';
import { latestSignature, signatureStatus } from './instruments.js';

/** How long a declined applicant waits before asking again. */
export const REAPPLY_AFTER_DAYS = 14;

/** Whether this person has to ask at all, or is already in. */
export function standingOf(user) {
  return fsisRole(user);
}

/**
 * The charter, if one is asked of this standing.
 *
 * Terms differ per standing, so a patron is never shown a contractor's undertakings. An instrument
 * that names no standings applies to everyone.
 */
export function charterFor(instruments, standing) {
  return (instruments || []).find((i) => i && i.kind === 'charter' && i.active !== false
    && ((i.applies_to_standing || []).length === 0 || (i.applies_to_standing || []).includes(standing))) || null;
}

/**
 * Can this person ask for contractor standing, and if not, why not?
 *
 * A declined applicant may ask again after a stated wait. Being turned down once is not a verdict
 * for life, and a collective that never reconsiders is one that shrinks.
 *
 * @param {any} user
 * @param {any[]} requests
 * @param {Date} [now]
 */
export function mayRequest(user, requests, now = new Date()) {
  const standing = standingOf(user);
  if (standing !== 'patron') {
    return { allowed: false, reason: `You already hold ${standing} standing — there is nothing to ask for.` };
  }

  const mine = [...(requests || [])].sort(
    (a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')),
  );
  const pending = mine.find((r) => r.status === 'pending');
  if (pending) {
    return { allowed: false, reason: 'Your request is already before the council. They owe you an answer.', request: pending };
  }

  const declined = mine.find((r) => r.status === 'declined');
  if (declined && declined.reviewed_at) {
    const waitedMs = now.getTime() - new Date(declined.reviewed_at).getTime();
    const waitDays = REAPPLY_AFTER_DAYS * 86400000;
    if (waitedMs < waitDays) {
      const daysLeft = Math.ceil((waitDays - waitedMs) / 86400000);
      return {
        allowed: false,
        reason: `The council answered your last request ${Math.floor(waitedMs / 86400000)} days ago. You may ask again in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — being turned down once is not a verdict for life.`,
        request: declined,
      };
    }
  }
  return { allowed: true, reason: '' };
}

/**
 * Everything about where somebody stands, and the one thing to do next.
 *
 * `next_step` is deliberately singular. A person landing here should be told what to do, not shown
 * a checklist of everything they have not done — the second is how somebody decides this is more
 * trouble than it is worth and closes the tab.
 *
 * @param {{ user?: any, requests?: any[], instruments?: any[], signatures?: any[], orders?: any[] }} [input]
 * @param {Date} [now]
 */
export function onboardingState({ user, requests = [], instruments = [], signatures = [], orders = [] } = {}, now = new Date()) {
  const standing = standingOf(user);
  const isGuest = !user;

  const charter = charterFor(instruments, standing);
  const charterSignature = charter ? latestSignature(signatures, user?.id, charter.id) : null;
  const charterStatus = charter ? signatureStatus(charterSignature, charter) : null;
  const charterOutstanding = !!charter && !charterStatus?.covers_current;

  const mine = [...(requests || [])].sort(
    (a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')),
  );
  const request = mine[0] || null;
  const askable = user ? mayRequest(user, requests, now) : { allowed: false, reason: '' };

  const path = standing === 'patron' ? 'patron' : (standing === 'contractor' ? 'contractor' : 'owner');

  // The single next thing, worst-first: an answer owed to them, then something they must do,
  // then something worth offering.
  let nextStep;
  if (isGuest) {
    nextStep = {
      key: 'browse_or_account',
      title: 'You need nothing from us to buy',
      body: 'Ordering has never required an account and never will. An account is worth having only for what it gives you — claiming an order you placed as a guest, and a trade record that earns you a better price the more plainly you deal.',
      action: 'optional_sign_in',
    };
  } else if (request?.status === 'pending') {
    nextStep = {
      key: 'awaiting_council',
      title: 'Your request is with the council',
      body: 'A person reads these, not a rule. You will be told either way, and if the answer is no you will be told why.',
      action: 'wait',
    };
  } else if (charterOutstanding) {
    nextStep = {
      key: 'sign_charter',
      title: charterStatus?.needs_reconsent ? `${charter.title} has changed` : `Read and sign ${charter.title}`,
      body: charterStatus?.needs_reconsent
        ? 'The terms have moved since you signed. You are not bound by the new ones — read what changed and agree, or carry on under the version you signed.'
        : 'Short, and it says what the collective owes you as much as what you undertake. You can withdraw from it at any time.',
      action: 'sign_instrument',
      instrument_id: charter.id,
      instrument_version: charter.version,
    };
  } else if (standing === 'patron' && askable.allowed) {
    nextStep = {
      key: 'offer_contractor',
      title: 'You can work with us, if you want to',
      body: 'Contractors take paid work from the labour board and stand runs. You would be asked what you do and when you are about, and a person would read it.',
      action: 'request_standing',
    };
  } else if (standing === 'patron' && request?.status === 'declined') {
    nextStep = {
      key: 'declined',
      title: 'The council answered your request',
      body: request.review_notes || 'No reason was recorded, which should not happen — ask the council.',
      action: askable.allowed ? 'request_standing' : 'wait',
      may_ask_again: askable.allowed,
      why_not: askable.reason,
    };
  } else if (standing === 'contractor') {
    nextStep = {
      key: 'get_to_work',
      title: 'The labour board is open to you',
      body: 'Take work that suits you, answer a muster, or say nothing at all — nobody is rostered here, and no obligation follows from having joined.',
      action: 'open_work_board',
    };
  } else {
    nextStep = { key: 'settled', title: 'Nothing outstanding', body: '', action: 'none' };
  }

  return {
    path,
    standing,
    is_guest: isGuest,
    has_account: !!user,
    // Owner standing is never applied for, and the interface should not offer a route to ask.
    owner_is_invitation_only: true,
    request: request
      ? {
        id: request.id, status: request.status, created_date: request.created_date,
        reviewed_at: request.reviewed_at || '', review_notes: request.review_notes || '',
      }
      : null,
    may_request_contractor: askable.allowed,
    may_request_reason: askable.reason,
    charter: charter
      ? {
        instrument_id: charter.id, title: charter.title, version: charter.version,
        signed: !charterOutstanding,
        needs_reconsent: !!charterStatus?.needs_reconsent,
        accepted_version: charterStatus?.accepted_version ?? null,
      }
      : null,
    // Why an account is worth having, stated as use rather than as an ask.
    account_gives: [
      'Claim an order you placed as a guest, and follow it',
      'A trade record that earns a better price the more plainly you deal',
      'Notice when something you wanted comes back into stock',
    ],
    orders_claimable: (orders || []).filter((o) => o && !o.claimed_by_user_id).length,
    next_step: nextStep,
  };
}
