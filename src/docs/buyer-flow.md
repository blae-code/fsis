# FSIS Buyer Flow & Edge Cases

This document describes the public buyer experience and the edge cases that must be communicated clearly.

## Core Flow

1. **Build Manifest** — Buyer browses catalog and adds wares/services.
2. **Transmit Order** — Buyer holds the transmit button and receives a tracking code + handoff passphrase.
3. **Track Order** — Buyer uses My Orders or enters a tracking code/passphrase.
4. **Schedule Handoff** — Once confirmed/in fulfillment, buyer proposes a time, location, and comms channel.
5. **In-Person Handoff** — Buyer meets FSIS in game, speaks passphrase, pays in aUEC trade window, and receives goods.

## Payment Safety Policy

- FSIS does not require advance payment.
- Pay only through the in-game trade window at handoff.
- Do not send aUEC outside the trade window.
- Verify the handoff passphrase before completing the trade.
- If anything feels wrong, stop and message FSIS through the order card.

## Tracking Code & Passphrase

| Credential | Purpose | Buyer guidance |
|---|---|---|
| Tracking code | Finds the order later | Save it like a receipt |
| Passphrase | Verifies identity at handoff | Keep private until meeting FSIS |

Anyone with the tracking code or passphrase may be able to access public tracking details, so buyers should treat both as private order credentials.

## Stock & Availability

Current behavior:

- Stock is checked when an order is placed.
- Stock is decremented when an order is delivered.
- Stock is not hard-reserved between placement and delivery.

Buyer-facing language:

> Availability is reviewed and confirmed by FSIS before fulfillment. If stock changes before confirmation, FSIS will contact you with an alternative, delay, partial fill, or cancellation option.

## Cancellation Policy

| Order status | Buyer action |
|---|---|
| New | Buyer can cancel/request cancellation directly |
| Confirmed | Buyer should message FSIS; cancellation handled case-by-case |
| In fulfillment | Buyer should message FSIS immediately |
| Delivered | Final |
| Cancelled | Final |

## Missed Handoff Policy

Recommended wording:

> If you miss a confirmed handoff, use the order message thread to request a new slot. FSIS may reschedule based on route availability and current risk conditions.

## Lost Code or Passphrase

Recommended support policy:

- If buyer has the same browser/device, My Orders may still show recent tracking codes.
- If buyer is logged in, account-linked orders may appear automatically.
- If both are lost, proprietor can search by handle manually, but should avoid revealing passphrases without reasonable identity confirmation.

## Bulk Quote Caveat

Bulk Quote is an estimate. Volume discounts, backorders, high-risk destinations, and route timing are confirmed by FSIS before fulfillment.

## Service Area

| Location | Region | ETA | Notes |
|---|---|---|---|
| Port Tressler | microTech | 2–6h | FSIS home port; fastest turnaround |
| New Babbage | microTech | 4–8h | Ground delivery |
| Everus Harbor | Hurston | 6–12h | Orbital delivery |
| Lorville | Hurston | 8–14h | Ground delivery |
| Baijini Point | ArcCorp | 6–12h | Orbital delivery |
| Area18 | ArcCorp | 8–14h | Ground delivery |
| Seraphim Station | Crusader | 6–12h | Orbital delivery |
| Orison | Crusader | 8–16h | Ground delivery |
| GrimHEX | Yela | 10–18h | Escort surcharge may apply |

## Restock Alerts

- Buyer leaves an in-game handle and optional contact method.
- If contact is an email, FSIS can send an automated restock email when the proprietor marks the request notified.
- If contact is Discord/Spectrum/in-game handle, FSIS must follow up manually.