# FSIS — FairShare Industrial Solutions
### Star Citizen Trade Terminal · Proprietor OS

> *"Honest salvage. Fair prices."*

A dual-interface web OS for solo-proprietor in-game commerce. Buyers get a polished storefront; the proprietor gets a full management console behind a discreet access point.

---

## Architecture Overview

| Layer | Path | Notes |
|---|---|---|
| **Storefront** | `/` → `pages/Storefront` | Public-facing; no login required to browse or order |
| **Management Console** | `/ops` → `pages/Desktop` | Admin-only; accessed via the dim `⚙` icon in the storefront header |
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
| `/` or `F` | Focus search bar |
| `Cmd+K` | Command palette |
| `F11` | Toggle fullscreen |
| `F`→`S`→`I`→`S` | Proprietor key-chord — navigates to `/ops` |

### Proprietor access
The **Management Console** is accessible to admin users only via a small `⚙` icon in the top-right header corner (intentionally dim — hover to reveal). This replaces the previously visible "OPERATOR TERMINAL" button which has been archived.

---

## Management Console (`pages/Desktop`)

Reached at `/ops`. Redirects unauthenticated users (`!user`) back to `/`. The `F`–`S`–`I`–`S` key-chord typed anywhere on the storefront (via `CommandAccess`) also navigates here for the proprietor.

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
| `processNewOrder` | Entity: order create | Post-processing after order placed |
| `trackOrder` | Buyer lookup | Returns order status by tracking code or passphrase |
| `cancelOrder` | Buyer request | Voids a `new` order |
| `onOrderDelivered` | Entity: order update → delivered | Ledger entry + ops log |
| `recentDeliveries` | Scheduled / on-demand | Public feed of recent fulfilled orders |
| `syncUex` | Scheduled | Pulls latest commodity prices from UEX API |
| `repriceProducts` | Manual (admin) | Re-anchors store prices to current UEX market data |
| `syncLedgerToSheets` | Entity: work_order settled | Pushes ledger data to Google Sheets |
| `onWorkOrderSettled` | Entity: work_order settle | Distributes crew shares, writes ledger |
| `analyzeLedgerImage` | Manual (admin) | OCR scan of in-game wallet screenshots |
| `analyzeSalvageImage` | Manual (admin) | OCR scan of salvage haul screens |
| `applyScanToInventory` | Post-scan | Applies OCR results to cargo lot inventory |
| `checkPriceAlerts` | Scheduled | Fires price alert notifications |
| `checkStockAlerts` | Scheduled | Fires restock notifications |
| `dailyBriefing` | Scheduled | Generates daily ops summary |
| `salvageAdvisor` | On-demand | LLM-assisted haul strategy recommendations |
| `auditLedger` | Manual (admin) | Consistency check on ledger entries |
| `weeklyLedgerReport` | Scheduled | Weekly P&L summary |
| `openPaydayCycle` / `closePaydayCycle` | Manual (admin) | Manage weekly crew payout windows |
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

---

## Development Notes

- All operator/crew features (Job Board, Crew Roster, Contractor dashboards) are **archived** in comments — searchable by `// ARCHIVED` — not deleted, ready for future development.
- The storefront intentionally has **no backend auth wall** — buyers are anonymous; orders use tracking codes.
- Admin views enforce `user.role === 'admin'` both in UI and entity RLS policies.
- Tailwind dynamic class names must use `safelist` in `tailwind.config.js` — never interpolate class strings at runtime.
- Backend functions run on Deno; use `npm:` prefix for all npm dependencies.