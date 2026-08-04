/**
 * The watchfloor's judgement: everything on the deck reduced to the short list of
 * things actually waiting on a decision, ranked by how loudly they are waiting.
 * Nothing here is a metric — every signal names a thing to do and where to do it.
 */

const HOUR = 3600 * 1000;
const RANK = { critical: 0, warning: 1, notice: 2 };

export function buildSignals({ orders = [], loot = [], products = [], restocks = [], messages = [], prices = [] }) {
  const now = Date.now();
  const out = [];
  const push = (s) => { if (s.count > 0) out.push(s); };

  const newOrders = orders.filter((o) => o.status === 'new');
  const overdue = orders.filter((o) => ['new', 'confirmed'].includes(o.status) && now - new Date(o.created_date).getTime() > 48 * HOUR);
  const inFlight = orders.filter((o) => o.status === 'in_fulfillment');
  const handoffs = orders.filter((o) => o.handoff_status === 'requested');

  push({ id: 'overdue', severity: 'critical', count: overdue.length, label: 'ORDERS PAST 48H', detail: 'Buyers still waiting past the promise. Move or explain.', stage: 'fulfil' });
  push({ id: 'new', severity: 'warning', count: newOrders.length, label: 'ORDERS UNCONFIRMED', detail: 'Not yet acknowledged to the buyer.', stage: 'fulfil' });
  push({ id: 'flight', severity: 'notice', count: inFlight.length, label: 'IN FULFILMENT', detail: 'Picked and moving — close them out.', stage: 'fulfil' });
  push({ id: 'handoff', severity: 'warning', count: handoffs.length, label: 'HANDOFFS UNANSWERED', detail: 'A meet was proposed and nobody has confirmed it.', stage: 'handoff' });

  const unpriced = loot.filter((l) => !l.est_sell_auec && l.status !== 'sold');
  push({ id: 'unpriced', severity: 'warning', count: unpriced.length, label: 'LOOT UNPRICED', detail: 'Recovered and sitting unvalued — no price, no sale.', stage: 'appraise' });

  const empty = products.filter((p) => p.available && Number(p.stock || 0) === 0);
  const low = products.filter((p) => p.available && Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 2);
  push({ id: 'empty', severity: 'critical', count: empty.length, label: 'LISTED BUT EMPTY', detail: 'On the storefront with nothing behind it.', stage: 'intake' });
  push({ id: 'low', severity: 'notice', count: low.length, label: 'STOCK RUNNING THIN', detail: 'Two units or fewer left on the shelf.', stage: 'intake' });

  const reserves = restocks.filter((r) => r.request_type === 'reserve' && r.reserve_status === 'open');
  push({ id: 'reserve', severity: 'warning', count: reserves.length, label: 'RESERVES UNFILLED', detail: 'Buyers queued for stock that has not landed.', stage: 'list' });

  const recentMsgs = messages.filter((m) => now - new Date(m.created_date).getTime() < 72 * HOUR);
  push({ id: 'msgs', severity: 'notice', count: recentMsgs.length, label: 'BUYER MESSAGES', detail: 'Sent in the last three days.', stage: 'fulfil' });

  const stale = prices.filter((p) => !p.synced_at || now - new Date(p.synced_at).getTime() > 24 * HOUR);
  push({ id: 'stale', severity: stale.length > 20 ? 'warning' : 'notice', count: stale.length, label: 'PRICES STALE', detail: 'Market reads older than a day — repricing on them is guesswork.', stage: 'systems' });

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count);
}

export function gaugeModel({ orders = [], ledger = [], products = [], loot = [], invoices = [] }) {
  const now = Date.now();
  const since = now - 30 * 24 * HOUR;
  const inWindow = ledger.filter((e) => new Date(e.entry_date || e.created_date).getTime() >= since);
  const income = inWindow.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const expense = inWindow.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  return {
    income,
    expense,
    net: income - expense,
    margin: income > 0 ? ((income - expense) / income) * 100 : 0,
    openOrders: orders.filter((o) => ['new', 'confirmed', 'in_fulfillment'].includes(o.status)).length,
    deliveredToday: orders.filter((o) => o.status === 'delivered' && String(o.updated_date || '').slice(0, 10) === today).length,
    shelfValue: products.filter((p) => p.available).reduce((s, p) => s + (p.price_auec || 0) * Number(p.stock || 0), 0),
    lootHeld: loot.filter((l) => l.status !== 'sold').length,
    unpaidInvoices: invoices.filter((i) => i.status && i.status !== 'paid').length,
  };
}