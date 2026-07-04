import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot briefing agent: runs on a daily schedule, gathers operational data
// across the whole FSIS stack and uses AI to compose a morning ops brief.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const [sessions, orders, contracts, workOrders, snapshots] = await Promise.all([
      svc.salvage_session.list('-updated_date', 100),
      svc.order.list('-created_date', 100),
      svc.contract.list('-created_date', 100),
      svc.work_order.list('-created_date', 100),
      svc.price_snapshot.list('-captured_at', 10),
    ]);

    const stats = {
      active_sessions: sessions.filter((s) => ['planning', 'in-progress', 'hauling'].includes(s.status)).length,
      cargo_rmc_scu: sessions.filter((s) => ['in-progress', 'hauling'].includes(s.status)).reduce((t, s) => t + (s.rmc_scu || 0), 0),
      open_orders: orders.filter((o) => ['new', 'confirmed', 'in_fulfillment'].includes(o.status)).length,
      new_orders: orders.filter((o) => o.status === 'new').length,
      open_contracts: contracts.filter((c) => ['open', 'in_progress'].includes(c.status)).length,
      unsettled_work_orders: workOrders.filter((w) => w.status === 'open').length,
      unsettled_payout_auec: workOrders.filter((w) => w.status === 'open').reduce((t, w) => t + (w.gross_auec || 0), 0),
      latest_prices: snapshots.slice(0, 3).map((s) => `${s.commodity_code}: ${s.best_sell} aUEC @ ${s.best_terminal}`),
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are FSIS.bot, the AI ops officer for Fairshare Industrial Solutions, a Star Citizen salvage company. Compose today's morning operations brief from this data:\n\n${JSON.stringify(stats, null, 2)}\n\nWrite a punchy one-line headline and a short markdown body (max 120 words): current ops tempo, anything needing attention (new orders to triage, unsettled crew payouts, open contracts), and a one-line market read from the latest prices. Stay in-universe, professional, no fluff.`,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['headline', 'body'],
      },
    });

    const brief = await svc.ops_brief.create({
      headline: result.headline,
      body: result.body,
      stats,
      brief_date: new Date().toISOString().slice(0, 10),
    });

    console.log(`Ops brief created: ${result.headline}`);
    return Response.json({ created: true, brief_id: brief.id, headline: result.headline });
  } catch (error) {
    console.error('dailyBriefing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});