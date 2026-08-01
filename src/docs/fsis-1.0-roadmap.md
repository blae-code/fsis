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
    ✅ closed 2026-08-01 — the ruling, the marks a comrade carries, the amnesty, the dismissal, the
    reinstatement and the lapse are now each put in front of the comrade they concern via `notice`,
    carrying the reason, the date by which it may be answered and the date it stops counting. The
    obligations existed on the record before this; nothing had ever shown them to the person.
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
    expiring. Reuse the in-app notification path; no external email promises. Correction: there was
    no such path to reuse — what existed was three bespoke outbound alerts (`checkPriceAlerts`,
    `checkStockAlerts`, `notifyRestock`), each welded to its own alert record. The shared substrate
    now exists (`notice`, `shared/notices.js`), built once for 4.6, 4.7 and 4.8 together; the hall's
    events are added to its `kind` list when the hall is built.
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
  - **Handing work back** — a worker may only go silent. Needs an explicit release with a reason, which is
    also the hook Phase 4.5's abandonment penalty depends on.
  - **Claim expiry** — a claimed task past its due date sits forever. Stale claims must age visibly and
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
    nobody on it: a template cannot put a comrade on a task on their behalf.
  - **A thread on every task** — proof is one-shot. Workers must be able to ask before claiming and answer
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
  - **Council load view** — who holds what, who is carrying too much, what is ageing unreviewed.
  - **Skills are collected and ignored** ✅ built 2026-08-01 — `shared/skills.js` reads the trades a
    comrade named in their own words on their application (a Vulture means salvage whether or not the
    word appears), carries them onto the record when the council admits them, and `listOpenWork`
    returns the board with likely work nearer the top and a stated reason for each match.
    **Matching surfaces work; it never restricts it.** Every open task comes back, ordering is all
    that changes, and work outside a comrade's declared trades stays entirely claimable — a comrade
    who has never scraped a hull and wants to learn is not told the board is not for them. A
    convenience that quietly became a gate would be worse than the inconvenience it fixed. Skills are
    self-declared and never an assessment made over anyone.

- **Phase 4.8 — Operations command & live sessions** (audited 2026-08-01, not yet built)
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
  - **Yield capture** — scans, lots and loot won during a run attach to the run. Without this there is no
    per-op profit and no honest answer to "was that worth flying".
  - **Costs of the run** ✅ built 2026-08-01 — fuel, ammo, rearm, repair and insurance recorded on the
    session and deducted from the gross before anything is divided, stated openly so hands can see what
    was taken and why. A negative cost is never read as a refund.
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