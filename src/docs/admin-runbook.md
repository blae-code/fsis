# FSIS Admin Operations Runbook

This is the proprietor-facing procedure guide for daily operation.

## Daily Start Checklist

1. Open storefront and confirm catalog loads.
2. Open management console.
3. Check order queue.
4. Check restock inbox and cancellation requests.
5. Confirm UEX market data freshness.
6. Review low-stock alerts.
7. Confirm ledger/ops log has no unresolved errors.

## Order Status Runbook

| Transition | Who performs it | Side effects | Notes |
|---|---|---|---|
| `new → confirmed` | Proprietor or standard-route automation | Buyer can schedule handoff | Confirm stock, price, and route risk first; GrimHEX/high-risk routes require proprietor review |
| `confirmed → in_fulfillment` | Proprietor | Buyer sees order is being arranged | Use when route/crew is committed |
| `in_fulfillment → delivered` | Proprietor | Stock decrements; ledger income created | Final fulfillment action |
| `new → cancelled` | Buyer/admin | Order voided | No stock decrement |
| `confirmed → cancelled` | Admin/manual | Case-by-case | Use messages to document reason |

## Handoff Procedure

1. Buyer proposes time/location/contact from My Orders.
2. Proprietor reviews request in Orders management.
3. Proprietor confirms or counters with final time/location/note.
4. Buyer sees confirmed slot on order card.
5. At meetup, buyer speaks passphrase.
6. Complete in-game aUEC trade window.
7. Mark order delivered only after trade is complete.

## Restock Inbox Procedure

1. Review pending restock requests.
2. When item is available, contact buyer.
3. If contact is email, marking `NOTIFIED` can trigger outbound email.
4. If contact is Discord/Spectrum/in-game handle, follow up manually.
5. Keep or delete request according to business preference.

## Stock Mismatch Procedure

If an order exceeds available stock before confirmation:

1. Do not confirm automatically.
2. Message buyer with available quantity and options.
3. Offer partial fill, delay/backorder, substitute ware, or cancellation.
4. Document the outcome in order messages/internal notes; buyer cancellation requests now also write an internal note and ops-log entry.

## GrimHEX / High-Risk Destination Procedure

1. Review current risk before confirming.
2. If surcharge applies, message buyer before fulfillment.
3. Do not add surprise cost at handoff.
4. Confirm route and escort needs before moving to `in_fulfillment`.

## Ledger Procedure

- Delivery should create income entries automatically.
- Work order settlement should create payout/expense entries.
- Screenshots can be OCR-analyzed, but the proprietor should verify extracted totals.
- Weekly Sheets sync should be checked after each run.

## End-of-Day Checklist

1. Delivered orders reconciled against stock.
2. Ledger entries reviewed.
3. Restock requests processed or left pending intentionally.
4. UEX data freshness checked.
5. Any failed automations noted for next session.