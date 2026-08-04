/**
 * Nobody in this app is named.
 *
 * A comrade is their callsign. A buyer who never signed up is a guest number. Neither is ever an
 * email address, a real name, or anything a person did not deliberately choose to be known by.
 *
 * This exists because the app was quietly doing the opposite. The pattern
 * `user.handle || user.full_name || user.email` appeared thirty-two times across seventeen
 * functions, and every one of them is a place where a comrade who had not set a callsign got their
 * EMAIL ADDRESS written into a handle field — and then rendered on a labour board, carried into an
 * ops log, stamped on a standing event, and mailed out inside a notice to somebody else. The
 * fallback looked harmless at each site. Together it meant the app leaked addresses by default and
 * only kept them private for people who happened to fill in a form.
 *
 * So there is no fallback to anything identifying. Where a comrade has no callsign they get a
 * derived one — stable, opaque, and computed from their account id, which is already meaningless to
 * anybody outside the system. They can replace it the moment they choose one.
 *
 * The rules, in order of importance:
 *
 *   1. NEVER return an email address or a legal name from anything here. Not as a fallback, not
 *      when a record is malformed, not "just for the council". A council member reading an address
 *      is still the app revealing one.
 *   2. A callsign is chosen, not assigned. A derived one is a placeholder standing in until the
 *      comrade picks their own, and it says so.
 *   3. Guests are numbered, not named. What a guest typed into a checkout box is not a safe display
 *      name — people put their real names in those.
 */

/** What a comrade is called before they have chosen anything. */
export const DERIVED_PREFIX = 'COMRADE';
/** What a buyer with no account is called. */
export const GUEST_PREFIX = 'GUEST';

/** Anything shaped like an address. Deliberately broad — a false positive costs nothing. */
const EMAIL_SHAPED = /[^\s@]+@[^\s@]+/;

/** Whether a string is something we must never show. */
export function looksLikePii(value) {
  const s = String(value || '');
  if (!s) return false;
  if (EMAIL_SHAPED.test(s)) return true;
  // "Firstname Lastname" — two or more capitalised words is a legal name far more often than a
  // callsign. Callsigns in this game are overwhelmingly one token.
  if (/^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/.test(s.trim())) return true;
  return false;
}

/** A small stable hash. Not a secret — just a way to be consistent without being reversible to PII. */
function stableCode(seed, length = 4) {
  const s = String(seed || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(length, '0').slice(-length);
}

/**
 * What to call this comrade.
 *
 * Their callsign if they have one. Otherwise a derived placeholder from their account id — never
 * their address, never their name, and never an empty string that a caller might paper over with
 * something worse.
 */
export function callsignFor(user) {
  if (!user) return 'SOMEBODY';
  const chosen = String(user.handle || '').trim();
  if (chosen && !looksLikePii(chosen)) return chosen;
  // A handle that IS an address was written by the old fallback. Do not pass it on.
  const id = user.id || user.user_id || user.email || '';
  return `${DERIVED_PREFIX}-${stableCode(id)}`;
}

/** Whether this comrade still needs to choose a callsign. */
export function needsCallsign(user) {
  const chosen = String(user?.handle || '').trim();
  return !chosen || looksLikePii(chosen);
}

/** A guest's number, from the counter. Stable and unique per buyer-visit. */
export function guestNumber(n) {
  const num = Math.max(1, Math.floor(Number(n) || 1));
  return `${GUEST_PREFIX}-${String(num).padStart(4, '0')}`;
}

/**
 * The next guest number, claimed atomically.
 *
 * A counter rather than a hash, because two guests sharing a number is exactly the kind of small
 * wrongness that makes a record untrustworthy — and because a number a person can read back over
 * comms is more use to them than a hash.
 *
 * Falls back to a derived code rather than throwing: a buyer must never be stopped from ordering
 * because a counter was busy. Ordering has never required anything of them and it will not start now.
 *
 * @param {any} base44
 * @param {string} seed
 */
export async function nextGuestNumber(base44, seed = '') {
  try {
    const settings = base44.asServiceRole.entities.app_setting;
    const rows = await settings.filter({ key: 'guest_number_seq' }, '-created_date', 1);
    const current = rows[0];
    if (!current) {
      const created = await settings.create({ key: 'guest_number_seq', value: '1' });
      return { number: guestNumber(1), record_id: created?.id || '' };
    }
    const next = Math.max(1, Math.floor(Number(current.value) || 0) + 1);
    // Compare-and-swap on the value we read, so two checkouts cannot take the same number.
    const claim = await settings.updateMany(
      { id: current.id, value: current.value },
      { $set: { value: String(next) } },
    );
    if (!claim || claim.updated === 0) {
      // Somebody else took it. One retry, then a derived code — never block the order.
      const again = await settings.filter({ key: 'guest_number_seq' }, '-created_date', 1);
      const bumped = Math.max(1, Math.floor(Number(again[0]?.value) || 0) + 1);
      const retry = await settings.updateMany(
        { id: again[0]?.id, value: again[0]?.value },
        { $set: { value: String(bumped) } },
      );
      if (retry && retry.updated > 0) return { number: guestNumber(bumped), record_id: again[0]?.id || '' };
      return { number: `${GUEST_PREFIX}-${stableCode(seed || String(Date.now()), 6)}`, record_id: '' };
    }
    return { number: guestNumber(next), record_id: current.id };
  } catch {
    return { number: `${GUEST_PREFIX}-${stableCode(seed || String(Date.now()), 6)}`, record_id: '' };
  }
}

/**
 * A last guard before anything reaches a screen or a notice.
 *
 * If a value that should be a callsign is shaped like an address or a legal name, it came from a
 * record written before this rule existed, and it is replaced rather than shown. Cheap, and it
 * means one missed call site cannot leak.
 */
export function safeDisplay(value, fallbackSeed = '') {
  const s = String(value || '').trim();
  if (!s) return 'SOMEBODY';
  if (!looksLikePii(s)) return s;
  return `${DERIVED_PREFIX}-${stableCode(fallbackSeed || s)}`;
}
