# FSIS Automation Registry

This registry is the operational source of truth for scheduled, entity-triggered, and connector-backed automations.

## Active Automation Inventory

| Automation | Type | Trigger | Function | Expected side effects | Notes |
|---|---|---|---|---|---|
| Process New Order | Entity | `order` create | `processNewOrder` | Reviews stock/pricing/route risk, auto-confirms only clean standard-route orders, writes ops context | Keep one active copy only |
| Order Delivered | Entity | `order` update to `delivered` | `onOrderDelivered` | Decrements stock, creates ledger income, writes ops log | Delivery is the stock-decrement event |
| Restock Notify — Buyer Outbound | Entity | `restock_notify` update where `notified = true` | `notifyRestock` | Emails buyer if contact is an email; logs manual follow-up otherwise | Canonical restock notification path |
| Work Order Settled | Entity | `work_order` update to `settled` | `onWorkOrderSettled` | Creates crew payout/ledger records | Archived duplicates should remain archived |
| Apply Salvage Scan | Entity | `salvage_scan` create | `applyScanToInventory` | Converts scan results into inventory/cargo records | Validate OCR results before relying on totals |
| Stock Alerts | Entity | `product` update | `checkStockAlerts` | Notifies operator when armed thresholds are crossed | Avoid duplicate alerts through alert state |
| UEX Sync | Scheduled | Every 15 minutes | `syncUex` | Refreshes commodity cache and price snapshots | Depends on UEX configuration |
| Reprice Products | Scheduled | Daily | `repriceProducts` | Updates market reference/margin-backed product pricing | Review after major market shifts |
| Price Alerts | Scheduled | Every 15 minutes | `checkPriceAlerts` | Compares UEX cache against armed alerts | Depends on fresh UEX cache |
| Daily Briefing | Scheduled | Daily 07:00 America/Vancouver | `dailyBriefing` | Generates ops summary | Uses LLM credits |
| Weekly Ledger Report | Scheduled | Weekly Monday | `weeklyLedgerReport` | Exports weekly P&L/reporting | Depends on Google Sheets connector/config |
| Ledger Sync to Sheets | Scheduled | Weekly Monday or manual | `syncLedgerToSheets` | Pushes ledger data to Google Sheets | Requires authorized Sheets connector |
| Open Pay Day Cycle | Scheduled | Fridays | `openPaydayCycle` | Opens 72h crew payout decision window | Contractor features currently sequestered |
| Close Pay Day Cycle | Scheduled | Hourly | `closePaydayCycle` | Closes expired cycles, settles elections, banks deferred shares | Contractor features currently sequestered |

## Archived / Duplicate Automation Policy

- Keep duplicate automations archived, not deleted, until production has run cleanly for at least one cycle.
- Never create a second automation for the same trigger/function pair without documenting why.
- When archiving duplicates, record the automation name, ID, and reason in the ops log or project notes.

## Health Checks

Run these after any automation change:

1. Create a test order and confirm `processNewOrder` behavior.
2. Mark an order delivered and verify stock + ledger side effects.
3. Create a restock request, mark it notified, and verify email/log behavior.
4. Run UEX sync and confirm ticker/market cache freshness.
5. Run ledger sync and confirm Google Sheets output.

## Failure Handling

| Symptom | Likely cause | Recovery |
|---|---|---|
| Duplicate ledger rows | Duplicate automation active | Archive duplicate; reconcile ledger manually |
| Buyer not emailed on restock | Contact is not an email or email integration failed | Check ops log; contact manually via Discord/Spectrum |
| Market ticker stale | UEX sync failing or secret missing | Run sync manually; verify UEX configuration |
| Stock not changed after delivery | Delivery automation failed | Check order status and rerun/fix `onOrderDelivered` effect manually |
| Sheets not updated | Connector disconnected or sheet setting missing | Reauthorize Sheets and verify sheet ID setting |