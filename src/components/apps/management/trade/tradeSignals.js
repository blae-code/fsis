/**
 * What the shop side of the house is actually owed an answer on, and its vitals.
 * Read-only arithmetic over records already fetched — no writes, no side effects,
 * so the trade deck can show the same figures the desks below it act on.
 */
const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();

export function tradeModel({ orders = [], products = [], restocks = [], codes = [] }) {
  const newOrders = orders.filter((o) => o.status === 'new');
  const confirmed = orders.filter((o) => o.status === 'confirmed' || o.status === 'in_fulfillment');
  const openOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const deliveredToday = orders.filter((o) => o.status === 'delivered' && isToday(o.updated_date)).length;
  const listed = products.filter((p) => p.available);
  const outOfStock = listed.filter((p) => Number(p.stock || 0) <= 0);
  const waitingNotify = restocks.filter((r) => r.request_type !== 'reserve' && !r.notified);
  const openReserves = restocks.filter((r) => r.request_type === 'reserve' && r.reserve_status !== 'reserved');
  const activeCodes = codes.filter((c) => c.active);
  const unpriced = listed.filter((p) => !Number(p.price_auec));

  const counts = {
    catalogue: outOfStock.length,
    orders: newOrders.length + confirmed.length,
    inbox: waitingNotify.length,
    restock: openReserves.length,
    discounts: activeCodes.length,
    pricing: unpriced.length,
  };

  const signals = [
    newOrders.length && { desk: 'orders', severity: 'critical', count: newOrders.length, label: 'ORDERS UNANSWERED', detail: 'Placed and not yet confirmed — a buyer is waiting on a word.' },
    confirmed.length && { desk: 'orders', severity: 'warning', count: confirmed.length, label: 'IN FULFILMENT', detail: 'Confirmed and owing delivery.' },
    outOfStock.length && { desk: 'catalogue', severity: 'warning', count: outOfStock.length, label: 'LISTED, NO STOCK', detail: 'On the shelf with nothing behind it — buyers can order what we cannot hand over.' },
    waitingNotify.length && { desk: 'inbox', severity: 'notice', count: waitingNotify.length, label: 'ASKED TO BE TOLD', detail: 'Buyers waiting to hear the item is back.' },
    openReserves.length && { desk: 'restock', severity: 'warning', count: openReserves.length, label: 'RESERVES UNFILLED', detail: 'Promised stock not yet allocated from a restock.' },
    unpriced.length && { desk: 'pricing', severity: 'critical', count: unpriced.length, label: 'LISTED WITHOUT A PRICE', detail: 'Nothing can be sold at no price — set one before it is found.' },
    !activeCodes.length && { desk: 'discounts', severity: 'notice', count: 0, label: 'NO CODE STANDING', detail: 'No discount is presently open to buyers.' },
  ].filter(Boolean);

  const shelfValue = listed.reduce((s, p) => s + Number(p.price_auec || 0) * Number(p.stock || 0), 0);
  const openValue = openOrders.reduce((s, o) => s + Number(o.total_auec || 0), 0);

  const gauges = {
    openOrders: openOrders.length,
    newOrders: newOrders.length,
    deliveredToday,
    openValue,
    shelfValue,
    listed: listed.length,
    outOfStock: outOfStock.length,
    waiting: waitingNotify.length + openReserves.length,
    activeCodes: activeCodes.length,
  };

  return { counts, signals, gauges };
}