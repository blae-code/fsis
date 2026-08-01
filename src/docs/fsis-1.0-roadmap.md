# FSIS 1.0 — Road to Launch (working memory)

Definition of 1.0: onboarding befitting the storefront's rigour; account-free ordering with optional
Patron accounts; Contractors with a Job Board, RSVPs, claimable work orders, proof-of-work review and
work-history dashboards; Owners near-admin **by invitation only**; Proprietor (`blae@katrasoluta.com`)
as first among equals and sole tie-breaker.

Standing rules:
- **Proprietor** — one seat. Sole authority to invite/appoint Owners. Final tie-breaker.
- **Owner** — near-admin. Invitation only; no self-registration, no application route.
- **Contractor** — ad-hoc labour, outside the co-op. Never included in share-based payday. Self-registers,
  reviewed before activation.
- **Patron** — buyer. Ordering never requires an account; an account is optional.

Tone directive (applies to all text we touch): Marxist in tone and substance — labour is the source of all
value, the collective owns the means of production, plain solidarity language, no bossware euphemisms.

## Phases

- **Phase 1 — Identity foundation** ✅ COMPLETE
  Four standings on the user record, shared role logic, proprietor-only Owner invitation, council-level
  grant/revoke with a permanent access audit trail, Access console tab, management console gated on
  council standing.
- **Phase 2 — Task work orders** ✅ COMPLETE
  Assignable task object (spec, deadline, reward, claimant, proof, review state) kept separate from the
  share-settlement work order. Council authoring UI + review queue with approve/reject and credit on approval.
- **Phase 3 — Contractor experience** ✅ COMPLETE (labour board at `/work`: open tasks, musters with RSVP,
  work in hand with time remaining, record of labour; contractors barred from share elections and skipped
  in cycle settlement)
  Contractor job board (open tasks + scheduled operations with RSVP + detail), claim + proof submission,
  "my tasks" with time remaining, work-history dashboard. Enforce contractor exclusion from share payday.
- **Phase 4 — Public front doors** (in progress)
  ✅ Storefront "WORK WITH US" tab: labour advert + terms, account prompt for guests, contractor request
  form (`standing_request` + `requestStanding`), pending/declined status shown back to the applicant, and a
  council review queue in the STANDING tab that admits straight to contractor standing.
  ✅ Patron guest-order claiming: `claimOrder` binds device-tracked tracking codes to an account
  (`order.claimed_by_user_id`, read/update RLS extended), surfaced on the ACTIVE ORDERS tab.
  ⬜ Remaining: onboarding branched into Patron / Contractor / Operator paths.
- **Phase 4.5 — Contractor standing & reputation** (requested, not yet built)
  Reputation as a record of labour given and labour withheld, not a credit score:
  - Reputation earned on credited work orders and on musters actually stood, held on the member record
    with an immutable event log (source task/operation, delta, reason, actor).
  - Reputation tiers grant the contractor a standing discount at the storefront, scaled to the tier —
    the collective returns value to those who make it.
  - A contractor may abandon work in hand, at cost: an automatic reputation reduction weighted by the
    harm done to operations (lead time lost, urgency, agreed credit).
  - The contractor may file a reason with the abandonment; an Owner-or-above reviews it and may reduce,
    increase, or wholly neutralise the reduction, with the ruling recorded and shown back to the worker.
  - Owners may dismiss a contractor: contractor privileges locked (no claiming, no RSVP), a negative
    reputation mark applied, and a storefront surcharge — not a discount — applied to that account until
    an Owner reinstates them.
- **Phase 5 — Governance & launch**
  Council invite/role management hardening, access audit surfacing, end-to-end readiness pass across all
  four standings.

- **Final pass — visual & thematic polish**
  Full visual/thematic detail sweep once phases 1–5 land, plus completion of the Marxist tone refactor
  across all existing copy.