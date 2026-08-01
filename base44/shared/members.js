/**
 * Who a comrade is, when it comes time to be paid.
 *
 * Pay was keyed to a callsign typed into a field: match the string, draw the share. But a callsign
 * is a name a comrade chooses, and it can be changed — by them, or by the council on a standing
 * ruling. The labour they gave does not change with it. Keying pay to a mutable name means a
 * rename can quietly cut a hand off from work already done, and it means the guard on an election
 * ("nobody may elect on someone else's behalf") rests on a string anyone might come to hold.
 *
 * So the account is the key, and the callsign is what we call them by. Two rules follow:
 *
 *   1. A roster place already claimed by an account belongs to that account. A matching callsign
 *      does not open it. This is the whole point: a name is not a credential.
 *   2. Records written before this carry only a callsign, so every lookup falls back to the name.
 *      No comrade loses shares because of when their record happened to be written. The fallback
 *      is a bridge, not a foundation — once a place carries `user_id`, the name is display only.
 *
 * Nothing here decides what anyone is owed. It decides only whose labour is whose.
 */

import { fsisRole } from './roles.js';
import { roundShares } from './money.js';

/** One way of reading a callsign, so two spellings of the same name are the same name. */
export function normaliseHandle(handle) {
  return String(handle ?? '').trim().toLowerCase();
}

/** Two callsigns are the same only if both are actually present. An empty name matches nobody. */
export function sameHandle(a, b) {
  const left = normaliseHandle(a);
  return left.length > 0 && left === normaliseHandle(b);
}

/**
 * The roster place belonging to an account.
 *
 * The account link is authoritative. Only when a place has never been linked do we fall back to
 * the callsign — a claimed place is never reachable by name, so nobody inherits another comrade's
 * shares by coming to hold their old callsign.
 */
export function findCrewMemberFor(crew, user) {
  if (!user?.id) return null;
  const linked = (crew || []).find((member) => member.user_id && member.user_id === user.id);
  if (linked) return linked;
  return (crew || []).find((member) => !member.user_id && sameHandle(member.handle, user.handle)) || null;
}

/**
 * The confirmed labour standing to one comrade's name.
 *
 * A log that names an account is read by account and by nothing else; a log old enough to carry
 * only a callsign is read by callsign. A log is never counted twice, and never counted for the
 * wrong hand.
 *
 * @param {any[]} logs
 * @param {{ userId?: string, handle?: string }} [owner]
 * @returns {any[]}
 */
export function logsBelongingTo(logs, { userId, handle } = {}) {
  return (logs || []).filter((log) =>
    log.member_user_id ? log.member_user_id === userId : sameHandle(log.handle, handle),
  );
}

/**
 * Every confirmed log standing to a comrade, gathered by account and by callsign both, then
 * reduced to only what is genuinely theirs.
 *
 * Two narrow queries rather than one broad sweep, so a busy yard cannot push a quiet hand's
 * labour off the end of a limit. The callsign query is the bridge for older logs, and anything
 * it turns up that names a different account is dropped on the way out.
 *
 * @param {any} base44
 * @param {{ userId?: string, handle?: string, limit?: number }} [options]
 * @returns {Promise<any[]>}
 */
export async function fetchConfirmedLogsFor(base44, { userId, handle, limit = 500 } = {}) {
  const timeLog = base44.asServiceRole.entities.time_log;
  const queries = [];
  if (userId) queries.push(timeLog.filter({ status: 'confirmed', member_user_id: userId }, '-work_date', limit));
  if (handle) queries.push(timeLog.filter({ status: 'confirmed', handle }, '-work_date', limit));

  const found = (await Promise.all(queries)).flat();
  const unique = new Map();
  for (const log of found) {
    if (log?.id && !unique.has(log.id)) unique.set(log.id, log);
  }

  // Merging two queries loses the order each came back in, so it is restored here — anything
  // reading "the most recent so many" must get the most recent.
  return logsBelongingTo([...unique.values()], { userId, handle }).sort((a, b) =>
    String(b.work_date || b.created_date || '').localeCompare(String(a.work_date || a.created_date || '')),
  );
}

/** What those logs come to in shares. */
export function sharesInLogs(logs) {
  return roundShares((logs || []).reduce((total, log) => total + (Number(log.shares) || 0), 0));
}

/**
 * Outstanding shares gathered per comrade, ready to be snapshotted into a cycle.
 *
 * Where a comrade has some labour recorded against their account and older labour recorded only
 * against their callsign, the two are one hand and are gathered as one — otherwise they would
 * appear on the cycle twice and be settled twice over.
 */
export function groupLogsByMember(logs) {
  const rows = logs || [];

  // Learn each callsign's account from any log that carries both, so older logs can be brought in.
  const accountByHandle = new Map();
  for (const log of rows) {
    const handle = normaliseHandle(log.handle);
    if (log.member_user_id && handle && !accountByHandle.has(handle)) {
      accountByHandle.set(handle, log.member_user_id);
    }
  }

  const groups = new Map();
  for (const log of rows) {
    const handle = normaliseHandle(log.handle);
    const userId = log.member_user_id || accountByHandle.get(handle) || '';
    const key = userId || (handle ? `callsign:${handle}` : '');
    if (!key) continue; // A log naming nobody pays nobody.

    const group = groups.get(key) || { user_id: userId, handle: log.handle || '', shares: 0 };
    group.shares += Number(log.shares) || 0;
    if (!group.user_id && userId) group.user_id = userId;
    if (!group.handle && log.handle) group.handle = log.handle;
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => ({ ...group, shares: roundShares(group.shares) }));
}

/**
 * Contractors stand outside the co-op. Their labour is settled in full at the point of work, so
 * it is never diluted into — nor drawn from — the members' share pool.
 */
export function drawsFromSharePool(user) {
  return fsisRole(user) !== 'contractor';
}

/**
 * An index of the comrades who stand outside the pool, readable by account or by callsign.
 * Built once per cycle rather than queried per hand.
 */
export function contractorIndex(contractorUsers) {
  const ids = new Set();
  const handles = new Set();
  for (const user of contractorUsers || []) {
    if (user.id) ids.add(user.id);
    const handle = normaliseHandle(user.handle);
    if (handle) handles.add(handle);
  }
  return { ids, handles };
}

/**
 * Whether a line on a cycle snapshot belongs to a contractor.
 * The account settles it where the snapshot carries one; older snapshots fall back to the callsign.
 */
export function isContractorLine(index, line) {
  if (!index || !line) return false;
  if (line.user_id) return index.ids.has(line.user_id);
  return index.handles.has(normaliseHandle(line.handle));
}
