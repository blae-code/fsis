import { safeDisplay } from './callsigns.js';
/**
 * Telling a comrade what was decided about their labour.
 *
 * Until now the app changed things about people and said nothing. Work was credited, returned or
 * lapsed; a mark was written against a standing; a muster was stood down after hands had said they
 * were in. In every one of those cases the comrade found out by refreshing a page, if they thought
 * to look. That is not an oversight in the interface — a decision nobody is told about is a
 * decision taken behind their back, and the appeal window runs whether or not they knew.
 *
 * So notice is written the same way an ops_log entry is written: by the function that did the
 * thing, at the moment it did it, naming who did it.
 *
 * Two rules hold here, and they matter more than the plumbing:
 *
 *   1. Notice is addressed to a person. Nothing is broadcast, nothing is written to nobody.
 *   2. Failing to give notice must NEVER undo the thing being reported. If crediting a comrade's
 *      labour succeeds and the notice fails, the labour stays credited. Notice is owed to them,
 *      not a condition of them being paid.
 */

/** What can be reported. Named for what happened to the comrade, not for which function sent it. */
export const NOTICE_KINDS = [
  'work_claimed',
  'work_returned',
  'work_credited',
  'work_released',
  'claim_lapsed',
  'standing_marked',
  'standing_lapsed',
  // The buyer's ledger is a wholly separate record and is named separately here too, so a notice
  // about trade conduct can never be mistaken for one about labour standing.
  'trade_marked',
  'trade_standing_lapsed',
  'appeal_answered',
  'muster_called',
  'muster_reminder',
  'muster_stood_down',
  'payday_opened',
  'payday_published',
  'order_update',
  'council_message',
];

const text = (value, limit = 2000) => String(value ?? '').trim().slice(0, limit);

/**
 * Shape one notice, dropping anything addressed to nobody.
 * Returns null when there is no comrade to tell, so callers can filter rather than branch.
 */
export function buildNotice(notice) {
  const recipient = text(notice?.recipient_user_id, 120);
  const title = text(notice?.title, 200);
  if (!recipient || !title) return null;

  const kind = NOTICE_KINDS.includes(notice?.kind) ? notice.kind : 'council_message';
  return {
    recipient_user_id: recipient,
    recipient_handle: text(notice?.recipient_handle, 120),
    kind,
    title,
    body: text(notice?.body),
    source_type: text(notice?.source_type, 60),
    source_id: text(notice?.source_id, 120),
    source_name: text(notice?.source_name, 200),
    actor_email: text(notice?.actor_email, 200),
    // What a comrade actually sees. Derived from the address where a caller passed only that, so a
    // missed call site cannot put somebody's email in front of another member.
    actor_callsign: safeDisplay(notice?.actor_callsign || notice?.actor_email, notice?.actor_email),
    actor_role: text(notice?.actor_role, 40),
    ...(notice?.expires_at ? { expires_at: notice.expires_at } : {}),
  };
}

/**
 * Give notice to several comrades at once.
 *
 * Written in one batch rather than one row at a time, and wrapped so that a failure here cannot
 * roll back the decision that prompted it — the caller has already changed the world, and a
 * comrade being un-credited because we could not tell them would be the worse outcome by far.
 *
 * @param {any} base44
 * @param {any[]} notices
 * @returns {Promise<{ written: number, failed: boolean }>}
 */
export async function notifyMany(base44, notices) {
  const rows = (notices || []).map(buildNotice).filter(Boolean);
  if (rows.length === 0) return { written: 0, failed: false };

  try {
    await base44.asServiceRole.entities.notice.bulkCreate(rows);
    return { written: rows.length, failed: false };
  } catch (error) {
    // Say so in the log, and let the caller's own work stand.
    console.error('notice: could not give notice to', rows.length, 'comrade(s):', error?.message || error);
    return { written: 0, failed: true };
  }
}

/** Give notice to one comrade. */
export async function notify(base44, notice) {
  return notifyMany(base44, [notice]);
}

/**
 * A notice still worth showing: unread, and not past the point where it stops mattering.
 * Notice of a thing that has passed should not crowd out notice of a thing that has not.
 *
 * @param {any[]} notices
 * @param {Date} [now]
 * @returns {any[]}
 */
export function standingNotices(notices, now = new Date()) {
  return (notices || []).filter((n) => !n.expires_at || new Date(n.expires_at) > now);
}

/** How many a comrade has not yet read. */
export function unreadCount(notices) {
  return (notices || []).filter((n) => !n.read_at).length;
}
