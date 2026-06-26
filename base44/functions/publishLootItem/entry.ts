import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const roundPrice = (value) => Math.round((Number(value) || 0) / 100) * 100;

function categoryForLoot(itemType) {
  if (itemType === 'bulk_cargo') return 'salvage_commodity';
  if (['fps_gear', 'weapon', 'ship_component', 'vehicle_component'].includes(itemType)) return itemType;
  return 'ship_component';
}

function descriptionForLoot(item) {
  const parts = [];
  if (item.manufacturer) parts.push(`${item.manufacturer} recovered component.`);
  if (item.condition_pct != null) parts.push(`Inspected at ${item.condition_pct}% condition.`);
  if (item.source_op || item.source_location) parts.push(`Recovered from ${[item.source_op, item.source_location].filter(Boolean).join(' — ')}.`);
  if (item.notes) parts.push(item.notes);
  return parts.join(' ');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json();
    const lootItemId = payload.loot_item_id;
    if (!lootItemId) return Response.json({ error: 'loot_item_id is required' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const item = await svc.loot_item.get(lootItemId);
    if (!item) return Response.json({ error: 'Loot item not found' }, { status: 404 });
    if (item.status === 'sold' || item.status === 'scrapped') {
      return Response.json({ error: 'Sold or scrapped loot cannot be listed' }, { status: 400 });
    }

    const price = roundPrice(payload.price_auec ?? item.est_sell_auec);
    if (price <= 0) return Response.json({ error: 'Set a sale estimate before listing this item' }, { status: 400 });

    const quantity = Math.max(1, Number(payload.quantity ?? item.quantity ?? 1));
    const productData = {
      product_name: payload.product_name || item.item_name,
      code: payload.code || item.size_class || undefined,
      category: categoryForLoot(item.item_type),
      item_type: item.item_type,
      condition_grade: item.condition_grade,
      condition_pct: item.condition_pct,
      size_class: item.size_class || 'N/A',
      manufacturer: item.manufacturer,
      compatible_ships: item.compatible_ships || [],
      description: payload.description || descriptionForLoot(item),
      price_auec: price,
      unit: item.item_type === 'bulk_cargo' ? 'SCU' : 'each',
      stock: quantity,
      available: true,
      loot_item_id: item.id,
      sort_order: payload.sort_order ?? 50,
    };

    let product;
    if (item.linked_product_id) {
      product = await svc.product.update(item.linked_product_id, productData);
    } else {
      product = await svc.product.create(productData);
    }

    await svc.loot_item.update(item.id, {
      status: 'listed',
      linked_product_id: product.id,
      est_sell_auec: price,
      condition_grade: item.condition_grade,
    });

    await svc.ops_log.create({
      action: item.linked_product_id ? 'loot_listing.updated' : 'loot_listing.created',
      entity_type: 'loot_item',
      entity_id: item.id,
      entity_name: item.item_name,
      actor: user.full_name || user.email || 'FSIS.operator',
      after: { product_id: product.id, price_auec: price, stock: quantity },
      notes: `Loot item published to storefront as ${product.product_name}`,
    });

    return Response.json({ success: true, product, loot_item_id: item.id });
  } catch (error) {
    console.error('publishLootItem error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});