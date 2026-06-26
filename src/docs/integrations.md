# FSIS Integrations & Environment Setup

This guide covers external dependencies required for production operation.

## Integration Inventory

| Integration | Used by | Required setup | Failure symptom |
|---|---|---|---|
| Google Sheets | `syncLedgerToSheets`, weekly reports | Authorized Google Sheets connector and ledger sheet setting | Ledger exports fail or no rows appear |
| UEX market feed | `syncUex`, `repriceProducts`, market ticker, price alerts, haul routing | Public UEX API endpoints for commodity prices, terminals, and salvage routes | Stale/empty market prices or route suggestions |
| Base44 email | `notifyRestock`, stock alerts, price alerts, reports | Built-in email integration | Buyers/operators do not receive notifications |
| Base44 LLM | `dailyBriefing`, `salvageAdvisor`, OCR analysis | Built-in LLM integration/credits | AI summaries or OCR fail |
| File upload/private files | Ledger and salvage image analysis | Built-in file handling | OCR cannot process screenshots |

## First-Run Setup Checklist

1. Confirm admin/proprietor account exists and has role `admin`.
2. Authorize Google Sheets connector.
3. Create or select the ledger spreadsheet.
4. Store the ledger sheet ID in app settings.
5. Run `syncUex` manually and verify commodity prices, terminals, and salvage routes update.
6. Confirm RMC/CMR/CMS price snapshots were captured for storefront repricing.
7. Run `repriceProducts` manually on a test product set.
8. Place a test order from the storefront.
9. Track the order by code/passphrase.
10. Confirm and deliver the order from management.
11. Verify stock decrement and ledger entry creation.
12. Submit a restock request and mark it notified.
13. Verify buyer email or manual follow-up ops log.
14. Run Google Sheets ledger sync and confirm output.

## Google Sheets Notes

- Authorized connector scope should include spreadsheet access.
- The app should document which spreadsheet/tab is canonical.
- Reauthorization may be required if exports begin failing.
- Do not create duplicate weekly sync automations.

## UEX Notes

`syncUex` now caches all UEX commodity terminal prices, terminal metadata, and top FSIS-relevant salvage routes. FSIS normalizes UEX `Construction Materials` and `Scrap` into the storefront-facing `CMR` and `CMS` codes so repricing, alerts, and haul planning use the same language as the store. Ship components, FPS gear, and weapons still do not receive automatic UEX-backed market references unless item-price sync is added.

## Email Behavior

- Email is automatic only when a usable email address is present.
- Discord, Spectrum, and in-game handles require manual follow-up.
- Manual follow-up should be captured in `ops_log` or buyer order messages.

## Integration Recovery

| Problem | Action |
|---|---|
| Sheets sync failing | Reauthorize Google Sheets, verify sheet ID, rerun sync |
| UEX stale | Run sync manually, check secret/config, inspect latest cache timestamp |
| Email not sent | Check whether contact was an email; if not, use manual channel |
| LLM/OCR failure | Retry with smaller/clearer image; confirm credits/integration health |