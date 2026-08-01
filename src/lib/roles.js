/** FSIS class standing — shared by every surface that gates what a comrade may see or do. */
export const PROPRIETOR_EMAIL = 'blae@katrasoluta.com';

export const FSIS_ROLES = ['proprietor', 'owner', 'contractor', 'patron'];

export const ROLE_META = {
  proprietor: { label: 'PROPRIETOR', blurb: 'First among equals — tie-breaker only', color: '#E0A22E' },
  owner: { label: 'OWNER', blurb: 'Co-op member — admitted by invitation alone', color: '#8A8F45' },
  contractor: { label: 'CONTRACTOR', blurb: 'Ad-hoc labour — paid per work order, outside the share pool', color: '#6FA0C8' },
  patron: { label: 'PATRON', blurb: 'Buyer — no account required to trade with us', color: '#C8893B' },
};

export function fsisRole(user) {
  if (!user) return 'patron';
  if ((user.email || '').toLowerCase() === PROPRIETOR_EMAIL) return 'proprietor';
  return FSIS_ROLES.includes(user.fsis_role) ? user.fsis_role : 'patron';
}

export const isProprietor = (user) => fsisRole(user) === 'proprietor';
/** Owners and the proprietor together form the council that runs the co-op. */
export const isCouncil = (user) => ['proprietor', 'owner'].includes(fsisRole(user));
export const isContractor = (user) => fsisRole(user) === 'contractor';

/** Legacy admins keep council access so nobody is locked out of the tools they built. */
export const hasCouncilAccess = (user) => isCouncil(user) || user?.role === 'admin';

export function canGrant(actor, newRole) {
  const role = fsisRole(actor);
  if (role === 'proprietor') return true;
  if (role === 'owner') return ['contractor', 'patron'].includes(newRole);
  return false;
}