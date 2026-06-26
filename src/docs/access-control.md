# FSIS Access Control Matrix

This document defines who can access each FSIS surface and where that access is enforced.

## Roles

| Role | Meaning |
|---|---|
| Guest | Not logged in; public buyer browsing or tracking with a code/passphrase |
| User | Logged in account without business privileges |
| Contractor | Future operator role; currently sequestered unless explicitly re-enabled |
| Admin / Proprietor | `blae` / authorized owner role with management authority |

## Surface Access

| Surface / Action | Guest | User | Contractor | Admin | Enforcement layer |
|---|---:|---:|---:|---:|---|
| Browse storefront | Yes | Yes | Yes | Yes | Public UI |
| Add catalog wares to manifest | Yes | Yes | Yes | Yes | Public UI |
| Place order | Yes | Yes | Yes | Yes | `placeOrder` backend function |
| Track order by tracking code/passphrase | Yes | Yes | Yes | Yes | `trackOrder` backend function |
| Send buyer order message | Yes | Yes | Yes | Yes | Public message flow + admin inbox |
| Request cancellation while order is new | Yes | Yes | Yes | Yes | `cancelOrder` backend function |
| Propose handoff slot | Yes | Yes | Yes | Yes | `updateHandoff` backend function |
| Restock alert request | Yes | Yes | Yes | Yes | `restock_notify` create permission |
| `/ops` desktop shell | No if unauthenticated | Logged-in shell access may load | Future policy | Yes | Route/auth shell + module/entity guards |
| Management module | No | No | No by default | Yes | Management UI + entity RLS |
| Product management | No | No | No | Yes | Entity RLS: `product` admin writes |
| Order management | No | No | No | Yes | Entity RLS + admin UI |
| Ledger | No | No | No | Yes | Entity RLS + backend auth |
| Ops audit log | No | No | No | Yes | Entity RLS |
| Google Sheets sync | No | No | No | Yes/automation | Connector + function auth |
| UEX sync/repricing | No | No | No | Yes/automation | Scheduled functions/admin paths |

## Security Notes

- Public buyer flows intentionally avoid account requirements.
- A tracking code or passphrase acts like a bearer receipt: anyone with it can view that order’s public tracking details.
- Admin actions must not rely on UI hiding alone; entity permissions and backend function auth are the source of truth.
- Service-role backend functions are acceptable for guest-safe actions only when the tracking code/passphrase proves order ownership.

## Future Contractor Policy

Contractor features are currently archived/sequestered. Before re-enabling contractors, define:

1. Which desktop apps contractors can open.
2. Whether contractors can view orders, only assigned orders, or no buyer data.
3. Whether contractors can create time logs/payday elections.
4. Whether contractor access is enforced by entity RLS, backend functions, or both.