import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TAG = 'QA TEST — ';
const nowDate = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    let payload = {}; try { payload = await req.json(); } catch { payload = {}; }
    const svc = base44.asServiceRole.entities;
    const existingProducts = await svc.product.list('-created_date', 500);
    const alreadySeeded = existingProducts.some((p) => String(p.product_name || '').startsWith(TAG));
    const summary = { products: 4, orders: 3, loot: 5, ledger: 2, discounts: 1, restocks: 1 };
    if (payload.dry_run || alreadySeeded) return Response.json({ status: 'success', dry_run: Boolean(payload.dry_run), already_seeded: alreadySeeded, summary });

    const products = await svc.product.bulkCreate([
      { product_name: `${TAG}RMC high stock`, code: 'RMC', category: 'salvage_commodity', description: 'QA high-stock storefront item.', price_auec: 12000, unit: 'SCU', stock: 40, available: true, sort_order: 9001 },
      { product_name: `${TAG}CMR low stock`, code: 'CMR', category: 'salvage_commodity', description: 'QA low-stock alert item.', price_auec: 8600, unit: 'SCU', stock: 1, available: true, sort_order: 9002 },
      { product_name: `${TAG}Out of stock gear`, code: 'QA-GEAR', category: 'fps_gear', item_type: 'armor', condition_grade: 'used', condition_pct: 72, description: 'QA unavailable buyer-state item.', price_auec: 4300, unit: 'each', stock: 0, available: true, sort_order: 9003 },
      { product_name: `${TAG}Make offer component`, code: 'QA-OFFER', category: 'ship_component', item_type: 'shield', size_class: 'S2', condition_grade: 'refurb', condition_pct: 88, description: 'QA offer-only product.', price_auec: 25500, unit: 'each', stock: 1, available: true, make_offer_only: true, sort_order: 9004 },
    ]);

    const orders = await svc.order.bulkCreate([
      { customer_handle: `${TAG}Buyer_New`, tracking_code: 'QA-FSIS-NEW', handoff_passphrase: 'QA-IRON-01', items: [{ product_id: products?.[0]?.id || '', product_name: `${TAG}RMC high stock`, code: 'RMC', quantity: 2, unit: 'SCU', unit_price: 12000 }], total_auec: 24000, delivery_location: 'Port Tressler', status: 'new', customer_notes: 'QA buyer order.' },
      { customer_handle: `${TAG}Buyer_Handoff`, tracking_code: 'QA-FSIS-HANDOFF', handoff_passphrase: 'QA-VULTURE-02', items: [{ product_id: products?.[1]?.id || '', product_name: `${TAG}CMR low stock`, code: 'CMR', quantity: 1, unit: 'SCU', unit_price: 8600 }], total_auec: 8600, delivery_location: 'Everus Harbor', status: 'confirmed', handoff_status: 'requested', handoff_proposed_time: 'Friday 2100 PT', handoff_location: 'Everus Harbor ASOP' },
      { customer_handle: `${TAG}Buyer_Delivered`, tracking_code: 'QA-FSIS-DONE', handoff_passphrase: 'QA-SEAL-03', items: [{ product_id: products?.[2]?.id || '', product_name: `${TAG}Out of stock gear`, code: 'QA-GEAR', quantity: 1, unit: 'each', unit_price: 4300 }], total_auec: 4300, delivery_location: 'Area18', status: 'delivered', handoff_status: 'completed' },
    ]);

    const handoffOrder = (orders || []).find((o) => o.tracking_code === 'QA-FSIS-HANDOFF');
    if (handoffOrder) {
      const invoice = await svc.invoice.create({
        invoice_number: 'QA-FSIS-INV-HANDOFF',
        transaction_type: 'order',
        status: 'issued',
        order_id: handoffOrder.id,
        order_tracking_code: 'QA-FSIS-HANDOFF',
        issued_at: new Date().toISOString(),
        seller: { name: 'FSIS', handle: 'FSIS' },
        buyer: { handle: `${TAG}Buyer_Handoff`, delivery_location: 'Everus Harbor' },
        line_items: [{ product_name: `${TAG}CMR low stock`, code: 'CMR', quantity: 1, unit: 'SCU', unit_price: 8600, line_total: 8600 }],
        subtotal_auec: 8600,
        total_auec: 8600,
        handoff_passphrase: 'QA-VULTURE-02',
        notes: `${TAG}QA invoice for handoff order`,
      });
      await svc.order.update(handoffOrder.id, { invoice_id: invoice.id, invoice_number: invoice.invoice_number });
    }

    await svc.loot_item.bulkCreate([
      { item_name: `${TAG}Raw Shield Generator`, item_type: 'ship_component', condition_pct: 41, condition_grade: 'worn', size_class: 'S2', quantity: 1, status: 'raw', est_sell_auec: 9000, source_op: 'QA intake run' },
      { item_name: `${TAG}Repairing Rifle`, item_type: 'weapon', condition_pct: 55, condition_grade: 'used', size_class: 'N/A', quantity: 1, status: 'repairing', est_sell_auec: 3200, source_op: 'QA intake run' },
      { item_name: `${TAG}Repaired Armor Core`, item_type: 'fps_gear', condition_pct: 91, condition_grade: 'refurb', size_class: 'M', quantity: 1, status: 'repaired', est_sell_auec: 6800, source_op: 'QA intake run' },
      { item_name: `${TAG}Listed Power Plant`, item_type: 'ship_component', condition_pct: 84, condition_grade: 'used', size_class: 'S1', quantity: 1, status: 'listed', est_sell_auec: 11400, linked_product_id: products?.[3]?.id || '', source_op: 'QA intake run' },
      { item_name: `${TAG}Sold Helmet`, item_type: 'fps_gear', condition_pct: 76, condition_grade: 'used', size_class: 'M', quantity: 1, status: 'sold', actual_sell_auec: 2500, source_op: 'QA intake run' },
    ]);

    await svc.ledger_entry.bulkCreate([
      { entry_type: 'income', category: 'order_fulfillment', amount_auec: 24000, description: `${TAG}QA order income`, counterparty: 'QA Buyer', entry_date: nowDate(), source: 'manual' },
      { entry_type: 'expense', category: 'repairs', amount_auec: 3500, description: `${TAG}QA repair expense`, counterparty: 'Repair terminal', entry_date: nowDate(), source: 'manual' },
    ]);
    await svc.discount_code.create({ code: 'QA-LAUNCH-10', label: `${TAG}launch discount`, discount_percent: 10, active: true, uses: 0 });
    await svc.restock_notify.create({ product_id: products?.[2]?.id || '', product_name: `${TAG}Out of stock gear`, handle: `${TAG}Buyer_Waiting`, contact: 'Spectrum DM', notified: false });
    return Response.json({ status: 'success', summary });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});