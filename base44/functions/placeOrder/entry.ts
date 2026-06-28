import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public guest checkout: validates the cart against the live catalog server-side,
// recomputes pricing, reserves physical stock, issues a tracking code, and creates
// the order via service role so buyers don't need an account.

const roundPrice = (value) => Math.round((Number(value) || 0) / 100) * 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { customer_handle, items, delivery_location, customer_notes, discount_code, profile_key } = await req.json();

    if (!customer_handle?.trim() || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Handle and at least one item are required' }, { status: 400 });
    }
    if (!delivery_location?.trim()) {
      return Response.json({ error: 'Delivery location is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const products = await svc.product.filter({ available: true });
    const profileKey = String(profile_key || '').trim();
    const matchedProfiles = profileKey.length >= 24 ? await svc.fsis_profile.filter({ profile_key: profileKey, status: 'active' }) : [];
    const customerProfile = matchedProfiles[0] || null;

    const lines = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return Response.json({ error: `${item.product_name || 'An item'} is no longer available` }, { status: 400 });
      }
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (product.category !== 'service' && (product.stock || 0) < quantity) {
        return Response.json({ error: `${product.product_name}: only ${product.stock || 0} ${product.unit || 'SCU'} in stock` }, { status: 400 });
      }
      lines.push({
        product_id: product.id,
        product_name: product.product_name,
        code: product.code,
        quantity,
        unit: product.unit || 'SCU',
        unit_price: roundPrice(product.price_auec),
      });
    }

    const subtotal = lines.reduce((t, l) => t + l.unit_price * l.quantity, 0);

    // Server-side discount code validation — codes live in an admin-only entity
    let applied = null;
    if (discount_code && String(discount_code).trim()) {
      const codeStr = String(discount_code).trim().toUpperCase();
      const codes = await svc.discount_code.filter({ code: codeStr, active: true });
      if (codes.length === 0) {
        return Response.json({ error: 'Invalid or inactive discount code' }, { status: 400 });
      }
      applied = codes[0];
    }
    const discount_auec = applied ? roundPrice((subtotal * applied.discount_percent) / 100) : 0;
    const total = roundPrice(subtotal - discount_auec);

    const tracking_code = 'FSIS-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    // Unique handoff passphrase — spoken in person to verify buyer identity at delivery
    const WORDS_A = ['IRON', 'HALO', 'BRONZE', 'SCRAP', 'CLAW', 'RELAY', 'DRIFT', 'HULL', 'EMBER', 'CARGO', 'SALVO', 'BEACON'];
    const WORDS_B = ['VULTURE', 'RAILEN', 'TRESSLER', 'STANTON', 'RECLAIM', 'NOMAD', 'CITADEL', 'ORBIT', 'FREIGHT', 'LATTICE', 'GANTRY', 'KEEL'];
    const rnd = crypto.getRandomValues(new Uint32Array(3));
    const handoff_passphrase = `${WORDS_A[rnd[0] % WORDS_A.length]}-${WORDS_B[rnd[1] % WORDS_B.length]}-${10 + (rnd[2] % 90)}`;

    const reservedProducts = [];
    try {
      for (const item of lines) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product || product.category === 'service') continue;
        const nextStock = Math.max(0, (product.stock || 0) - item.quantity);
        await svc.product.update(product.id, { stock: nextStock });
        reservedProducts.push({ id: product.id, name: product.product_name, quantity: item.quantity });
      }
    } catch (error) {
      for (const reserved of reservedProducts) {
        const current = await svc.product.get(reserved.id).catch(() => null);
        if (current) await svc.product.update(reserved.id, { stock: (current.stock || 0) + reserved.quantity }).catch(() => {});
      }
      return Response.json({ error: `Unable to reserve stock: ${error.message}` }, { status: 500 });
    }

    let order;
    try {
      order = await svc.order.create({
      customer_handle: customer_handle.trim(),
      customer_profile_id: customerProfile?.id || '',
      customer_profile_handle: customerProfile?.handle || '',
      tracking_code,
      handoff_passphrase,
      items: lines,
      total_auec: total,
      discount_code: applied ? applied.code : '',
      discount_percent: applied ? applied.discount_percent : 0,
      discount_auec,
        delivery_location: delivery_location.trim(),
        customer_notes: customer_notes || '',
        internal_notes: reservedProducts.length ? `STOCK RESERVED ON CHECKOUT: ${reservedProducts.map((p) => `${p.name} ×${p.quantity}`).join(', ')}` : '',
        status: 'new',
      });
    } catch (error) {
      for (const reserved of reservedProducts) {
        const current = await svc.product.get(reserved.id).catch(() => null);
        if (current) await svc.product.update(reserved.id, { stock: (current.stock || 0) + reserved.quantity }).catch(() => {});
      }
      throw error;
    }

    const invoiceNumber = `FSIS-INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${tracking_code.replace('FSIS-', '')}`;
    const invoice = await svc.invoice.create({
      invoice_number: invoiceNumber,
      transaction_type: 'order',
      status: 'issued',
      order_id: order.id,
      order_tracking_code: tracking_code,
      issued_at: new Date().toISOString(),
      currency: 'aUEC',
      seller: {
        name: 'Fairshare Industrial Solutions',
        handle: 'FSIS',
        license: 'FSIS-IND-2956',
        hq: 'Stanton System',
      },
      buyer: {
        handle: customer_handle.trim(),
        profile_id: customerProfile?.id || '',
        profile_handle: customerProfile?.handle || '',
        delivery_location: delivery_location.trim(),
        contact: customerProfile?.contact_handle || '',
      },
      line_items: lines.map((line) => ({ ...line, line_total: line.unit_price * line.quantity })),
      subtotal_auec: subtotal,
      discount_code: applied ? applied.code : '',
      discount_percent: applied ? applied.discount_percent : 0,
      discount_auec,
      total_auec: total,
      payment_terms: 'Payment due in aUEC in the in-game trade window after handoff verification.',
      handoff_passphrase,
      notes: customer_notes || '',
    });

    await svc.order.update(order.id, { invoice_id: invoice.id, invoice_number: invoiceNumber });

    if (applied) {
      await svc.discount_code.update(applied.id, { uses: (applied.uses || 0) + 1 });
    }

    return Response.json({
      ok: true,
      tracking_code,
      order_id: order.id,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      customer_profile_id: customerProfile?.id || '',
      total_auec: total,
      subtotal_auec: subtotal,
      discount_auec,
      discount_percent: applied ? applied.discount_percent : 0,
      handoff_passphrase,
      stock_reserved: reservedProducts.length > 0,
    });
  } catch (error) {
    console.error('placeOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});