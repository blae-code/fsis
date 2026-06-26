# FSIS Troubleshooting Guide

| Symptom | Likely cause | What to check | Recovery |
|---|---|---|---|
| Buyer cannot find order | Wrong code/passphrase, local cache cleared | Search by handle/admin orders | Re-share tracking code only after reasonable identity check |
| Buyer cannot schedule handoff | Order not confirmed/in fulfillment, tracking mismatch, function failure | Order status and tracking code | Confirm order or update handoff manually |
| Product shows stale market price | UEX sync stale | Latest commodity cache timestamp | Run UEX sync and inspect errors |
| Order delivered but stock unchanged | Delivery automation failed | Order status, product stock, function logs | Correct stock manually and investigate automation |
| Ledger missing delivery income | Delivery automation failed | Ledger entries for order | Create entry manually and investigate function |
| Restock email did not send | Contact is not email or email failed | Restock contact, ops log | Follow up manually |
| Sheets sync failed | Connector disconnected or setting missing | Google Sheets authorization, sheet ID | Reauthorize/configure and rerun sync |
| Duplicate reports/ledger rows | Duplicate automation active | Automation list | Archive duplicate and reconcile rows |
| OCR result wrong | Screenshot unclear or unsupported layout | Uploaded image quality | Correct extracted data manually |
| Buyer reports impersonation | Passphrase leaked or wrong meetup | Order messages, passphrase | Stop handoff, verify buyer, reschedule safely |