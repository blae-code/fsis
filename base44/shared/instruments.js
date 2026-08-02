/**
 * The instruments — the charter, the hall-listing agreement, the release on buyback.
 *
 * A co-op asking its own members to sign things deserves a hard look, so the terms this code
 * enforces are stated here rather than left implied:
 *
 *   - An instrument is a MUTUAL undertaking. FSIS countersigns everything a comrade signs; an
 *     agreement only one side is bound by is not an agreement, it is a condition of entry.
 *   - It is readable in full before it is signed, and readable in full forever afterwards, from one
 *     place. A term nobody can find again is a term that was never really agreed.
 *   - It can be withdrawn from. A signature that cannot be taken back is not consent.
 *   - When the terms change, the old signature does NOT carry over. Re-consent is asked for, and
 *     until it is given the comrade stands on the version they actually agreed to — never on one
 *     written after the fact.
 *
 * That last rule is the one that does the work. Versioning a document is easy; refusing to let a new
 * version silently bind somebody who signed an older one is the whole point.
 */

/** What the hall asks anybody to put their name to. */
export const INSTRUMENT_KINDS = ['charter', 'listing_agreement', 'buyback_release', 'other'];

/** A signature stands until it is withdrawn or its version is superseded. */
export const SIGNATURE_STATES = ['signed', 'superseded', 'withdrawn'];

/** Version numbers are whole and count upward. */
export function normaliseVersion(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** The version of an instrument presently in force. */
export function currentVersion(instrument) {
  return normaliseVersion(instrument?.version);
}

/**
 * Whether a comrade's signature still covers the terms as they now stand.
 *
 * A withdrawn signature covers nothing. A signature on an older version covers that older version —
 * it is not void, it simply does not reach the new terms, and the difference matters: the comrade is
 * still bound by what they agreed and still owed everything it promised them.
 */
export function signatureStatus(signature, instrument) {
  if (!signature) return { state: 'none', covers_current: false, needs_reconsent: false };
  if (signature.withdrawn_at) {
    return { state: 'withdrawn', covers_current: false, needs_reconsent: false };
  }

  const signed = normaliseVersion(signature.accepted_version);
  const current = currentVersion(instrument);
  if (signed >= current) {
    return { state: 'signed', covers_current: true, needs_reconsent: false, accepted_version: signed };
  }
  return {
    state: 'superseded',
    covers_current: false,
    needs_reconsent: true,
    accepted_version: signed,
    current_version: current,
  };
}

/** The signature a comrade presently holds on an instrument — their latest, whatever its state. */
export function latestSignature(signatures, userId, instrumentId) {
  return (signatures || [])
    .filter((s) => s.signatory_user_id === userId && s.instrument_id === instrumentId)
    .sort((a, b) => String(b.signed_at || '').localeCompare(String(a.signed_at || '')))[0] || null;
}

/**
 * Whether a comrade may do the thing this instrument governs.
 *
 * Only a signature covering the CURRENT terms opens the door. Someone on an older version is not
 * shut out as a punishment — they are asked to read what changed and agree to it, which is the only
 * honest way to hold anybody to a term they have not seen.
 */
export function mayProceed(signature, instrument) {
  const status = signatureStatus(signature, instrument);
  if (status.covers_current) return { allowed: true, reason: '' };

  if (status.state === 'none') {
    return {
      allowed: false,
      reason: `Read and sign the ${instrument?.title || 'agreement'} first. It is short, and it says what the hall owes you as well as what you owe the hall.`,
    };
  }
  if (status.state === 'withdrawn') {
    return {
      allowed: false,
      reason: `You withdrew from the ${instrument?.title || 'agreement'}. Sign it again if you wish to carry on — nothing is held against you for having withdrawn.`,
    };
  }
  return {
    allowed: false,
    reason: `The ${instrument?.title || 'agreement'} has changed since you signed it (you are on version ${status.accepted_version}, the hall is on ${status.current_version}). Read what changed and agree to it, or carry on under the version you signed for anything already in hand.`,
  };
}

/** A plain summary of what a comrade has put their name to, for the one place they read them all. */
export function signatureSummary(signature, instrument) {
  const status = signatureStatus(signature, instrument);
  return {
    instrument_id: instrument?.id || signature?.instrument_id || '',
    kind: instrument?.kind || '',
    title: instrument?.title || signature?.instrument_title || '',
    accepted_version: normaliseVersion(signature?.accepted_version),
    current_version: currentVersion(instrument),
    signed_at: signature?.signed_at || '',
    countersigned_at: signature?.countersigned_at || '',
    countersigned_by_email: signature?.countersigned_by_email || '',
    withdrawn_at: signature?.withdrawn_at || '',
    withdrawal_reason: signature?.withdrawal_reason || '',
    state: status.state,
    covers_current: status.covers_current,
    needs_reconsent: status.needs_reconsent,
  };
}
