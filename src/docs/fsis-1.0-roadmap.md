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
  Critical paths that must be settled before building:
  - **Patron trade standing** — buyers who no-show at handoff are the same failure from the other side.
    Decide one ledger or two; a patron mark must never bleed into labour standing.
  - **Decay & amnesty** — marks lapse on a stated schedule and can be expunged by the council. No comrade
    is condemned in perpetuity by one bad month.
  - **Hard floors and ceilings** — maximum discount, maximum surcharge, and an explicit rule for how
    standing adjustments compose with discount codes (cap the total, never stack unbounded). Never price
    a lot below acquisition cost.
  - **Visible to the worker** — standing, tier, current adjustment and every event with its reason shown
    plainly on the labour board. No hidden score.
  - **Appeals discipline** — one appeal per event, a filing window, a stated review deadline, and the
    ruling shown back with reasoning. Silence from the council must not be a de facto denial.
  - **Direct edits are governed** — any hand-set reputation change is an audited event with actor and
    reason; the event log is append-only and never rewritten.
  - **Alt accounts** — a dismissed worker returning under a fresh account defeats the whole system.
    Council needs linked-identity flagging (handle, contact, order history) and a stated policy.
  - **Review-queue service level** — work awaiting credit or appeal must age visibly, with escalation to
    the proprietor, so labour is never left unpaid because a reviewer went quiet.
- **Phase 4.6 — Exchange: auction house, buyback & instruments** (requested, not yet built)
  A second hall beside the storefront, built to the same standard — members trade with one another; FSIS
  keeps the hall, not the goods.
  - **Auction house**: registered members list lots via a smart intake form — screenshot upload with
    AI-assisted extraction of item, grade, condition and suggested reserve (reuse the loot-intake analysis
    path), then reviewed by the seller before posting. Bidding, watch lists, close/settle, handoff
    coordination reusing the storefront handoff machinery.
  - **Hall fee**: a flat commission on every completed sale, owed to FSIS within 30 days of close.
    Tracked as an obligation with due date, paid/overdue state, and a council collections view.
  - **Gear buyback**: members sell loot directly to FSIS at a fair, openly-stated fraction of market —
    stated plainly as stock bought for resale. Council appraises, offers, and on acceptance the item flows
    into loot intake and on to the storefront.
  - **Bulk intake**: sellers with a hold full of loot add many lines at once — paste/tabular entry and
    multi-item screenshot extraction, reviewed as a batch before submission.
  - **Contracts as the connective tissue** — faux, transparent, immersive, never tedious: a signing-on
    charter at registration (terms differ per standing), a hall-listing agreement carrying the commission
    terms, and a release of ownership on buyback. Each is a stored, versioned document with the signatory,
    timestamp and accepted version on record, readable back at any time.
  Critical paths that must be settled before building:
  - **Disputes** — non-delivery, wrong grade, vanished counterparty. A filing route, an Owner-or-above
    ruling, stated remedies (refund, relist, void), and whether the outcome touches standing.
  - **Unpaid commission ladder** — reminder → listing privileges suspended → standing mark, with a council
    collections view showing what is owed, by whom, and how overdue.
  - **Lot end-states** — reserve not met, no bids, seller withdrawal mid-bid, expiry, relist. Every lot
    must have a terminal state; none may hang open forever.
  - **Close behaviour** — soft close / extension on late bids. A hall that can be sniped is not trusted.
  - **FSIS in its own hall** — either barred from bidding or openly disclosed, with council recusal on any
    lot they have an interest in, and no council eyes on hidden reserves they could exploit.
  - **Double-listing guard** — the same physical item cannot sit in the hall while also sold to buyback or
    listed on the storefront. One item, one live commitment.
  - **Intake honesty** — AI screenshot extraction is a draft, never an authority: seller confirms every
    field, the original image is retained as evidence, and suspicious grades can be held for appraisal.
  - **Notifications** — bid placed, outbid, reserve met, lot closing, lot won, commission due, offer
    expiring. Reuse the existing in-app notification path; no external email promises.
  - **Buyback offers expire** — a stated validity window, the appraisal basis shown as an explicit
    fraction of live market, and a record of the market figure used at appraisal time.
  - **Settlement is off-platform** — payment happens in-game, so every close needs a confirmation step
    from both parties and a plain statement that FSIS records the trade rather than escrows it.
  - **Contracts, properly** — countersignature by FSIS, a repudiation/withdrawal path, re-consent when a
    version changes, and one place a member can read every instrument they have ever signed.
  - **Patch resets** — a game patch or economy wipe invalidates reserves, appraisals and open lots.
    Needs a stated handling path, tied into the existing patch-transition tooling.
  - **Rate limits** — listing floods and junk lots throttled per member; new members held to lower limits
    until standing is earned.
  - **Rounding & currency** — one rounding rule shared with storefront pricing so commission, bid and
    payout figures can never disagree by a credit.
- **Phase 5 — Governance & launch**
  Council invite/role management hardening, access audit surfacing, end-to-end readiness pass across all
  four standings.

- **Final pass — visual & thematic polish**
  Full visual/thematic detail sweep once phases 1–5 land, plus completion of the Marxist tone refactor
  across all existing copy.