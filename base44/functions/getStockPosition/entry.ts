import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import { stockPosition, itemMargin, ageBand, daysHeld, DEAD_AFTER_DAYS } from '../../shared/stock.js';
import { reportError } from '../../shared/diagnostics.js';

/**
 * The shelf, read as a business.
 *
 * Two questions a scrapyard asks first and this app could not answer: did we make anything on that,
 * and how long has it been sitting? The first was buried in prose; the second was never measured at
 * all. A yard can be busy, well-run and completely out of cash at the same time — stock is money
 * already spent, and dead stock is money spent on something nobody wants.
 *
 * Margin is only ever stated where the cost is actually known. An average that quietly includes
 * items with no recorded cost is a fiction, so those are counted separately and named.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const svc = base44.asServiceRole.entities;

    const items = await svc.loot_item.list('-created_date', 800);
    const position = stockPosition(items, now);

    // What has been sitting longest, worst first — the actual worklist.
    const sitting = items
      .filter((i: any) => !(Number(i.actual_sell_auec) > 0) && i.acquisition_source !== 'consignment')
      .map((i: any) => ({
        id: i.id,
        item_name: i.item_name,
        item_type: i.item_type,
        condition_grade: i.condition_grade,
        days_held: daysHeld(i, now),
        age_band: ageBand(i, now),
        acquisition_source: i.acquisition_source || 'salvage',
        ...itemMargin(i),
      }))
      .sort((a: any, b: any) => b.days_held - a.days_held);

    const ledger = body?.include_treasury === false
      ? []
      : await svc.ledger_entry.list('-entry_date', 500).catch(() => []);
    const balance = ledger.reduce((total: number, e: any) => total
      + (e.entry_type === 'income' ? (Number(e.amount_auec) || 0) : -(Number(e.amount_auec) || 0)), 0);

    return Response.json({
      checked_at: now.toISOString(),
      position,
      treasury_auec: Math.round(balance),
      // The one figure worth putting at the top of a management screen.
      headline: position.ageing.dead > 0
        ? `${position.capital_tied_up_auec.toLocaleString()} aUEC sitting in stock, of which ${position.ageing.dead_capital_auec.toLocaleString()} has not moved in ${DEAD_AFTER_DAYS} days.`
        : `${position.capital_tied_up_auec.toLocaleString()} aUEC sitting in stock, all of it moving.`,
      dead_stock: sitting.filter((i: any) => i.age_band === 'dead').slice(0, 50),
      slow_stock: sitting.filter((i: any) => i.age_band === 'slow').slice(0, 50),
      oldest: sitting.slice(0, 20),
      note: position.realised.priced_without_cost > 0
        ? `${position.realised.priced_without_cost} sold item(s) carry no recorded acquisition cost, so they are left out of the margin figures rather than averaged in as though they were free.`
        : '',
    });
  } catch (error) {
    await reportError(base44, { source: 'getStockPosition', error, route: 'getStockPosition' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
