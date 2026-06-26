# FSIS QA Checklist

Run these checks before major releases or after changes to orders, automations, integrations, or access control.

## Buyer Flow QA

- [ ] Storefront loads without login.
- [ ] Catalog products render.
- [ ] Search filters catalog.
- [ ] Category/sort filters work.
- [ ] Product detail opens.
- [ ] In-stock item can be added to manifest.
- [ ] Quantity cannot exceed stock.
- [ ] Out-of-stock item opens restock request flow.
- [ ] Restock request appears in admin inbox.
- [ ] Checkout requires in-game handle.
- [ ] Order transmit returns tracking code and passphrase.
- [ ] Order appears in My Orders on same device.
- [ ] Manual lookup works by tracking code.
- [ ] Manual lookup works by passphrase.
- [ ] Invoice downloads.
- [ ] Buyer message sends.
- [ ] Cancellation works while order is `new`.
- [ ] Handoff scheduling appears for `confirmed`/`in_fulfillment` orders.
- [ ] Confirmed handoff fields display to buyer.

## Admin Flow QA

- [ ] Unauthenticated user cannot use `/ops`.
- [ ] Admin can open management console.
- [ ] Product stock can be updated.
- [ ] Product availability can be toggled.
- [ ] Admin can confirm order.
- [ ] Admin can set order to in fulfillment.
- [ ] Admin can confirm/counter handoff.
- [ ] Admin can mark order delivered.
- [ ] Delivered order decrements stock.
- [ ] Delivered order creates ledger entry.
- [ ] Ops log records critical actions.
- [ ] Restock inbox shows pending requests.
- [ ] Marking restock notified sends email or logs manual follow-up.

## Automation QA

- [ ] `processNewOrder` runs on order creation.
- [ ] `onOrderDelivered` runs on delivered status.
- [ ] `notifyRestock` runs when `restock_notify.notified = true`.
- [ ] `syncUex` updates commodity prices.
- [ ] `repriceProducts` updates product market reference fields.
- [ ] `checkPriceAlerts` does not duplicate alerts.
- [ ] `checkStockAlerts` does not duplicate alerts.
- [ ] `syncLedgerToSheets` writes expected rows.
- [ ] No duplicate active automations exist for the same trigger/function.

## Integration QA

- [ ] Google Sheets connector is authorized.
- [ ] Ledger sheet ID/config is present.
- [ ] UEX market data is fresh.
- [ ] Email sends successfully for an email contact.
- [ ] Non-email restock contacts create manual follow-up log.
- [ ] LLM/OCR functions return usable output on sample screenshots.

## Access QA

- [ ] Guest can browse storefront.
- [ ] Guest can place order.
- [ ] Guest can track by code/passphrase.
- [ ] Guest cannot access management data.
- [ ] Non-admin cannot mutate admin-only entities.
- [ ] Admin can perform all management actions.

## Regression Notes

After every QA run, record:

- Date/time
- Tester
- App version/change summary
- Failed checks
- Fix owner
- Retest result