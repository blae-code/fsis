# Storefront Live Deployment Readiness

Use this checklist before publishing the public FSIS Storefront.

## Minimum Go-Live Gate

The Storefront is live-ready only when all of these pass:

1. Guest can browse catalog without logging in.
2. Guest can search/filter products.
3. Guest can add in-stock wares to the manifest.
4. Quantity controls cannot exceed available stock.
5. Checkout requires in-game handle and delivery location.
6. Order transmit returns tracking code and handoff passphrase.
7. Receipt tells buyer to save codes and pay only in the in-game trade window.
8. Buyer can track order by tracking code.
9. Buyer can track order by passphrase.
10. Buyer can download invoice.
11. Buyer can send order message.
12. Buyer can cancel/request cancellation while order is `new`.
13. Confirmed/in-fulfillment order exposes handoff scheduling.
14. Buyer can propose handoff time/location/contact.
15. Buyer can see confirmed proprietor time/location/note.
16. Restock request lands in proprietor inbox.
17. Restock copy explains email automation vs manual Discord/Spectrum follow-up.
18. GrimHEX/high-risk destination copy warns that surcharge may apply and auto-confirmation does not bypass proprietor review.
19. Bulk Quote clearly says estimates are subject to stock, discount, backorder, and route confirmation.
20. Mobile checkout, product detail, My Orders, and handoff modals remain usable.

## Buyer-Facing Copy Requirements

Every live Storefront surface must consistently communicate:

- No account is required.
- Tracking code/passphrase are private receipt credentials.
- Keep passphrase private until handoff.
- Pay only in-game at handoff.
- FSIS does not require advance payment.
- Stock is reviewed before confirmation; it is not hard-reserved at transmit time.
- Bulk Quote is an estimate until confirmed by FSIS.
- Email restock contacts can receive automated mail; non-email contacts require manual follow-up.

## Critical Surfaces to Inspect

| Surface | Must show |
|---|---|
| Onboarding | No-account ordering and in-game handoff payment |
| Checkout manifest | Stock/route confirmation and safe-payment warning |
| Receipt modal | Tracking/passphrase privacy and safe-payment warning |
| My Orders | Tracking/passphrase privacy and handoff guidance |
| Handoff scheduler | Passphrase privacy and in-game trade payment reminder |
| Bulk Quote | Estimate-only language |
| Restock modal | Email automation vs manual contact language |
| FAQ | Stock reservation, safe payment, service area, restock, shortcuts |

## Final Manual QA

Run the buyer flow and admin handoff flow together:

1. Place a guest order.
2. Save tracking code/passphrase.
3. Track it from My Orders.
4. Confirm order as proprietor.
5. Schedule handoff as buyer.
6. Confirm/counter handoff as proprietor.
7. Verify buyer sees confirmed handoff.
8. Mark order delivered.
9. Verify stock decrement and ledger entry.
10. Submit restock request and confirm inbox visibility.