/** FSIS class standing — shared by every backend function that gates access. */
export const PROPRIETOR_EMAIL = 'blae@katrasoluta.com';

export const FSIS_ROLES = ['proprietor', 'owner', 'contractor', 'patron'];

/** Resolve a user's standing, treating the founding proprietor email as authoritative. */
export function fsisRole(user) {
  if (!user) return 'patron';
  if ((user.email || '').toLowerCase() === PROPRIETOR_EMAIL) return 'proprietor';
  return FSIS_ROLES.includes(user.fsis_role) ? user.fsis_role : 'patron';
}

export const isProprietor = (user) => fsisRole(user) === 'proprietor';
/** Owners and the proprietor together form the council that runs the co-op. */
export const isCouncil = (user) => ['proprietor', 'owner'].includes(fsisRole(user));
export const isContractor = (user) => fsisRole(user) === 'contractor';

/** Platform role that must back a given FSIS standing. */
export const platformRoleFor = (role) => (['proprietor', 'owner'].includes(role) ? 'admin' : 'user');

/**
 * Who may hand out which standing.
 * Owner standing is invitation-only and reserved to the proprietor alone.
 */
export function canGrant(actor, newRole) {
  const actorRole = fsisRole(actor);
  if (actorRole === 'proprietor') return true;
  if (actorRole === 'owner') return ['contractor', 'patron'].includes(newRole);
  return false;
}