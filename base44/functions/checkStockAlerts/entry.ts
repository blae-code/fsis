import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entity automation handler: fires when a product's stock is updated.
// Triggers armed stock alerts whose threshold the new stock level falls below.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const entityId = payload?.event?.entity_id;
    let product = payload?.data;
    if (!product && entityId) {
      product = await base44.asServiceRole.entities.product.get(entityId);
    }
    if (!product) {
      return Response.json({ status: 'skipped', reason: 'no product data' });
    }

    const stock = product.stock ?? 0;

    const alerts = await base44.asServiceRole.entities.stock_alert.filter({
      product_id: entityId,
      status: 'armed',
    });

    const triggered = [];
    for (const alert of alerts) {
      if (stock >= alert.threshold_qty) continue;

      await base44.asServiceRole.entities.stock_alert.update(alert.id, {
        status: 'triggered',
        triggered_stock: stock,
        triggered_at: new Date().toISOString(),
      });

      if (alert.notify_email && alert.created_by) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'FSIS Stock Watch',
          to: alert.created_by,
          subject: `LOW STOCK — ${alert.code || product.product_name} below ${alert.threshold_qty} ${product.unit || 'SCU'}`,
          body: [
            `FSIS stock alert triggered.`,
            ``,
            `Ware: ${product.product_name}${alert.code ? ` (${alert.code})` : ''}`,
            `Current stock: ${stock} ${product.unit || 'SCU'}`,
            `Threshold: below ${alert.threshold_qty} ${product.unit || 'SCU'}`,
            ``,
            `Consider adjusting mining/salvage priorities to replenish this commodity.`,
            ``,
            `— FSIS.bot Stock Watch`,
          ].join('\n'),
        });
      }

      triggered.push(alert.id);
    }

    return Response.json({ status: 'success', triggered: triggered.length });
  } catch (error) {
    console.error('checkStockAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});