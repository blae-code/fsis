/**
 * What each kind of run usually asks for. Typing "Lorville — Teasa Spaceport, 2 hours" for the
 * hundredth salvage sweep is how a scheduling form quietly becomes a chore, so the shape of a
 * typical run is written down once here.
 *
 * These are suggestions and nothing more: every field stays editable, and a value the council has
 * already touched is never overwritten.
 */
export const OP_TYPE_DEFAULTS = {
  salvage:  { duration_hours: 2,   muster_location: 'Lorville — Teasa Spaceport', ship: 'Drake Vulture',      crew_needed: 2, roles_wanted: 'pilot, scraper' },
  hauling:  { duration_hours: 2.5, muster_location: 'Lorville — Teasa Spaceport', ship: 'Crusader Hercules',  crew_needed: 2, roles_wanted: 'pilot, hauler' },
  mining:   { duration_hours: 3,   muster_location: 'ARC-L1 Wide Forest Station', ship: 'Argo MOLE',          crew_needed: 3, roles_wanted: 'pilot, engineer, hauler' },
  escort:   { duration_hours: 1.5, muster_location: 'Lorville — Teasa Spaceport', ship: 'Anvil Hornet',       crew_needed: 2, roles_wanted: 'pilot, gunner' },
  recovery: { duration_hours: 1,   muster_location: 'Lorville — Teasa Spaceport', ship: 'Drake Cutlass Black', crew_needed: 2, roles_wanted: 'pilot, medic' },
  repair:   { duration_hours: 1.5, muster_location: 'Lorville — Teasa Spaceport', ship: 'Drake Vulture',      crew_needed: 1, roles_wanted: 'engineer' },
  bounty:   { duration_hours: 2,   muster_location: 'Lorville — Teasa Spaceport', ship: 'Anvil Hornet',       crew_needed: 2, roles_wanted: 'pilot, gunner' },
  piracy:   { duration_hours: 2,   muster_location: 'Grim HEX',                   ship: 'Drake Cutlass Black', crew_needed: 3, roles_wanted: 'pilot, gunner, hauler' },
  other:    { duration_hours: 2,   muster_location: '',                           ship: '',                   crew_needed: 2, roles_wanted: '' },
};

export const OP_TYPES = Object.keys(OP_TYPE_DEFAULTS);

const FIELDS = ['duration_hours', 'muster_location', 'ship', 'crew_needed', 'roles_wanted'];

/**
 * The draft as it stands after switching kind of run.
 *
 * A field is filled only where it is empty, or where it still carries the previous kind's
 * suggestion — so a location the council typed themselves survives every later change of type.
 */
export function applyOpTypeDefaults(form, nextType, previousType) {
  const next = OP_TYPE_DEFAULTS[nextType] || OP_TYPE_DEFAULTS.other;
  const prev = OP_TYPE_DEFAULTS[previousType] || {};
  const out = { ...form, op_type: nextType };

  for (const key of FIELDS) {
    const current = form[key];
    const untouched = current === '' || current === undefined || current === null || String(current) === String(prev[key]);
    if (untouched && next[key] !== '' && next[key] !== undefined) out[key] = next[key];
  }
  return out;
}