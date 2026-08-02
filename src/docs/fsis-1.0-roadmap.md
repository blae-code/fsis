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
  Muster-attendance awards ✅ CLOSED 2026-08-01 — `muster_stood` is awarded at session closeout to every
  hand who actually stood the run, which was the last item this phase was waiting on.
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
  - **Patron trade standing** ✅ built 2026-08-01 — buyers who no-show at handoff are the same failure from the other side.
    Decide one ledger or two; a patron mark must never bleed into labour standing.
  - **Decay & amnesty** ✅ built 2026-08-01 — marks lapse on a stated schedule and can be expunged by the council. No comrade
    is condemned in perpetuity by one bad month.
  - **Hard floors and ceilings** ✅ built 2026-08-01 — maximum discount, maximum surcharge, and an explicit rule for how
    standing adjustments compose with discount codes (cap the total, never stack unbounded). Never price
    a lot below acquisition cost.
  - **Visible to the worker** ✅ built 2026-08-01 — standing, tier, current adjustment and every event with its reason shown
    plainly on the labour board. No hidden score.
  - **Appeals discipline** ✅ closed 2026-08-01 — one appeal per event, a filing window, a stated review
    deadline, and the ruling shown back with reasoning. Silence from the council must not be a de facto
    denial. — the ruling, the marks a comrade carries, the amnesty, the dismissal, the
    reinstatement and the lapse are now each put in front of the comrade they concern via `notice`,
    carrying the reason, the date by which it may be answered and the date it stops counting. The
    obligations existed on the record before this; nothing had ever shown them to the person.
  - **Direct edits are governed** ✅ built 2026-08-01 — any hand-set reputation change is an audited event with actor and
    reason; the event log is append-only and never rewritten.
  - **Alt accounts** ✅ built 2026-08-01 — a dismissed worker returning under a fresh account defeats the whole system.
    Council needs linked-identity flagging (handle, contact, order history) and a stated policy.
  - **Review-queue service level** ✅ built 2026-08-01 — the council load view ages filed work, and
    `escalateStaleReviews` now goes over a quiet reviewer's head: work filed and undecided past five
    days, and appeals past the answer date the council itself promised, are put in front of the
    proprietor by name. The worker is told too — that their work was escalated, and that the delay is
    not theirs and counts against them in no way. Nothing is decided by it; silence is broken, not
    resolved. An obligation nobody is reminded of is a wish, and a load view only helps somebody who
    goes and looks.
- **Phase 4.6 — Exchange: auction house, buyback & instruments** ✅ COMPLETE (backend, 2026-08-01)
  A second hall beside the storefront, built to the same standard — members trade with one another; FSIS
  keeps the hall, not the goods.
  - **Auction house** ✅ built 2026-08-01 — `hall_lot` / `hall_bid` with `listHallLot`, `placeHallBid`,
    `watchHallLot`, `withdrawHallLot`, `relistHallLot`, `closeHallLots` and `confirmHallSettlement`.
  - **Hall fee** ✅ built 2026-08-01 — `hall_obligation`, raised at close with the rate fixed at listing
    so it cannot move under the seller, and never taken: the hall records what is owed, it does not hold
    money.
  - **Gear buyback** ✅ built 2026-08-01 — `buyback_offer` with `offerBuyback`, `respondToBuyback` and
    `expireBuybackOffers`. The fraction is a stated field rather than arithmetic hidden inside a number,
    and the offer tells the member outright they would likely get more selling it themselves in the hall
    — what they are buying is certainty and speed.
  - **Bulk intake** ✅ built 2026-08-01 — `bulkDraftHallLots`. Everything arrives as a DRAFT and nothing
    goes live: bulk entry is where a wrong grade gets past somebody, because the care that goes into one
    careful listing does not survive being asked for forty times. Lines are validated and reported
    individually, so three bad rows do not throw away thirty-seven good ones.
  - **Contracts as the connective tissue** ✅ built 2026-08-01 — `instrument` + `instrument_signature`
    (named so, because `contract` is already the in-game hauling contract and reusing it would break
    every frontend read of that entity), with `publishInstrument`, `signInstrument`,
    `withdrawFromInstrument` and `listMyInstruments`. The wording agreed to is stored **verbatim on the
    signature**, so a comrade always reads exactly what they signed rather than whatever the document
    says now.
  Critical paths that must be settled before building:
  - **Disputes** ✅ built 2026-08-01 — `hall_dispute`, `raiseHallDispute`, `ruleHallDispute`. Every
    remedy is something the hall can actually do; there is deliberately **no refund remedy**, because
    settlement is off-platform and the hall cannot reverse a payment. Both parties are told at once and
    the accused is asked for their account before anybody rules. Whether a ruling touches standing is
    decided explicitly and separately from the remedy — most disputes are two comrades describing the
    same evening differently.
  - **Unpaid commission ladder** ✅ built 2026-08-01 — reminder → listing privileges suspended → standing mark, with a council
    collections view showing what is owed, by whom, and how overdue.
  - **Lot end-states** ✅ built 2026-08-01 — settled, reserve_not_met, no_bids, withdrawn, expired, void.
    `closeHallLots` gives every lot past its time a terminal state, and `relistHallLot` carries the history
    forward rather than starting afresh. **Withdrawal mid-bid is deliberately restricted**: free before any
    bid, council-only with a reason afterwards, with every bidder told. A hall where lots vanish once the
    price is inconvenient is a hall nobody bids in seriously.
  - **Close behaviour** ✅ built 2026-08-01 — a bid inside the last two minutes pushes the close out by
    two minutes from that bid, so two comrades genuinely competing keep it open between them.
  - **FSIS in its own hall** ✅ settled 2026-08-01 — the council is **barred from bidding outright**, since
    they can read reserves. Any lot a council member lists declares that interest on the record.
  - **Double-listing guard** ✅ built 2026-08-01 — enforced across listing, relisting, bulk intake and
    buyback alike, including the same item appearing twice within one bulk batch.
  - **Intake honesty** ✅ built 2026-08-01 — a lot drawn from a screenshot cannot be listed until the
    seller confirms every field; the image is kept as evidence; and a seller may ask for the lot to be held
    for appraisal before it opens — held, not refused, with the reason told to them.
  - **Notifications** ✅ built 2026-08-01 — bid placed, outbid, reserve met, lot closing, lot won, commission due, offer
    expiring. Reuse the in-app notification path; no external email promises. Correction: there was
    no such path to reuse — what existed was three bespoke outbound alerts (`checkPriceAlerts`,
    `checkStockAlerts`, `notifyRestock`), each welded to its own alert record. The shared substrate
    now exists (`notice`, `shared/notices.js`), built once for 4.6, 4.7 and 4.8 together; the hall's
    events are added to its `kind` list when the hall is built.
  - **Buyback offers expire** ✅ built 2026-08-01 — a stated window, the fraction shown explicitly, the
    market figure and its source recorded, and an expired offer refused rather than quietly honoured.
  - **Settlement is off-platform** ✅ built 2026-08-01 — `confirmHallSettlement` takes **both** parties'
    confirmation, because one party's word is a claim and two is a record. Both are told plainly at the
    point of winning that FSIS records the trade rather than holding it. Completing a handoff credits both
    trade records.
  - **Contracts, properly** ✅ settled 2026-08-01 — FSIS countersigns everything (publishing standing
    terms openly is itself the offer and the countersignature; bespoke terms wait for an Owner), a
    withdrawal path that needs no permission and carries no penalty, and `listMyInstruments` as the one
    place a comrade reads everything they ever signed, withdrawn and superseded ones included.
    **A new version never binds somebody who signed an older one** — they are told in plain words what
    changed and asked to agree again, and until they do they stand on the version they actually read.
    Changing terms under people who are not looking is the worst thing a document system can do, and
    versioning is exactly what makes it easy, so it is refused rather than discouraged. A summary of
    changes is required to publish a new version: asking somebody to re-read a whole document to find
    one altered clause is a way of hoping they will not.
  - **Patch resets** ✅ built 2026-08-01 — `applyPatchReset` voids open lots rather than closing them
    (closing would name winners at obsolete prices and raise commission on sales nobody meant to make),
    expires live buyback offers, sets bids aside with the reason recorded rather than deleting them, tells
    everybody affected, and leaves already-settled trades untouched — those happened, in the world as it
    was. It has a dry_run so a sweep this broad can be previewed.
  - **Rate limits** ✅ built 2026-08-01 — three live lots for a new member, twenty once standing is earned.
    Not suspicion: a hall full of one account's junk costs every other seller their visibility.
  - **Rounding & currency** ✅ settled 2026-08-01 — one rounding rule now lives in `shared/money.js` and
    is stated in three parts: a settled sum changes hands in whole credits, a shelf price sits on the
    storefront's increment of 100, and shares carry two places because they are a division. The
    storefront rule had been copy-pasted into three functions and is now held once, so commission, bid
    and payout figures cannot drift apart by a credit. Negative zero is flattened on the way out — no
    comrade reads "-0" on a statement of what they are owed.
- **Phase 4.7 — Work orders, hardened** ✅ COMPLETE (backend, 2026-08-01)
  Built: handing work back (`releaseTask`, Phase 4.5); a daily `expireStaleClaims` sweep returning work
  claimed but unfiled 7 days past its due date to the board, with the lapse written into the task and
  `ops_log`; and a council load view (`LabourLoadPanel`) showing who carries what, who is overdue, what is
  owed to each hand, and which filed work has waited 3+ days unpaid.
  Also built: a thread on every task (`task_message`, `TaskMessageThread`) readable by the comrade party to
  it and the council, so work can be asked about before it is taken up and answered for after it is sent back.
  Every item below is now built on the backend. What remains for this phase is the frontend's half:
  crew places on the board, a blocked treatment, "my tasks" reading a comrade's own crew entry rather
  than the lead-hand mirror, a standing-briefs tab, hours fields, the credit suggestion with its
  working shown, a "waits on" picker, and a worker notice centre. The single-hand fields are kept as a
  mirror throughout, so the existing board keeps working until that lands.
  These were the holes in a task's life — each one a path a worker or the council could walk into with
  no way out:
  - **Handing work back** ✅ built 2026-08-01 — a worker may only go silent. Needs an explicit release with a reason, which is
    also the hook Phase 4.5's abandonment penalty depends on.
  - **Claim expiry** ✅ built 2026-08-01 — a claimed task past its due date sits forever. Stale claims must age visibly and
    return to the board.
  - **Many hands on one task** ✅ built 2026-08-01 — `hands_needed` and a `crew` on the task, so work
    wanting three scrapers is one brief with three places rather than three copies nobody can tell
    apart. A part-crewed task stays on the board so others can join, and reads as claimed only once
    it has the hands it asked for. Claiming is atomic against a `crew_count` token, so two comrades
    reaching for the last place cannot both get it. Every hand files their own proof and the task
    waits for all of them before the council sees it. Credit divides equally with the remainder
    handed to the earliest claimant rather than rounded away, so the crew is paid exactly what was
    agreed; standing is awarded in full to each hand, because three comrades who stripped a hull
    each gave their labour to it and standing is a record of labour given, not a pot to divide.
    The old single-hand fields are kept as a mirror of the lead hand, so nothing that reads a task
    the old way breaks. The board now reads through `listOpenWork` and shows places left, who is
    already on, what a task is waiting on and why it was put in front of you; every hand on a crew
    sees the work in their own hands, not only the lead, and files their own hours with their proof.
  - **Sequencing** ✅ built 2026-08-01 — `blocked_by` on the task and `setTaskDependencies` to write it,
    refusing an arrangement that cannot work: no task waiting on itself, on work that does not exist,
    or in a circle with other work. A prerequisite counts as met once credited **or cancelled**,
    because work that will now never happen must not block the yard forever, and a prerequisite that
    has been deleted is treated the same way — every chain needs a way out. `claimTask` re-checks
    against the real prerequisites rather than the stored flag, so a stale flag can never let blocked
    work be taken up, and it names which work is being waited on rather than only that there is a wait.
    Crediting work opens whatever was waiting on it, in one batch.
  - **Templates, recurrence and bulk posting** ✅ built 2026-08-01 — `task_template` holds the terms in
    one place, `postFromTemplate` puts it on the board (up to 20 at once, in one write), and
    `postRecurringTasks` lets a standing brief come round on its own at daily / weekly / fortnightly /
    monthly. Retyping a brief from memory is how the terms quietly drift — the same job pays a little
    differently each week and asks for a little more, and a comrade comparing this week's board to
    last week's cannot tell whether the work changed or only the mood did. A template holds a span
    rather than a deadline, since a recurring brief has no one due date. Each posting starts with
    nobody on it: a template cannot put a comrade on a task on their behalf. ✅ the council's half landed
    2026-08-01 — a standing-briefs panel in the task console (write a brief, put it on the board,
    retire or reinstate it), and the credit suggestion shown with its working beside both the
    one-off post form and the brief form, offering nothing where the record does not yet say enough.
  - **A thread on every task** ✅ built 2026-08-01 — proof is one-shot. Workers must be able to ask before claiming and answer
    after being sent back, the way order messages already work.
  - **Labour traced to value** ✅ built 2026-08-01 — `serves_type` / `serves_id` / `serves_name` on the
    task, and `getLabourCost` to read it back: the hands, the hours, what has been settled and what is
    still committed but unfinished, kept apart so a half-done job is never read as a settled cost.
    Not an efficiency measure and must not be read as one — it exists so the collective can say where
    value came from, and so a lot is never priced as though it made itself.
  - **Hours** ✅ built 2026-08-01 — `estimated_hours` on the posting so a comrade can judge the offer
    against their own time before taking it up, and `actual_hours` filed by the worker with their
    proof, as their own account of their own labour rather than a figure measured over them.
    **Deliberately NOT wired to `time_log`**, and the reason matters: `time_log` is the sole source
    of shares, while task labour is settled in full and directly at the agreed credit and is never
    drawn from the share pool. Writing a time log on task credit would pay the same work twice and
    would put contractors into share-based payday, against a stated hard rule. The thing that should
    write `time_log` is 4.8's attendance clock — which is what "time present" below is for.
  - **Credit guidance** ✅ built 2026-08-01 — `shared/labour.js` + `suggestTaskCredit` read back what
    the collective has actually paid for this kind of labour: the middle of comparable credited work,
    by the hour where the hands filed their hours and by the whole job where they did not, said to be
    the weaker reading when it is. A wage table written into the code would be the same drift with
    better manners, so it reads the record instead. It suggests and never sets, it shows its working
    so a comrade can audit the offer, and below three comparable jobs it offers **nothing** rather
    than inventing a figure — a made-up number carries the same authority on the page as an earned one.
  - **Notice to the worker** ✅ built 2026-08-01 — a `notice` addressed to one comrade and readable
    by them alone, a shared emitter in `shared/notices.js`, and `listNotices` / `markNoticesRead`.
    Two rules hold in the substrate: notice is always addressed to a person and never broadcast,
    and a failure to give notice can never undo the thing being reported, because labour credited
    must stay credited even if we could not tell them. Wired to the labour events: work credited
    and work sent back (`reviewTask`, carrying the council's reasoning in full), work handed back
    (`releaseTask`, stating what the mark cost, how it was weighted, the date by which it may be
    answered and the date it lapses), and a claim lapsing back to the board (`expireStaleClaims`,
    stating plainly that no standing was taken). ✅ the frontend's half closed 2026-08-01 — a notice
    centre at the head of the labour board (`NoticeCentre`), reading `listNotices` and marking read
    only by the comrade's own hand, each notice carrying its kind, its reason and who decided it.
  - **Council load view** ✅ built 2026-08-01 — who holds what, who is carrying too much, what is ageing unreviewed.
  - **Skills are collected and ignored** ✅ built 2026-08-01 — `shared/skills.js` reads the trades a
    comrade named in their own words on their application (a Vulture means salvage whether or not the
    word appears), carries them onto the record when the council admits them, and `listOpenWork`
    returns the board with likely work nearer the top and a stated reason for each match.
    **Matching surfaces work; it never restricts it.** Every open task comes back, ordering is all
    that changes, and work outside a comrade's declared trades stays entirely claimable — a comrade
    who has never scraped a hull and wants to learn is not told the board is not for them. A
    convenience that quietly became a gate would be worse than the inconvenience it fixed. Skills are
    self-declared and never an assessment made over anyone.

- **Phase 4.8 — Operations command & live sessions** ✅ COMPLETE (backend, 2026-08-01)
  Council-only. Today an operation is a notice board with a status flag; the run itself is untracked, so
  nothing an operation produces can pay anybody. Taking regolith.rocks as the reference, the centre of
  gravity is the **live session**, not the calendar:
  - **Whose labour is whose** ✅ settled 2026-08-01 — groundwork, because "only fact may pay people"
    needs the fact to name a person. Pay was keyed to a callsign typed into a field: match the string,
    draw the share. A callsign can be changed, by the comrade or by the council on a ruling, and the
    labour already given does not change with it — so a rename cut a hand off from their own shares,
    and the guard on an election rested on a name rather than an account. The account is now the key
    and the callsign is what we call them by (`shared/members.js`), with `user_id` / `member_user_id`
    added to the roster place, the time log, the election, the cycle snapshot and the work order.
    A roster place already claimed by an account can no longer be opened by holding a matching name.
    Older records carrying only a callsign still resolve, and a comrade with labour under both is
    gathered as one hand rather than appearing on the cycle twice.
  - **The live session** ✅ built 2026-08-01 — `operation_session` with `startOperationSession`,
    `markSessionPresence` and `closeOperationSession`. A run may be started from a muster or from
    nothing at all, since "I am going out now, who is on?" is a run before it is ever a notice.
    Closing settles it: `completed` no longer erases the run.
  - **Time present** ✅ built 2026-08-01 — presence is recorded as STINTS, so a hand who comes and goes
    over a long run is counted for all of it and once only. A stint left open is counted to the end of
    the run rather than dropped, and a clock left running overnight is capped rather than trusted —
    otherwise a forgotten tab mints a fortnight of shares for a night's sleep. Minutes become shares at
    the rate `time_log` has always documented, one per twenty, so a run settles into the same pool by
    the same arithmetic as every other hour the collective counts. **This is the writer `time_log` never
    had**, and the reason Phase 4.7's hours were deliberately kept out of it.
  - **Yield capture** ✅ built 2026-08-01 — `operation_session_id` on cargo lots, loot and scans, with
    `attachToSession` to tie them on and `getSessionSummary` to read the run whole. The suggested gross
    is a READING and not a decision: it adds up what was brought back and offers the figure, while the
    council states what it actually sold for at closeout. Attaching is refused on a settled run, because
    its yield is part of a settlement hands have already been paid against.
  - **Costs of the run** ✅ built 2026-08-01 — fuel, ammo, rearm, repair and insurance recorded on the
    session and deducted from the gross before anything is divided, stated openly so hands can see what
    was taken and why. A negative cost is never read as a refund.
  - **Closeout** ✅ built 2026-08-01 — the summary reads yield, costs, per-hand time and payout, and
    `markSessionPayoutPaid` records that money actually landed. "Settled" and "paid" are kept as two
    different facts: payment happens in-game, so FSIS records the transfer rather than making it, and
    collapsing the two would let the record show a comrade paid when nobody had sent them anything.
    A member's shares are **not** the council's to tick — they settle at pay day with everyone else's,
    and ticking them is refused so a run summary cannot show a false debt discharged. The tick can be
    lifted again, with the comrade told either way. The bridge from an operation to a pay day cycle now
    exists: run time becomes confirmed `time_log` shares.
  - **Clusters and finds** ✅ built 2026-08-01 — `cluster_name`, `worked_by_handle` and `stripped` on the
    scan, reported by `getSessionSummary`, so a field is marked, worked once and finished rather than
    rediscovered — and two hands do not fly to the same wreck.
  - **Processing timers** ✅ built 2026-08-01 — `processing_job` with `startProcessingTimer` and a
    `checkProcessingTimers` sweep that tells the comrades watching a hopper the moment it is out,
    claimed atomically so an overlapping sweep cannot wake them twice. A refinery run that finished at
    four in the morning used to sit until somebody happened to look, and material left standing is
    material at risk — borne by the hand who went out and won it.
  - **Loss log** ✅ built 2026-08-01 — `recordSessionLoss` writes hull, cargo and other losses with the
    claim window, so nobody misses it. Losses are kept apart from the running costs and are **never
    deducted from the split**: a comrade who lost a hull has already borne it, and taking it out of the
    crew's share as well would charge the collective's bad luck to the people who were there for it.
    Recorded so the collective can make them whole, never so it can be held against them.
  - **Role slots, not a headcount** ✅ built 2026-08-01 — `role_slots` on the muster and a chosen `role`
    on each answer, with fill state and a waitlist. "Crew needed: 4" cannot describe a run wanting one
    pilot and two scrapers, and four hands who all came to scrape is a run that does not fly. A full
    place **queues rather than refuses**, taken in the order answers arrived; when a holder stands down
    the next in line takes it and is told, because a place that comes free silently is a place nobody
    knows they have. First come, first served in public — the alternative is the council picking who
    flies, which is a different kind of outfit. Musters written before places still read sensibly,
    falling back to their headcount as open places of no particular trade.
  - **Ad-hoc musters in one tap** ✅ built 2026-08-01 — `callMuster` makes the muster, tells everyone who
    could come, and with `start_now` opens the run immediately with the caller already counted present.
    Calling a run had meant filling in a scheduled operation as though every flight were planned a week
    out, which is not how anybody plays — so runs went uncalled and the hands who would have come never
    heard.
  - **Reminders and fair time** ✅ built 2026-08-01 — `shared/timekeeping.js`, `sendMusterReminders`
    (T-24h and T-1h, claimed atomically so an overlapping sweep cannot tell everybody twice) and
    `getMusterTimes` (each comrade's own clock, the ranked best-time reading, and a calendar file).
    Timezones are now carried onto the record when a comrade is admitted, from what they wrote on
    their own application. Offsets are computed at the instant, so a run in July and a run in December
    both read correctly where summer time is kept, and an unknown zone returns **nothing rather than
    being quietly treated as UTC** — assuming a zone is how somebody is told the wrong hour with total
    confidence. The best-time reading names **who each hour is awkward for**, because "best" measured
    by headcount alone quietly means "worst for the same two comrades every week", and they are the
    ones who stop answering.
  - **Standing an op down must speak** ✅ built 2026-08-01 — `standDownOperation` requires a reason and
    tells everyone who said they were in **or might be**, since they held the time open too. A comrade
    who kept an evening free and worked it out from the silence has paid a real cost — and it is exactly
    the behaviour the collective marks buyers for at handoff, so it cannot be acceptable in the other
    direction. A run with hands already on it cannot be stood down at all: it is settled through
    closeout instead, because time already given must still be paid.
  - **Debrief and audit** ✅ built 2026-08-01 — a `debrief` recorded at closeout, and `ops_log` now
    carrying operations throughout: sessions started and closed, presence, yield attached, losses,
    musters called, stood down and reminded.
  - **Planning joined to logistics** ✅ built 2026-08-01 — `expected_haul_scu` / `hull_capacity_scu` /
    `freight_plan_id` on the muster, `shared/logistics.js` and `getOperationPlan`. A linked freight plan
    is the authority on capacity, since typing a hull size twice is how the two come to disagree.
    Where capacity is unstated it says the gap out loud rather than guessing — a confident wrong answer
    about whether a haul fits is worse than an admitted one, because somebody acts on it. Once a run has
    flown, the estimate is set beside what came back, as a reading to make the NEXT estimate better and
    for nothing else: a run that came back light was usually a thin field, and treating that as a failing
    teaches the yard to promise less rather than plan better.
  - **Access** ✅ corrected 2026-08-01 — operation records are council-only; workers read a redacted muster
    board through `listMusters`, which withholds internal notes and other comrades' standings.
  - Cross-cutting comfort: a worker notification centre, a second-screen mode for a live op, quick logging
    during a run, "your next muster" on the labour board, and a per-member availability profile.

- **Phase 4.6 — The hall (frontend)**
  - **The floor** ✅ built 2026-08-02 — `/hall`, read only through `browseHall`: lots on the floor, a
    comrade's own lots, and what they are watching. No reserve appears anywhere, and no "reserve met"
    indicator either — a hall that confirms the figure has been reached has given it away to anybody
    willing to bid twice.
  - **The lot** ✅ built 2026-08-02 — the lot in full with the run of bidding shown openly, since
    bidding nobody can read is bidding nobody can check. The bid control states plainly that a bid
    under an unseen reserve is taken rather than refused, and that a late bid pushes the close out, so
    nothing here is won by timing a click. Council members see the control withheld with the reason:
    they can read reserves, so they do not bid. A seller sees their own reserve, labelled as never
    shown to bidders, and may withdraw or put an unsold lot back on the floor.
  - **Selling into the hall** ✅ built 2026-08-02 — a listing form, and a bulk write-up for a hold
    full of gear. The listing agreement gate shows the terms in full and signs them in place rather
    than sending a comrade away with an error: a lot listed under terms nobody can point to is a lot
    with no terms, and the commission is one of them. The reserve field says on its face that it is
    never shown to bidders. Bulk lines land as drafts and are read back twice — once before sending
    and once as `rejected[]` afterwards, line by line with the reason — because bulk entry is where a
    mistyped reserve gets past somebody.
  - **Standing runs called properly** ✅ corrected 2026-08-02 — the template panel now calls
    `callMuster` rather than writing `crew_operation` directly. A muster written straight to the record
    notifies nobody, and a muster nobody is told about is an evening nobody sets aside.
  - **The eight silent sweeps** ✅ registered 2026-08-02 — every scheduled job in the contract is now a
    platform automation. `closeHallLots` was the worst of them: bids would have accumulated, nothing
    ever won, no commission ever raised, and the hall would have looked like it worked.

- **Phase 5 — Governance & launch**
  Council invite/role management hardening, access audit surfacing, end-to-end readiness pass across all
  four standings.

- **Visual asset library** ✅ backend built 2026-08-02 — somewhere for bespoke visual work to live.
  `visual_asset` + `shared/assets.js` + `listVisualAssets` / `upsertVisualAsset`. **89 slots**, and the
  slot keys are DERIVED from the app's real enums rather than written out again, so the day somebody
  adds a task category or a muster role the slot for it exists and shows up as unfilled — a
  hand-written list would drift within a month and nobody would notice until the icon was missing.
  Two rules hold: **every slot degrades**, so no screen may require an asset and a missing one renders
  as its absence rather than a gap; and **the hand that made it is credited**, because an asset is
  labour like any other. Alt text is required — an image without it is decoration that has become
  information for everyone except the comrades it excludes. `listVisualAssets` answers "what does the
  app still want?" with a brief attached to each gap, so an artist can be given a commission rather
  than a screenshot and a vague ask.

- **Final pass — visual & thematic polish**
  Full visual/thematic detail sweep once phases 1–5 land, plus completion of the Marxist tone refactor
  across all existing copy.