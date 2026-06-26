import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entity automation handler: fires when a restock_notify record is updated.
// When the proprietor marks notified=true, send an outbound message to the buyer
// using their stored contact info, and log the notification.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data: record, old_data } = payload;

    // Only act when notified flips from false → true
    if (!record?.notified || old_data?.notified === true) {
      return Response.json({ skipped: true, reason: 'Not a notify transition' });
    }

    const handle   = record.handle || 'Buyer';
    const product  = record.product_name || 'the item you requested';
    const contact  = record.contact || '';

    // If we have an email contact, send directly
    const emailMatch = contact.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'FSIS Supply Desk',
        to: emailMatch[0],
        subject: `[FSIS] ${product} is back in stock`,
        body: [
          `Hey ${handle},`,
          ``,
          `Good news — ${product} is back in stock at the FSIS store.`,
          ``,
          `Head to the storefront to place your order:`,
          `https://app.base44.com/`,
          ``,
          `If you have any questions, reply to this message or reach out via your usual channel.`,
          ``,
          `— FairShare Industrial Solutions`,
          `"Every credit accounted for."`,
        ].join('\n'),
      });
    }

    // Log the notification action regardless of email availability
    await base44.asServiceRole.entities.ops_log.create({
      action: 'restock.notified',
      entity_type: 'restock_notify',
      entity_id: event.entity_id,
      entity_name: product,
      actor: 'FSIS.bot',
      notes: `Notified ${handle} via ${contact || 'no contact on file'} that ${product} is back in stock.`,
    }).catch(() => {});

    console.log(`Restock notification sent for ${product} to ${handle} (${contact || 'no contact'})`);
    return Response.json({ ok: true, emailed: !!emailMatch });
  } catch (error) {
    console.error('notifyRestock error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});