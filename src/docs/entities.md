# FSIS Critical Entity Reference

This document describes only the entities most important to production operation.

## `order`

| Field | Meaning | Operational note |
|---|---|---|
| `customer_handle` | Buyer RSI/in-game handle | Required for order identity |
| `tracking_code` | Public receipt code | Buyer uses this to track order |
| `handoff_passphrase` | Spoken identity token | Keep private until handoff |
| `items` | Ordered line items | Product ID/name/quantity/unit price snapshot |
| `total_auec` | Final order total | After discount |
| `delivery_location` | Requested delivery destination | Drives ETA display |
| `status` | Order lifecycle | `new`, `confirmed`, `in_fulfillment`, `delivered`, `cancelled` |
| `handoff_status` | Handoff lifecycle | `none`, `requested`, `confirmed`, `completed` |
| `handoff_proposed_time` | Buyer availability | Free text; supports flexible timezone phrasing |
| `handoff_location` | Buyer requested meetup | May differ from checkout delivery location |
| `handoff_contact` | Buyer comms channel | Email/Discord/Spectrum/in-game |
| `handoff_confirmed_time` | Proprietor confirmed slot | Shown to buyer |
| `handoff_confirmed_location` | Proprietor confirmed location | Shown to buyer |
| `handoff_proprietor_note` | Proprietor note | Shown to buyer |
| `internal_notes` | Admin-only notes | Never rely on this for buyer-visible communication |

## `product`

| Field | Meaning | Operational note |
|---|---|---|
| `product_name` | Public name | Required |
| `code` | Short commodity/item code | Used in cards/order lines |
| `category` | Product category | Controls storefront display and service behavior |
| `price_auec` | Buyer price | Required |
| `market_ref_auec` | UEX/reference price | Used for FairShare pricing math |
| `margin_percent` | Margin over reference | Used by repricing |
| `stock` | Available units | Not hard-reserved at order placement |
| `available` | Storefront visibility | Hide instead of delete when possible |
| `make_offer_only` | Offer-only listing flag | Requires separate buyer/admin workflow if enabled |
| `loot_item_id` | Source loot link | Useful for salvage lifecycle tracing |

## `restock_notify`

| Field | Meaning | Operational note |
|---|---|---|
| `product_id` | Requested product | Link to catalog ware |
| `product_name` | Product name snapshot | Useful if product later changes |
| `handle` | Buyer handle | Required |
| `contact` | Contact channel | Email enables automated email; Discord/Spectrum/manual otherwise |
| `notified` | Whether follow-up occurred | Updating to true triggers restock outbound automation |

## `ledger_entry`

| Field | Meaning | Operational note |
|---|---|---|
| `entry_type` | Income or expense | Amounts are positive; type determines direction |
| `category` | Business category | Used for reports |
| `amount_auec` | Amount | Required |
| `description` | Human-readable reason | Include order/work order where possible |
| `entry_date` | Transaction date | Used in reporting windows |
| `source` | Manual/OCR/automation | Helps audit data quality |
| `screenshot_url` | Evidence file | Optional but recommended for manual ledger entries |

## `ops_log`

| Field | Meaning | Operational note |
|---|---|---|
| `action` | What happened | Use consistent dotted names |
| `entity_type` | Entity affected | Example: `order`, `product`, `work_order` |
| `entity_id` | Record ID | Supports audit lookup |
| `actor` | Who performed action | User handle or `FSIS.bot` |
| `before` / `after` | State snapshots | Include only relevant fields |
| `notes` | Extra context | Use for manual follow-up details |