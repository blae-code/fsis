// Regolith-style payout math: net = gross - expenses, split by crew shares.
export function computePayout(order) {
  const gross = order.gross_auec || 0;
  const expenseTotal = (order.expenses || []).reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = Math.max(0, gross - expenseTotal);
  const totalShares = (order.crew_shares || []).reduce((s, c) => s + (c.shares || 0), 0);
  const rows = (order.crew_shares || []).map((c) => ({
    handle: c.handle,
    shares: c.shares || 0,
    payout: totalShares > 0 ? Math.floor((net * (c.shares || 0)) / totalShares) : 0,
  }));
  return { gross, expenseTotal, net, totalShares, rows };
}

export function payoutText(order) {
  const p = computePayout(order);
  const lines = [
    `FSIS FairShare Payout — ${order.order_name}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Gross: ${p.gross.toLocaleString()} aUEC`,
    `Expenses: -${p.expenseTotal.toLocaleString()} aUEC`,
    `Net: ${p.net.toLocaleString()} aUEC (${p.totalShares} shares)`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...p.rows.map((r) => `${r.handle} (${r.shares}x): ${r.payout.toLocaleString()} aUEC`),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '"Every credit accounted for."',
  ];
  return lines.join('\n');
}