/**
 * Time, as each comrade actually experiences it.
 *
 * Timezones have been collected on every application and never once read back, so every muster has
 * been posted in one zone and everybody else has done the arithmetic themselves — or got it wrong
 * and missed the run. That is a small unfairness that falls entirely on whoever does not live where
 * the proprietor lives, and it compounds: the comrades who keep missing runs stop answering.
 *
 * Three things here, all of them plain arithmetic done once so nobody has to do it in their head:
 *
 *   - a time expressed in somebody's own zone;
 *   - a reading of which hours actually suit the people who answered, rather than which hour suited
 *     whoever wrote the notice;
 *   - a calendar file, so the run goes in the same place as the rest of their life.
 */

/** The hours a run is worth calling, in each comrade's own evening. */
export const EVENING_START_HOUR = 18;
export const EVENING_END_HOUR = 23;

/**
 * How far a zone stands from UTC at a given instant.
 *
 * Computed at the instant rather than assumed, so a run in July and a run in December read correctly
 * in a zone that keeps summer time. An unknown zone returns null and is simply left out of any
 * reckoning rather than being silently treated as UTC — quietly assuming a zone is how somebody ends
 * up told the wrong hour with total confidence.
 */
export function offsetMinutes(timeZone, at = new Date()) {
  if (!timeZone) return null;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = {};
    for (const part of dtf.formatToParts(at)) parts[part.type] = part.value;
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
    );
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return null;
  }
}

/** Whether a zone is one we can actually reckon in. */
export function knownZone(timeZone) {
  return offsetMinutes(timeZone, new Date()) !== null;
}

/** An instant as a comrade's own clock shows it. */
export function localTime(instant, timeZone) {
  const at = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(at.getTime())) return null;
  const offset = offsetMinutes(timeZone, at);
  if (offset === null) return null;

  const shifted = new Date(at.getTime() + offset * 60000);
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  return {
    time_zone: timeZone,
    hour,
    minute,
    date: shifted.toISOString().slice(0, 10),
    label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    in_evening: hour >= EVENING_START_HOUR && hour <= EVENING_END_HOUR,
  };
}

/**
 * Which hours actually suit the people who answered.
 *
 * For each hour of the day, counts how many respondents would be in their own evening. Returns every
 * hour ranked, not just the winner, because the council may have reasons of their own and is owed
 * the whole picture rather than a single number presented as an answer.
 *
 * @returns {any[]}
 */
export function bestTimes(timeZones, on = new Date()) {
  const zones = [...new Set((timeZones || []).filter(Boolean))].filter(knownZone);
  if (zones.length === 0) return [];

  const day = new Date(Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), on.getUTCDate()));
  const ranked = [];

  for (let utcHour = 0; utcHour < 24; utcHour += 1) {
    const instant = new Date(day.getTime() + utcHour * 3600000);
    const suits = [];
    const awkward = [];
    for (const zone of zones) {
      const local = localTime(instant, zone);
      if (!local) continue;
      (local.in_evening ? suits : awkward).push({ time_zone: zone, local: local.label });
    }
    ranked.push({
      utc_hour: utcHour,
      utc_label: `${String(utcHour).padStart(2, '0')}:00 UTC`,
      suits: suits.length,
      of: zones.length,
      suits_zones: suits,
      awkward_for: awkward,
    });
  }

  return ranked.sort((a, b) => (b.suits - a.suits) || (a.utc_hour - b.utc_hour));
}

/** Text as a calendar file may carry it. */
const icsEscape = (text) => String(text || '')
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

const icsStamp = (value) => {
  const at = value instanceof Date ? value : new Date(value);
  return `${at.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
};

/**
 * The run, as a file a comrade can put in their own calendar.
 *
 * Written in UTC with the zone left to their own software, which knows their clock better than we
 * do. Folded to 75 octets because a calendar file that a client refuses to open is worse than none.
 */
export function musterIcs(operation, { uid, now = new Date() } = {}) {
  const start = operation?.starts_at ? new Date(operation.starts_at) : null;
  if (!start || Number.isNaN(start.getTime())) return null;

  const hours = Number(operation?.duration_hours) > 0 ? Number(operation.duration_hours) : 2;
  const end = new Date(start.getTime() + hours * 3600000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FSIS//Muster//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(uid || operation?.id || `muster-${start.getTime()}`)}@fsis`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(operation?.op_name || 'FSIS muster')}`,
    `DESCRIPTION:${icsEscape([operation?.brief, operation?.ship ? `Hull: ${operation.ship}` : ''].filter(Boolean).join('\n'))}`,
    `LOCATION:${icsEscape(operation?.muster_location || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.flatMap(foldLine).join('\r\n');
}

/** iCalendar lines are folded at 75 octets, continuations beginning with a space. */
function foldLine(line) {
  if (line.length <= 75) return [line];
  const out = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    out.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) out.push(` ${rest}`);
  return out;
}

/** The notices a muster owes before it happens. */
export const REMINDERS = [
  { key: 't24', hours: 24, label: 'tomorrow' },
  { key: 't1', hours: 1, label: 'within the hour' },
];

/**
 * Which reminders a muster is owed now.
 *
 * A reminder already sent is never sent again, and a reminder whose moment has passed is not fired
 * late — a "within the hour" notice arriving after the run began tells a comrade only that they
 * missed it.
 *
 * @returns {any[]}
 */
export function dueReminders(operation, now = new Date()) {
  if (!operation?.starts_at) return [];
  if (['completed', 'stood_down'].includes(operation.status)) return [];

  const start = new Date(operation.starts_at);
  if (Number.isNaN(start.getTime()) || start <= now) return [];

  const sent = new Set(operation.reminders_sent || []);
  const minutesAway = (start.getTime() - now.getTime()) / 60000;

  return REMINDERS.filter((reminder) => {
    if (sent.has(reminder.key)) return false;
    return minutesAway <= reminder.hours * 60;
  });
}
