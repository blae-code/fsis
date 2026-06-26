# FSIS — FairShare Industrial Solutions
### Star Citizen Trade Terminal · Proprietor OS

> *"Every credit accounted for."*

A dual-interface web OS for solo-proprietor in-game commerce. Buyers get a polished storefront; the proprietor gets a full management console behind a discreet access point.

---

## Identity

| Field | Value |
|---|---|
| **Full name** | FairShare Industrial Solutions |
| **Abbreviation** | FSIS |
| **Founded** | 12 JUN 2956 SET (12 JUN 2026 IRL) — opening day of Alien Week |
| **HQ** | Port Tressler, microTech — Stanton System |
| **License** | UEE-CR 2956/SAL-77741 |
| **Divisions** | Salvage Ops · Fabrication · Logistics |
| **Org affiliation** | Redscar Nomads (preferential trade rate) |
| **Proprietor** | `blae` — founder, sole operator, engineer of record |
| **Fleet** | FSIS-01 *Fair Share* — Gatac Railen, ~640 SCU (Xi'an medium cargo) |

Lore and branding constants live in `lib/fsisLore.js` — single source of truth for name, motto, founded date, core values, design principles, and fleet registry.

---

## Architecture Overview

| Layer | Path | Notes |
|---|---|---|
| **Storefront** | `/` → `pages/Storefront` | Public-facing; no login required to browse or order |
| **Management Console / OS Desktop** | `/ops` → `pages/Desktop` | Admin/proprietor-only internal shell; unauthenticated users are redirected |
| **Loot Tracker** | `/loot` → `pages/LootTracker` | Internal salvage pipeline |
| **Auth** | `/login`, `/register`, `/forgot-password`, `/reset-password` | Platform-managed; proprietor logs in to unlock admin views |

---

## Storefront (`pages/Storefront`)

### Public buyer flow
1. **Build Manifest** — Browse catalog, add wares by quantity.
2. **Transmit Order** — Hold-to-transmit; buyer receives a **tracking code** and **passphrase**.
3. **Schedule Handoff** — Buyer proposes a meetup time + in-game location via the order card.
4. **In-Person Handoff** — Meet in-game, speak passphrase, complete aUEC trade window.

### Key features
- **No account required** — orders are identified by tracking code + passphrase only
- **Bulk Quote tab** — volume-discount calculator with per-location ETAs; loads directly into cart
- **My Orders tab** — track by code or passphrase; send messages; request cancellation; schedule handoff
- **Restock notifications** — buyers can subscribe to out-of-stock alerts by handle/contact
- **Market ticker** — live UEX commodity best-sell prices scrolling in the header band
- **Discount codes** — org/partner codes applied at checkout for a % reduction

### Keyboard shortcuts
| Key | Action |
|---|---|
| `1` | Catalog tab |
| `2` | Bulk Quote tab |
| `3` | My Orders tab |
| `4` | About tab |
| `/` | Focus storefront search bar |
| `F11` | Toggle fullscreen where supported |

Management desktop shortcuts:

| Key | Action |
|---|---|
| `Cmd/Ctrl+K` | Open management command palette |
| `F`→`S`→`I`→`S` | Admin-only command access inside the OS desktop |

### Local storage (`lib/localCache.js`)
Two independent caches backed by `localStorage`:

| Cache | Scope | Keys stored |
|---|---|---|
| `localCache` | Per-browser (OS desktop) | Boot flag (`fsis.booted`), window session per user |
| `storeCache` | Per-device (storefront) | Cart, tracking codes (up to 20), pins, onboarding flag, how-to dismissed flag, customer profile |

Session data is namespaced by user ID via `setCacheScope()` so multiple accounts on the same browser stay isolated. All reads/writes are non-fatal (quota errors silently swallowed).

### Proprietor access
The public storefront exposes management access only as a small dim `⚙` icon for admin users in the top-right header corner. The old visible "OPERATOR TERMINAL" button is archived. Inside the OS desktop, admin users can also use the hidden `F`→`S`→`I`→`S` command sequence to open the Management module.

---

## Management Console (`pages/Desktop`)

Reached at `/ops`. Unauthenticated users are redirected back to `/`, and non-admin users see a proprietor-clearance screen. Admin business modules remain additionally protected by role checks and entity permissions. The `F`–`S`–`I`–`S` key-chord is documented as an OS desktop command-access shortcut, not a public storefront shortcut.

### Tabs

| Tab | Component | Purpose |
|---|---|---|
| OVERVIEW | `ManagementView` | KPI tiles, 7-day revenue trend, urgent orders |
| STORE | `ProductManager` | Create/edit/delete products; adjust stock & visibility |
| DISCOUNTS | `DiscountManager` | Create and manage discount codes |
| ORDERS | `OrdersContent` + `HandoffCoordinator` | Manage order status; confirm/counter handoff proposals |
| SALVAGE | `SalvageCommodityDashboard` | Session logs, commodity stock breakdown |
| INVENTORY | `InventoryManager` | Multi-filter inventory view; inline stock edits |
| AUDIT LOG | `OpsAuditLog` | Immutable log of all critical actions |
| OPS DECK | `OpsCommandDeck` | Real-time in-game ops tools (haul strategy, loot sort, expenses) |
| MARKET | `MarketPriceComparator` | UEX price comparison for repricing decisions |
| INBOX | `RestockInbox` | Pending restock notification requests from buyers |

### Archived (sequestered for future operator development)
- **JOB BOARD** — contractor job postings
- **CREW** — crew roster management
- **Contractor dashboards** — per-operator station views

---

## Order Lifecycle

```
new → confirmed → in_fulfillment → delivered
         ↓
      cancelled   (only from 'new'; request-only from 'confirmed' via message thread)
```

### Handoff states
```
none → requested → confirmed → completed
```
Buyer proposes via `HandoffScheduler`; proprietor confirms/counters via `HandoffCoordinator` in the Orders tab.

---

## Entities

| Entity | Description |
|---|---|
| `product` | Storefront catalog items (commodities, components, services) |
| `order` | Customer orders with handoff coordination fields |
| `order_message` | Buyer ↔ FSIS message thread per order |
| `restock_notify` | Buyer restock alert subscriptions |
| `discount_code` | Org/partner discount codes |
| `cargo_lot` | Salvage cargo lots (collected → processed → sold) |
| `loot_item` | Individual looted items in the processing pipeline |
| `work_order` | Crew ops with gross proceeds + share distribution |
| `ledger_entry` | Income/expense records with screenshot evidence |
| `commodity_price` | UEX price cache (synced via `syncUex` function) |
| `ops_log` | Audit trail for critical admin actions |
| `payday_cycle` / `payday_election` | Weekly crew payout cycle management |

---

## Backend Functions

| Function | Trigger | Purpose |
|---|---|---|
| `placeOrder` | Storefront checkout | Creates order, generates tracking code + passphrase |
| `processNewOrder` | Entity: order create (auto) | Auto-triage: verifies stock/pricing, auto-confirms clean orders |
| `trackOrder` | Buyer lookup | Returns full order status incl. all handoff confirmation fields |
| `updateHandoff` | Buyer action (guest-safe) | Proposes/updates handoff slot — uses service role so anonymous buyers can update their own order |
| `cancelOrder` | Buyer request | Voids a `new` order |
| `onOrderDelivered` | Entity: order update → delivered (auto) | Ledger income entry + stock decrement per line item |
| `recentDeliveries` | Scheduled / on-demand | Public feed of recent fulfilled orders |
| `syncUex` | Scheduled every 15 min (auto) | Pulls live commodity prices from UEX API; also writes `price_snapshot` history |
| `repriceProducts` | Scheduled daily (auto) | Re-anchors store prices to current UEX best-sell + FSIS margin |
| `syncLedgerToSheets` | Scheduled weekly Monday (auto) | Exports ledger summary to Google Sheets |
| `onWorkOrderSettled` | Entity: work_order update → settled (auto) | Distributes crew shares, writes ledger expense entries |
| `notifyRestock` | Entity: restock_notify update → notified (auto) | Emails buyer (if email contact present) when proprietor marks a restock request notified |
| `analyzeLedgerImage` | Manual (admin) | OCR scan of in-game wallet screenshots |
| `analyzeSalvageImage` | Manual (admin) | OCR scan of salvage haul screens |
| `applyScanToInventory` | Entity: salvage_scan create (auto) | Applies OCR results to cargo lot inventory |
| `checkPriceAlerts` | Scheduled every 15 min (auto) | Compares UEX cache against armed price alerts; emails operator on hit |
| `checkStockAlerts` | Entity: product update (auto) | Fires when product stock falls below armed threshold; emails operator |
| `dailyBriefing` | Scheduled daily 07:00 PST (auto) | LLM-composed daily ops summary |
| `salvageAdvisor` | On-demand | LLM-assisted haul strategy recommendations |
| `auditLedger` | Manual (admin) | Consistency check on ledger entries |
| `weeklyLedgerReport` | Scheduled weekly Monday (auto) | Weekly P&L export to Google Sheets |
| `openPaydayCycle` | Scheduled Fridays (auto) | Opens weekly 72h crew payout decision window |
| `closePaydayCycle` | Scheduled hourly (auto) | Closes expired pay day windows, settles elections, banks deferred shares |
| `submitPaydayElection` / `contractorPayday` / `getMyPayday` | Crew | Crew cash-in/defer elections |

---

## Design System

- **Theme:** Bronze Command Deck — dark warm background (`hsl(30,10%,5%)`), amber/bronze primaries (`hsl(38,72%,52%)`)
- **Fonts:** JetBrains Mono (mono/industrial labels), Inter (body)
- **Motion:** Framer Motion — spring transitions, stagger-in grids, Xi'an-inspired orbital animations
- **Icons:** lucide-react only
- **Color tokens:** defined in `index.css` (`:root` + `.dark`), mapped in `tailwind.config.js`

### Notable CSS classes
| Class | Effect |
|---|---|
| `.os-viewport` | Full dynamic viewport (100dvh/100dvw) |
| `.xian-glow` | Amber text glow |
| `.xian-border-glow` | Subtle amber box-shadow |
| `.xian-panel` | Dark gradient panel background |
| `.industrial-interior` | Mono font + window background |
| `.animate-breathe` | Slow scale+opacity pulse |

---

## Integrations

- **Google Sheets** (authorized) — ledger sync via `syncLedgerToSheets`
- **UEX API** — commodity price feed via `syncUex` backend function
- **Base44 LLM** (`InvokeLLM`) — salvage advisor, OCR analysis, daily briefing

See `docs/integrations.md` for setup, health checks, and recovery procedures.

---

## Documentation Runbooks

| Document | Purpose |
|---|---|
| `docs/access-control.md` | Guest/user/contractor/admin access matrix |
| `docs/automations.md` | Active automation registry, health checks, duplicate policy |
| `docs/integrations.md` | Google Sheets, UEX, email, LLM setup and recovery |
| `docs/buyer-flow.md` | Buyer journey, edge cases, safe trade policy |
| `docs/storefront-live-readiness.md` | Storefront go-live gate and buyer-facing copy checklist |
| `docs/admin-runbook.md` | Daily proprietor operations and order/handoff procedures |
| `docs/entities.md` | Field-level reference for critical entities |
| `docs/qa-checklist.md` | Release and regression checklist |
| `docs/known-gaps.md` | Limitations, mitigations, and future fixes |
| `docs/troubleshooting.md` | Symptom-based recovery guide |
| `docs/archived-features.md` | Sequestered modules and reactivation requirements |
| `docs/brand-naming.md` | Canonical naming and tone rules |

---

## Known Gaps & Design Decisions

| # | Area | Status | Notes |
|---|---|---|---|
| 1 | **Stock reservation** | Known gap | Stock is validated at `placeOrder` but not reserved until `onOrderDelivered` decrements it. Two concurrent orders for the same last units can both succeed. Acceptable for solo-op low-volume; fix with a reservation pattern if volume grows. |
| 2 | **syncUex admin-auth** | ✅ Working | Automation runs successfully with admin context. `last_run_status: success` confirmed. |
| 3 | **trackOrder handoff fields** | ✅ Fixed | Response now includes all `handoff_confirmed_*` and `handoff_status` fields — buyers see confirmed slots in `MyOrders`. |
| 4 | **Guest HandoffScheduler RLS** | ✅ Fixed | `HandoffScheduler` now calls the `updateHandoff` backend function (service role) instead of direct entity update — anonymous buyers can schedule handoffs. |
| 5 | **restock_notify outbound** | ✅ Fixed | `notifyRestock` function + automation: when proprietor marks `notified: true`, an email is sent if buyer provided an email address as contact. Non-email contacts (Discord, Spectrum) are logged in ops_log for manual follow-up. |
| 6 | **UEX scope** | Known gap | `syncUex` covers only 3 salvage commodity codes (RMC, CMR, Scrap). Ship components, FPS gear, and weapons have no auto-market-ref. |
| 7 | **Duplicate automations** | ✅ Cleaned | 4 duplicate payday/ledger automations archived. |
| 8 | **GrimHEX surcharge** | Known gap | `storeLocations.js` notes "escort surcharge may apply" for GrimHEX but no code enforces it — manual at fulfillment. |

## Development Notes

- All operator/crew features (Job Board, Crew Roster, Contractor dashboards) are **archived** in comments — searchable by `// ARCHIVED` — not deleted, ready for future development.
- The storefront intentionally has **no backend auth wall** — buyers are anonymous; orders use tracking codes.
- Admin views enforce `user.role === 'admin'` both in UI and entity RLS policies.
- Tailwind dynamic class names must use `safelist` in `tailwind.config.js` — never interpolate class strings at runtime.
- Backend functions run on Deno; use `npm:` prefix for all npm dependencies.