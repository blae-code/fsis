/**
 * Whether the haul actually fits in the hull.
 *
 * An Owner calls a muster, six hands turn up, and somewhere over the belt it becomes clear the run
 * needed two trips nobody planned for — so the last of it is left behind, or a comrade flies a
 * second sortie on their own time. Both outcomes fall on the crew rather than on whoever did the
 * planning, which is exactly backwards.
 *
 * This is arithmetic anybody could do; the point is that it gets done BEFORE the muster is called
 * rather than discovered in the middle of a run.
 */

import { roundShares } from './money.js';

/** Cargo is quoted in SCU, whole units — a fractional SCU is a typo, not a measurement. */
export const SCU_DECIMALS = 0;

const scu = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** How many runs it takes to move this much in a hull that holds that much. */
export function tripsNeeded(haulScu, capacityScu) {
  const haul = scu(haulScu);
  const capacity = scu(capacityScu);
  if (haul === 0) return 0;
  // No capacity stated is not "infinite trips" — it is a question we cannot answer, said as null.
  if (capacity === 0) return null;
  return Math.ceil(haul / capacity);
}

/**
 * The plan, stated plainly.
 *
 * Where capacity is unknown it says so rather than guessing; a confident wrong answer about whether
 * a run fits is worse than an admitted gap, because somebody will act on it.
 */
export function haulPlan({ expected_haul_scu, hull_capacity_scu } = {}) {
  const haul = scu(expected_haul_scu);
  const capacity = scu(hull_capacity_scu);
  const trips = tripsNeeded(haul, capacity);

  if (capacity === 0) {
    return {
      haul_scu: haul,
      capacity_scu: 0,
      trips: null,
      fits: null,
      spare_scu: 0,
      overflow_scu: 0,
      note: haul > 0
        ? 'No hull capacity stated, so whether this haul fits cannot be reckoned. State the hull and it will be.'
        : 'Nothing stated to carry, and no hull stated to carry it in.',
    };
  }

  const fits = haul <= capacity;
  return {
    haul_scu: haul,
    capacity_scu: capacity,
    trips,
    fits,
    spare_scu: fits ? capacity - haul : 0,
    overflow_scu: fits ? 0 : haul - capacity,
    note: haul === 0
      ? 'Nothing expected back yet. The hull holds ' + capacity + ' SCU when there is.'
      : fits
        ? `The haul fits in one run, with ${capacity - haul} SCU to spare.`
        : `The haul does not fit: ${haul - capacity} SCU over, so it takes ${trips} runs. Say so before the muster rather than discovering it over the belt.`,
  };
}

/** What has actually come back, from the lots attached to the run. */
export function actualHaul(cargoLots) {
  return (cargoLots || []).reduce((total, lot) => total + scu(lot?.quantity_scu), 0);
}

/**
 * The expectation measured against what came back.
 *
 * Reported so the NEXT estimate is better, and for no other purpose. This is not a measure of
 * anybody's performance — a run that came back light was usually a run where the field was thin,
 * and treating that as a failing would teach the yard to promise less rather than plan better.
 */
export function haulAccuracy(expectedScu, actualScu) {
  const expected = scu(expectedScu);
  const actual = scu(actualScu);
  if (expected === 0) return { expected_scu: 0, actual_scu: actual, ratio: null, note: 'Nothing was estimated, so there is nothing to compare.' };
  return {
    expected_scu: expected,
    actual_scu: actual,
    ratio: roundShares(actual / expected),
    note: 'A reading to make the next estimate better, not a measure of the hands who flew it.',
  };
}
