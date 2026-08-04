import { sessionValue } from '@/components/apps/salvage/SessionSummary';

export const CODES = ['RMC', 'CMR', 'CMS'];
export const FIELD = { RMC: 'rmc_scu', CMR: 'cmr_scu', CMS: 'cms_scu' };
export const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];

/**
 * What a run brought back, read at closeout: each material, what it is worth at the best market
 * price we hold, and the total.
 *
 * The value is a READING, not a receipt. It uses the session's own stored estimate where one was
 * saved, and live best-sell prices otherwise — the same basis as the salvage dashboards, so the
 * figure a comrade sees here is the figure they see everywhere else.
 */
export function closeoutSummary(session, bestPrices = {}) {
  const lines = CODES.map((code) => {
    const scu = Number(session[FIELD[code]]) || 0;
    const unit = Number(bestPrices?.[code]?.price_sell) || 0;
    return { code, scu, unit, value: Math.round(scu * unit), terminal: bestPrices?.[code]?.terminal_name || '' };
  });

  const totalScu = lines.reduce((s, l) => s + l.scu, 0);
  const priced = lines.reduce((s, l) => s + l.value, 0);
  // A stored estimate is the operator's own figure and outranks anything computed here.
  const stored = Number(session.estimated_value) || 0;
  const total = Math.round(sessionValue(session, bestPrices)) || priced;

  return {
    lines,
    totalScu,
    total,
    hulls: Number(session.hulls_scraped) || 0,
    basis: stored > 0
      ? 'Uses the estimate saved on this run.'
      : Object.keys(bestPrices).length === 0
        ? 'No market prices held — sync UEX for a value.'
        : 'Priced at the best sell price we currently hold. Verify in game before selling.',
  };
}

/** The summary as plain text, for pasting into Spectrum or Discord. */
export function closeoutText(session, s) {
  const rows = s.lines.filter((l) => l.scu > 0)
    .map((l) => `${l.code}: ${l.scu.toLocaleString()} SCU — ${l.value.toLocaleString()} aUEC${l.terminal ? ` @ ${l.terminal}` : ''}`)
    .join('\n');
  return `FSIS SALVAGE RUN — ${session.session_name}
${session.ship || 'unknown hull'}${session.location ? ` · ${session.location}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${rows || 'Nothing gathered.'}
Hulls scraped: ${s.hulls}
TOTAL: ${s.totalScu.toLocaleString()} SCU · ~${s.total.toLocaleString()} aUEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${s.basis}`;
}