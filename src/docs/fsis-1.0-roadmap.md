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
- **Phase 4.5 — Contractor standing & reputation** (core built 2026-08-01)
  Built: `standing_event` as an append-only record (readable by the comrade it concerns and the council);
  `reputation` / `standing_locked` on the member record, recomputed from events; tiers with stated
  discount/surcharge and hard caps in `shared/reputation.js`; standing earned automatically when work is
  credited; `releaseTask` hand-back with a harm-weighted cost; one appeal per mark via
  `appealStandingEvent` with an answer date the council owes; `ruleOnAppeal` (uphold / reduce / increase /
  neutralise) with reasoning shown back; `adjustStanding` for audited hand-set changes, dismissal,
  reinstatement and amnesty; dismissal locks claiming and muster answers; a worker-facing standing panel
  on the labour board and a council appeal queue in the Access tab.
  Also built: the standing adjustment now settles at checkout in `placeOrder` (recorded on the order as
  `standing_percent` / `standing_auec` / `standing_tier`, capped with any code at 20% in total, surcharge
  always standing, guests carrying none) and is stated to the buyer in the manifest; and a daily
  `lapseStandingMarks` sweep voids marks past their lifetime, writes a plain 'mark lapsed' entry and
  recomputes the totals.
  Also built: alt-account flagging — `identity_link` records a suspected pair with its grounds stated in
  full; `scanIdentityLinks` gathers grounds only for accounts already carrying a mark or a dismissal
  (shared handles across the record, applications and orders; shared address stems; shared contact handles),
  never deciding anything; `ruleIdentityLink` lets the council rule one comrade — carrying the lock and an
  equal mark across with the ordinary appeal route intact — or two comrades, which retires the pair for good.
  Surfaced in the Access tab.
  Also built: patron trade standing — a wholly separate ledger (`trade_event`, `trade_standing` /
  `trade_locked` on the account) recorded by the council at handoff (`recordTradeConduct`: turned up,
  cancelled late, left a hand waiting), locking automatically at -20 with the reason stated; guest orders
  carry no ledger at all; marks lapse after 90 days in the same daily sweep; the two ledgers are read apart
  and only their price effects are added, inside the existing caps (`placeOrder`); shown back to the buyer in
  full on the ACTIVE ORDERS tab and to the council in the Access tab.
  Still open: muster-attendance awards (which wait on Phase 4.8's live sessions).
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
  - **Rounding & currency** ✅ settled 2026-08-01 — one rounding rule now lives in `shared/money.js` and
    is stated in three parts: a settled sum changes hands in whole credits, a shelf price sits on the
    storefront's increment of 100, and shares carry two places because they are a division. The
    storefront rule had been copy-pasted into three functions and is now held once, so commission, bid
    and payout figures cannot drift apart by a credit. Negative zero is flattened on the way out — no
    comrade reads "-0" on a statement of what they are owed.
- **Phase 4.7 — Work orders, hardened** (audited 2026-08-01, partly built)
  Built: handing work back (`releaseTask`, Phase 4.5); a daily `expireStaleClaims` sweep returning work
  claimed but unfiled 7 days past its due date to the board, with the lapse written into the task and
  `ops_log`; and a council load view (`LabourLoadPanel`) showing who carries what, who is overdue, what is
  owed to each hand, and which filed work has waited 3+ days unpaid.
  Also built: a thread on every task (`task_message`, `TaskMessageThread`) readable by the comrade party to
  it and the council, so work can be asked about before it is taken up and answered for after it is sent back.
  Still open below: many hands on one task, sequencing, templates/recurrence/bulk posting, labour traced to
  value, hours, credit guidance, notice to the worker, and skills matching.
  The labour board works, but a task's life has holes in it. Each of these is a path a worker or the
  council can walk into today with no way out:
  - **Handing work back** — a worker may only go silent. Needs an explicit release with a reason, which is
    also the hook Phase 4.5's abandonment penalty depends on.
  - **Claim expiry** — a claimed task past its due date sits forever. Stale claims must age visibly and
    return to the board.
  - **Many hands on one task** — `assigned_user_id` is singular; work needing three scrapers cannot be
    posted as one task.
  - **Sequencing** — no way to say "haul after strip"; tasks need a blocked/ready state.
  - **Templates, recurrence and bulk posting** — the council retypes the same brief every week, one at
    a time.
  - **A thread on every task** — proof is one-shot. Workers must be able to ask before claiming and answer
    after being sent back, the way order messages already work.
  - **Labour traced to value** — link a task to the order, cargo lot or operation it serves, so the true
    labour cost of a lot can be stated rather than guessed.
  - **Hours** — `time_log` exists and is unwired. Estimated against actual hours belongs on the task.
  - **Credit guidance** — suggest a fair sum from category and hours so pay does not drift by mood.
  - **Notice to the worker** — claim, return and credit events must reach them.
  - **Council load view** — who holds what, who is carrying too much, what is ageing unreviewed.
  - **Skills are collected and ignored** — match posted work against declared skills from standing requests.

- **Phase 4.8 — Operations command & live sessions** (audited 2026-08-01, not yet built)
  Council-only. Today an operation is a notice board with a status flag; the run itself is untracked, so
  nothing an operation produces can pay anybody. Taking regolith.rocks as the reference, the centre of
  gravity is the **live session**, not the calendar:
  - **The live session** — start and stop a run, with a roster of who actually turned up. RSVP is intent;
    attendance is fact, and only fact may pay people.
  - **Time present** — hands join and leave over a long run. Attendance-weighted shares are impossible
    without a clock.
  - **Yield capture** — scans, lots and loot won during a run attach to the run. Without this there is no
    per-op profit and no honest answer to "was that worth flying".
  - **Costs of the run** — fuel, ammo, rearm, repair, insurance, deducted before any split.
  - **Closeout** — the session summary is regolith's best feature: yield, costs, per-hand payout, and a
    tick that each hand was actually paid. Today `completed` simply erases the run; there is no bridge
    from an operation to a payday cycle at all.
  - **Clusters and finds** — `salvage_scan` is unlinked to operations. Mark a wreck field, who is working
    it, whether it is stripped.
  - **Processing timers** — refinery-style countdowns with notice on completion.
  - **Loss log** — hull destroyed, cargo lost, claim timer running.
  - **Role slots, not a headcount** — one pilot, two scrapers, with fill state, a waitlist, and no-show
    marking that feeds standing.
  - **Ad-hoc musters in one tap** — "I am going out now, who is on?" is the most-used flow that does not
    exist, and matters most to a proprietor who plays opportunistically.
  - **Reminders and fair time** — T-24h and T-1h notice, times shown in each comrade's own zone, a best-time
    reading across respondents, calendar export. Timezones are collected and unused.
  - **Standing an op down must speak** — cancellation currently tells nobody who said they were in.
  - **Debrief and audit** — lessons recorded, and `ops_log` finally carrying operations so musters have
    a trail.
  - **Planning joined to logistics** — expected haul against hull capacity, tied into freight plans and
    cargo lots, so an Owner can plan the run before calling the muster.
  - **Access** ✅ corrected 2026-08-01 — operation records are council-only; workers read a redacted muster
    board through `listMusters`, which withholds internal notes and other comrades' standings.
  - Cross-cutting comfort: a worker notification centre, a second-screen mode for a live op, quick logging
    during a run, "your next muster" on the labour board, and a per-member availability profile.

- **Phase 5 — Governance & launch**
  Council invite/role management hardening, access audit surfacing, end-to-end readiness pass across all
  four standings.

- **Final pass — visual & thematic polish**
  Full visual/thematic detail sweep once phases 1–5 land, plus completion of the Marxist tone refactor
  across all existing copy.