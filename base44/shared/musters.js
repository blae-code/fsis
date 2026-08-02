/**
 * A muster with places in it, rather than a headcount.
 *
 * "Crew needed: 4" cannot describe a run that wants one pilot and two scrapers, so the council
 * wrote it in the brief and hoped the right people read it. Four hands who all came to scrape is a
 * run that does not fly.
 *
 * Places are a statement of what the work needs — never an assignment. A comrade chooses their own
 * place and may say they are out at any time. When a place is full, a later answer joins a waitlist
 * in the order it arrived rather than being turned away, and when somebody stands down the next in
 * line takes the place. First come, first served, plainly and in public: the alternative is the
 * council picking who flies, which is a different kind of outfit entirely.
 */

/** Roles the yard actually crews for. `any` is a place with no particular trade attached. */
export const MUSTER_ROLES = ['any', 'pilot', 'scraper', 'gunner', 'security', 'hauler', 'engineer', 'medic'];

/** No muster carries more places than this in one role. */
export const MAX_PER_ROLE = 24;

/**
 * The places this muster is calling for.
 *
 * A muster with no places stated falls back to its old headcount, so every operation written before
 * places existed still reads sensibly: one open place per hand wanted, of no particular trade.
 *
 * @returns {any[]}
 */
export function roleSlots(operation) {
  const declared = (operation?.role_slots || [])
    .filter((slot) => slot && MUSTER_ROLES.includes(slot.role))
    .map((slot) => ({
      role: slot.role,
      wanted: Math.min(MAX_PER_ROLE, Math.max(1, Math.floor(Number(slot.wanted) || 1))),
    }));
  if (declared.length > 0) return declared;

  const headcount = Math.min(MAX_PER_ROLE, Math.max(1, Math.floor(Number(operation?.crew_needed) || 1)));
  return [{ role: 'any', wanted: headcount }];
}

/** Answers that hold a place: in, and not waiting. */
export function holdersOf(rsvps, role) {
  return (rsvps || []).filter((r) => r?.response === 'in' && !r.waitlisted && (r.role || 'any') === role);
}

/** Answers waiting for a place, oldest first — the order they arrived is the order they are taken. */
export function waitingFor(rsvps, role) {
  return (rsvps || [])
    .filter((r) => r?.response === 'in' && r.waitlisted && (r.role || 'any') === role)
    .sort((a, b) => String(a.responded_at || '').localeCompare(String(b.responded_at || '')));
}

/** How each place stands: wanted, filled, and who is waiting. */
export function slotState(operation, rsvps) {
  return roleSlots(operation).map((slot) => {
    const held = holdersOf(rsvps, slot.role);
    return {
      role: slot.role,
      wanted: slot.wanted,
      filled: held.length,
      places_left: Math.max(0, slot.wanted - held.length),
      waiting: waitingFor(rsvps, slot.role).length,
      hands: held.map((r) => ({ user_id: r.user_id, handle: r.handle })),
    };
  });
}

/** Whether a role has room for one more hand. */
export function hasRoom(operation, rsvps, role) {
  const slot = roleSlots(operation).find((s) => s.role === role);
  if (!slot) return false;
  return holdersOf(rsvps, role).length < slot.wanted;
}

/** A role this muster actually calls for. */
export function offersRole(operation, role) {
  return roleSlots(operation).some((slot) => slot.role === role);
}

/**
 * Somebody stood down and a place came free — the next in line takes it.
 *
 * Returns the promoted answer alongside the new list so the comrade can be told, because a place
 * that comes free silently is a place nobody knows they have.
 */
export function promoteFromWaitlist(operation, rsvps, role) {
  if (!hasRoom(operation, rsvps, role)) return { rsvps, promoted: null };

  const next = waitingFor(rsvps, role)[0];
  if (!next) return { rsvps, promoted: null };

  return {
    rsvps: (rsvps || []).map((r) => (r.user_id === next.user_id ? { ...r, waitlisted: false } : r)),
    promoted: next,
  };
}

/**
 * One comrade's answer, placed.
 *
 * Every comrade speaks only for themselves, and an answer always replaces their own previous one.
 * Saying "in" where the place is full is not a refusal — it is a place in the queue.
 */
export function placeAnswer(operation, rsvps, user, { response, role = 'any', note = '', at = new Date() }) {
  const others = (rsvps || []).filter((r) => r.user_id !== user.id);
  const wanted = MUSTER_ROLES.includes(role) ? role : 'any';
  const waitlisted = response === 'in' && !hasRoom(operation, others, wanted);

  const entry = {
    user_id: user.id,
    handle: user.handle || user.full_name || user.email,
    standing: user.fsis_role || '',
    response,
    role: wanted,
    waitlisted,
    note,
    responded_at: at.toISOString(),
  };

  return { rsvps: [...others, entry], entry, waitlisted };
}
