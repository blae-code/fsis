/**
 * Throttling, so a guessable secret cannot simply be guessed.
 *
 * The app had none of this anywhere. That mattered most for guest orders, which are protected by a
 * tracking code — six hex characters, about sixteen million possibilities. Sixteen million sounds
 * like a lot until you notice that `claimOrder` accepted an ARRAY of codes and nothing counted how
 * often anybody was wrong. A thousand guesses a request and the whole space falls in a few thousand
 * requests, and each hit binds a stranger's order to the attacker's account.
 *
 * The rule this module exists to enforce: **a wrong guess must cost something.** Not much — a
 * comrade who mistypes their own code should barely notice — but enough that sweeping a keyspace
 * stops being free.
 *
 * Two deliberate choices:
 *
 *   1. IT COUNTS FAILURES, NOT REQUESTS. Somebody reading their own order forty times is not an
 *      attack; somebody getting it wrong forty times is. Throttling successful work would punish
 *      the enthusiastic and catch nobody.
 *   2. IT FAILS OPEN. If the counter itself breaks, the request proceeds. A limiter that can take
 *      the storefront down when it has a bad day is a worse problem than the one it solves — and
 *      ordering has never required anything of a buyer.
 */

const HOUR = 3600;

/** What each guarded action allows before it starts saying no. */
export const LIMITS = {
  // Binding a stranger's order to your account is the prize, so this is the tightest.
  claim_order: { failures: 5, window_seconds: HOUR, note: 'claiming orders' },
  cancel_order: { failures: 5, window_seconds: HOUR, note: 'cancelling orders' },
  order_lookup: { failures: 20, window_seconds: HOUR, note: 'order lookups' },
  profile_write: { failures: 30, window_seconds: HOUR, note: 'profile updates' },
};

/** How many codes may be offered in one breath, whatever the limiter says. */
export const MAX_CODES_PER_REQUEST = 10;

const windowKey = (action, subject) => `${action}:${String(subject || 'anon').slice(0, 120)}`;

/**
 * Has this caller failed too often lately?
 *
 * Read-only — call `recordFailure` when the attempt actually turns out to be wrong. Kept apart so a
 * successful request never writes anything, and the common path stays cheap.
 *
 * @param {any} base44
 * @param {{ action: string, subject: string, now?: Date }} q
 */
export async function checkLimit(base44, { action, subject, now = new Date() }) {
  const limit = LIMITS[action];
  if (!limit) return { allowed: true, remaining: Infinity, retry_after_seconds: 0 };

  try {
    const rows = await base44.asServiceRole.entities.rate_limit.filter(
      { limit_key: windowKey(action, subject) }, '-window_started_at', 1,
    );
    const row = rows[0];
    if (!row) return { allowed: true, remaining: limit.failures, retry_after_seconds: 0 };

    const started = new Date(row.window_started_at || 0).getTime();
    const elapsed = (now.getTime() - started) / 1000;
    if (elapsed >= limit.window_seconds) {
      // The window has rolled over; the slate is clean.
      return { allowed: true, remaining: limit.failures, retry_after_seconds: 0 };
    }

    const failures = Number(row.failures) || 0;
    if (failures >= limit.failures) {
      return {
        allowed: false,
        remaining: 0,
        retry_after_seconds: Math.ceil(limit.window_seconds - elapsed),
        reason: `Too many wrong ${limit.note} from this account recently. Try again in ${Math.ceil((limit.window_seconds - elapsed) / 60)} minutes — and if you are locked out of your own order, ask the council rather than guessing.`,
      };
    }
    return { allowed: true, remaining: limit.failures - failures, retry_after_seconds: 0 };
  } catch {
    // Fail open. A broken limiter must not become a broken storefront.
    return { allowed: true, remaining: Infinity, retry_after_seconds: 0, degraded: true };
  }
}

/**
 * Record that an attempt was wrong.
 *
 * Only ever called on a genuine miss. The window starts at the first failure and rolls, so a
 * comrade who fumbles once at nine and once at four is never treated as having done it twice.
 *
 * @param {any} base44
 * @param {{ action: string, subject: string, detail?: string, now?: Date }} f
 */
export async function recordFailure(base44, { action, subject, detail = '', now = new Date() }) {
  const limit = LIMITS[action];
  if (!limit) return;

  try {
    const entity = base44.asServiceRole.entities.rate_limit;
    const key = windowKey(action, subject);
    const rows = await entity.filter({ limit_key: key }, '-window_started_at', 1);
    const row = rows[0];

    if (!row) {
      await entity.create({
        limit_key: key, action, subject: String(subject || 'anon').slice(0, 120),
        failures: 1, window_started_at: now.toISOString(), last_failure_at: now.toISOString(),
        last_detail: String(detail).slice(0, 200),
      });
      return;
    }

    const started = new Date(row.window_started_at || 0).getTime();
    const expired = (now.getTime() - started) / 1000 >= limit.window_seconds;

    await entity.update(row.id, expired
      ? { failures: 1, window_started_at: now.toISOString(), last_failure_at: now.toISOString(), last_detail: String(detail).slice(0, 200) }
      : { failures: (Number(row.failures) || 0) + 1, last_failure_at: now.toISOString(), last_detail: String(detail).slice(0, 200) });
  } catch {
    // Same reasoning: never let the limiter break the caller.
  }
}

/** Trim a batch of codes to something a person could plausibly be holding. */
export function boundCodes(codes) {
  const list = (Array.isArray(codes) ? codes : [codes])
    .map((c) => String(c || '').trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(list)].slice(0, MAX_CODES_PER_REQUEST);
}
