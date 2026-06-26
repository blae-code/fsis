# FSIS Known Gaps & Mitigation Plans

This file tracks known limitations that are accepted for now but should not be forgotten.

## 1. Stock Is Not Hard-Reserved

**Status:** Known gap  
**Risk:** Two buyers could order the last units before delivery decrements stock.  
**Current mitigation:** Proprietor reviews stock before confirming orders.  
**Buyer language:** Availability is confirmed by FSIS before fulfillment.  
**Future fix:** Add inventory reservation records with expiration.

## 2. UEX Market Scope Is Limited

**Status:** Known gap  
**Risk:** Only salvage commodity pricing is automated; components/gear/weapons lack automatic market reference.  
**Current mitigation:** Manual pricing for non-salvage wares.  
**Future fix:** Expand UEX/data provider coverage or add curated item reference tables.

## 3. GrimHEX Surcharge Is Manual

**Status:** Known gap  
**Risk:** Buyer may not understand high-risk route cost.  
**Current mitigation:** Checkout displays warning note; proprietor confirms any surcharge manually.  
**Future fix:** Add formal route surcharge rules and buyer approval flow.

## 4. Contractor Features Are Archived

**Status:** Intentional design decision  
**Risk:** Some code/docs may still reference crew/operator modules.  
**Current mitigation:** Features are sequestered and not part of primary solo-proprietor workflow.  
**Future fix:** Reintroduce only after access model, data model, and payroll rules are finalized.

## 5. Tracking Code/Passphrase Is Bearer-Style Access

**Status:** Accepted buyer UX tradeoff  
**Risk:** Anyone with the code/passphrase can look up public order tracking details.  
**Current mitigation:** FAQ tells buyers to keep passphrase private.  
**Future fix:** Optional buyer account claim flow or one-time secure lookup links.

## 6. Restock Manual Follow-Up for Non-Email Contacts

**Status:** Accepted operational behavior  
**Risk:** Discord/Spectrum/in-game handles cannot be auto-contacted.  
**Current mitigation:** `notifyRestock` logs manual follow-up when contact is not email.  
**Future fix:** Add supported connector-based outbound channels if desired.

## 7. Bulk Quote Is Estimate-First

**Status:** Known UX/business rule gap  
**Risk:** Buyer may assume quote is binding or fully backorder-capable.  
**Current mitigation:** Quote text says discounts are confirmed by operator.  
**Future fix:** Add explicit quote acceptance workflow with admin approval.