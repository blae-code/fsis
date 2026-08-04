/** Arithmetic behind the salvage value dashboard. Read-only over sessions already fetched. */
export const MATERIALS = [
  { code: 'RMC', field: 'rmc_scu', label: 'RECYCLED MATERIAL COMPOSITE', color: '#E0A22E' },
  { code: 'CMR', field: 'cmr_scu', label: 'CONSTRUCTION MATERIALS (RECLAIMED)', color: '#6FA0C8' },
  { code: 'CMS', field: 'cms_scu', label: 'CONSTRUCTION MATERIALS (SALVAGED)', color: '#8A8F45' },
];

const unitPrice = (bestPrices, code) => Number(bestPrices?.[code]?.price_sell) || 0;

/** What one session is worth: its own recorded figure if it has one, else SCU × best sell. */
export function sessionValue(s, bestPrices) {
  const marked = Number(s.estimated_value) || 0;
  if (marked > 0) return marked;
  return MATERIALS.reduce((sum, m) => sum + (Number(s[m.field]) || 0) * unitPrice(bestPrices, m.code), 0);
}

export function salvageValueModel({ sessions = [], bestPrices = {}, limit = 12 }) {
  const recent = [...sessions]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-limit);

  let running = 0;
  const trend = recent.map((s) => {
    const value = sessionValue(s, bestPrices);
    running += value;
    return {
      name: s.session_name || 'UNNAMED',
      date: s.created_date ? new Date(s.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '',
      value: Math.round(value),
      cumulative: Math.round(running),
      rmc: Number(s.rmc_scu) || 0,
      cmr: Number(s.cmr_scu) || 0,
      cms: Number(s.cms_scu) || 0,
      hulls: Number(s.hulls_scraped) || 0,
      status: s.status,
    };
  });

  const totalValue = sessions.reduce((sum, s) => sum + sessionValue(s, bestPrices), 0);
  const soldValue = sessions.filter((s) => s.status === 'sold').reduce((sum, s) => sum + sessionValue(s, bestPrices), 0);
  const totalScu = sessions.reduce(
    (sum, s) => sum + MATERIALS.reduce((m, mat) => m + (Number(s[mat.field]) || 0), 0),
    0,
  );
  const hulls = sessions.reduce((sum, s) => sum + (Number(s.hulls_scraped) || 0), 0);

  const breakdown = MATERIALS.map((m) => {
    const scu = sessions.reduce((sum, s) => sum + (Number(s[m.field]) || 0), 0);
    const price = unitPrice(bestPrices, m.code);
    return { ...m, scu, price, value: scu * price, share: totalScu > 0 ? scu / totalScu : 0 };
  });

  return {
    trend,
    breakdown,
    totals: {
      value: totalValue,
      sold: soldValue,
      open: totalValue - soldValue,
      scu: totalScu,
      hulls,
      sessions: sessions.length,
      perScu: totalScu > 0 ? totalValue / totalScu : 0,
      perSession: sessions.length > 0 ? totalValue / sessions.length : 0,
    },
  };
}