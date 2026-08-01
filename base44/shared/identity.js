/**
 * Linked-identity detection.
 *
 * A comrade dismissed by the council must not be able to shed the ruling by registering again under
 * a fresh name — if that works, standing means nothing and the honest hands carry the cost. What
 * follows only ever gathers grounds for suspicion and states them plainly; the verdict belongs to the
 * council, and a cleared pair is left alone.
 */

/** Signal weights. A pair must reach THRESHOLD before the council is troubled with it. */
export const THRESHOLD = 4;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const localPart = (email) => norm(String(email || '').split('@')[0]);

/** Every name an account is known by, drawn from the record, its applications and its orders. */
export function identityNames(user, { requests = [], orders = [] } = {}) {
  const names = new Set();
  [user.handle, user.full_name].forEach((n) => { if (norm(n).length >= 3) names.add(norm(n)); });
  requests.forEach((r) => {
    [r.handle, r.timezone && null].forEach((n) => { if (norm(n).length >= 3) names.add(norm(n)); });
  });
  orders.forEach((o) => {
    [o.customer_handle, o.customer_profile_handle].forEach((n) => { if (norm(n).length >= 3) names.add(norm(n)); });
  });
  return names;
}

/** Grounds on which two accounts look like one comrade. */
export function compareIdentities(a, b) {
  const signals = [];
  let score = 0;

  const shared = [...a.names].filter((n) => b.names.has(n));
  if (shared.length > 0) {
    score += 5;
    signals.push(`Same handle in use on both accounts: ${shared.join(', ')}`);
  } else {
    const near = [...a.names].find((n) => n.length >= 5 && [...b.names].some((m) => m.length >= 5 && (m.includes(n) || n.includes(m))));
    if (near) {
      score += 3;
      signals.push(`Handles overlap closely (${near})`);
    }
  }

  const la = localPart(a.user.email);
  const lb = localPart(b.user.email);
  if (la && lb) {
    if (la === lb) {
      score += 4;
      signals.push('Both addresses share the same name before the @');
    } else if (la.length >= 5 && (la.includes(lb) || lb.includes(la))) {
      score += 2;
      signals.push('Addresses share a common stem before the @');
    }
  }

  const contactA = norm(a.contact);
  const contactB = norm(b.contact);
  if (contactA && contactA === contactB) {
    score += 4;
    signals.push('Same contact handle given on both accounts');
  }

  return { score, signals };
}

/** One key per pair, order-independent, so a pair is recorded once and ruled on once. */
export function pairKey(idA, idB) {
  return [idA, idB].sort().join('::');
}