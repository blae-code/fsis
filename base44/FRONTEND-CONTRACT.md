# FSIS — backend contract for the frontend

What the backend now offers, what it expects, and what it will refuse. Written for the agent
building the interface, so nothing here has to be reverse-engineered from function source.

Kept in `base44/` rather than `src/docs/` because `src/**` belongs to the frontend; this file is the
backend's statement of its own surface. The roadmap (`src/docs/fsis-1.0-roadmap.md`) remains the
shared record of intent.

**Last updated 2026-08-01.**

---

## 0. Two rules that govern all of this

**Copy here is product, not debug output.** `match_reasons`, `basis`, and every `notice.body` are
written to be read by the comrade they concern, in the register the rest of the app uses. Showing a
match *score* instead of its reason, or a credit figure without its working, removes the point of the
feature. Where a field reads like a sentence, render the sentence.

**Nothing surfaces standing as a ranking.** Skills order a list; they never filter it. Attendance is
a clock; it is never a productivity measure. No screen should invite comparing one comrade to another.

---

## 1. New entities

| Entity | Who can read it | Purpose |
|---|---|---|
| `notice` | The recipient, and admins | One notice addressed to one comrade |
| `task_template` | Admins | A standing brief, posted repeatedly |
| `operation_session` | Anyone in `attendance_user_ids`, and admins | A live run |

### Changed entities — additive only, nothing renamed or removed

- `labour_task` — `hands_needed`, `crew[]`, `crew_user_ids[]`, `crew_count`, `blocked_by[]`,
  `is_blocked`, `estimated_hours`, `actual_hours`, `serves_type`/`serves_id`/`serves_name`,
  `template_id`/`template_name`
- `User` — `skills[]`
- `crew_member` — `user_id`
- `time_log`, `payday_election` — `member_user_id`
- `payday_cycle` — `user_id` inside `shares_by_handle[]` and `report[]`
- `work_order` — `user_id` inside `crew_shares[]`

**The single-hand fields on `labour_task` (`assigned_user_id`, `assigned_handle`, `assigned_email`,
`claimed_at`) are now a MIRROR of the lead hand.** They are maintained, so the existing board keeps
working untouched. They are also no longer the whole truth — a task may have several hands.

---

## 2. Endpoints

All are `POST` with a JSON body, called as Base44 functions. All require an authenticated caller.
"Council" means `isCouncil(user) || user.role === 'admin'`.

### Notices — *build this first, nine functions write to it and nothing renders it*

**`listNotices`** — a comrade's own notices. Scoped to the caller server-side; the council holds no
privilege here.
```
→ { limit?: number }              // default 50, max 200
← { unread: number,
    notices: [{ id, created_date, kind, title, body, source_type, source_id,
                source_name, actor_email, actor_role, read_at }] }
```
`kind` is one of: `work_claimed` `work_returned` `work_credited` `work_released` `claim_lapsed`
`standing_marked` `standing_lapsed` `trade_marked` `trade_standing_lapsed` `appeal_answered`
`muster_called` `muster_reminder` `muster_stood_down` `payday_opened` `payday_published`
`order_update` `council_message`.

`body` is multi-paragraph, separated by blank lines. **Render the paragraphs.** Marks carry their
reason, appeal deadline and lapse date in that text.

**`markNoticesRead`**
```
→ { notice_ids?: string[] }       // omit to mark ALL the caller's unread; max 200 ids
← { ok: true, marked: number }
```
Already-read notices are never re-marked, so the moment a notice was first read survives.

### The labour board

**`listOpenWork`** — *point the board at this instead of reading `labour_task` directly.* One call
carries everything the board needs.
```
→ {}
← { skills: string[],
    note: string,                 // render this — it says a ranked list is not a restricted one
    tasks: [{ id, title, brief, category, priority, location, due_date,
              agreed_credit_auec, estimated_hours,
              hands_needed, hands_on, places_left, already_yours,
              waiting_on: [{ task_id, title, status }],
              match_score, match_reasons: string[] }] }
```
Show `match_reasons`, not `match_score`. Every open task is returned; ordering is the only thing
skills change.

**`claimTask`**
```
→ { task_id }
← { ok: true, task, hands_on: number, hands_needed: number }
409 → "Another comrade took that place while you were reading."   // lost the atomic claim
409 → "This work has all the hands it asked for."
409 → "You already hold this work."
409 → { error, waiting_on: [{ task_id, title, status }] }          // blocked by other work
```
A part-crewed task stays `posted` so others can join. It reads `claimed` only when full.

**`submitTaskProof`**
```
→ { task_id, proof_notes?, proof_file_url?, actual_hours? }   // hours optional, 0 < h ≤ 24
← { ok: true, task, awaiting_other_hands: boolean }
```
Each hand files their own. `awaiting_other_hands: true` means the task is not yet with the council —
say so rather than showing it as submitted.

**`releaseTask`**
```
→ { task_id, reason }             // reason required
← { ok: true, standing_event, reputation: number }
```
Only that hand steps off; others keep their places. The mark's cost, appeal route and lapse date go
to the comrade as a notice — do not restate them from your own calculation.

**`reviewTask`** *(council)*
```
→ { task_id, decision: 'credit'|'return', review_notes?, credited_auec? }
← { ok: true, task, hands: number, split: { [user_id]: auec }, unblocked: number }
```
`review_notes` is required on `return` and is shown to the worker verbatim. `split` is the per-hand
settlement — equal, with the odd credit to the earliest claimant.

**`suggestTaskCredit`** *(council)*
```
→ { category, estimated_hours? }
← { suggested_auec: number|null, basis: string, sample_size, rate_auec, per: 'hour'|'task'|'' }
```
`suggested_auec` is **null** when the record is too thin — show `basis` as guidance and leave the
field empty. Never substitute a default.

**`setTaskDependencies`** *(council)* — use this rather than writing `blocked_by` directly; the cycle
check lives here.
```
→ { task_id, blocked_by: string[] }        // max 10
← { ok: true, task, ready: boolean, waiting_on: [{ task_id, title, status }] }
409 → "That would put the work in a circle…"
```

**`getLabourCost`** *(council)*
```
→ { serves_type: 'order'|'cargo_lot'|'operation'|'fab_project'|'work_order', serves_id }
← { settled_auec, committed_auec, total_auec, hours_worked, hours_estimated,
    hands: [{ user_id, handle }], task_count, credited_count, outstanding_count, tasks: [...] }
```
Settled and committed are reported apart — do not sum them into one figure in the UI either.
**Not an efficiency measure.** Present it as what a lot cost in labour, never as per-hand output.

### Standing briefs

**`postFromTemplate`** *(council)*
```
→ { template_id, count? }         // default 1, max 20
← { ok: true, posted: number, tasks: [...] }
```

**`postRecurringTasks`** — scheduled automation, no UI. **Needs registering as a scheduled job**
alongside the existing daily sweeps; until it is, `cadence` is inert and briefs post only by hand.

### Live runs — *the largest new surface*

**`startOperationSession`** *(council)*
```
→ { operation_id?, session_name?, op_type? }   // operation_id optional: ad-hoc runs are first-class
← { ok: true, session }
409 → { error, session_id }                    // that muster already has a run underway
```

**`markSessionPresence`**
```
→ { session_id, action: 'join'|'leave', user_id? }   // user_id = marking someone else, council only
← { ok: true, action, handle, roster: [{ user_id, handle, minutes, shares, stints, present_now }] }
```
`roster` is live: open stints accrue against the clock, so a run console can poll this and show time
building. Minutes are whole; `shares` is minutes ÷ 20.

**`closeOperationSession`** *(council)*
```
→ { session_id, gross_auec?, debrief? }
← { ok: true, session, hands, total_minutes, shares_written,
    contractors_settled, no_shows: number }
```
Settles the run: closes open stints, writes `time_log` shares for members, settles contractors
directly, awards `muster_stood`, records no-shows, notifies every hand. **Irreversible** — confirm
before calling. Costs are edited on the session record before closing.

### Payday — behaviour changed, shapes unchanged

`getMyPayday`, `contractorPayday`, `submitPaydayElection` now resolve a comrade by **account**, not
callsign. Response shapes are unchanged. A member whose roster place is not yet linked still resolves
by callsign, so nothing breaks — but see below.

---

## 3. What the frontend still needs to build

Ordered by value.

1. **Worker notice centre** — `listNotices` + `markNoticesRead`, with an unread count. Nine functions
   write notices today and nothing shows them. Best home: the labour board, beside the standing panel.
2. **Live-run console** *(council)* — start a run, roster with time accruing, join/leave, mark a hand
   present, add costs, close with gross and debrief. Plus a **run summary** readable by every hand who
   stood it: their minutes, their shares, what the run made and what it cost.
3. **Crew roster → account linking** (`crew_member.user_id`). Small screen, real consequence: the pay
   identity hardening stays inert until roster places are linked to accounts.
4. **Labour board rework** — repoint at `listOpenWork`; show places filled against places wanted;
   allow joining part-crewed work; a blocked treatment reading `is_blocked` + `blocked_by` titles;
   "my tasks" reading the caller's own `crew[]` entry (their proof, their hours, their credited
   figure) rather than the task-level mirror.
5. **Standing-briefs tab** *(council)* — author/edit a template, "post now" with a count, retire
   toggle (`active: false` keeps the record rather than deleting it).
6. **Task form additions** — `estimated_hours`, `hands_needed`, a "waits on" picker calling
   `setTaskDependencies`, and the credit suggestion showing `basis` beside the figure.
7. **Proof form** — `actual_hours`, optional.
8. **Labour cost panel** on cargo lot / order / operation views, reading `getLabourCost`, plus a
   "what does this serve" picker on the task form writing `serves_type`/`serves_id`/`serves_name`.

## 4. Safe to polish now

- **Public storefront and buyer flows.** Untouched by all of the above, and Phase 4.6 builds a second
  hall *beside* the storefront rather than rewriting it. The best parallel target.
- **Standing / access panels.** Phase 4.5 is complete and stable.

Hold off on the labour board until item 4 is built — polishing the current single-hand rendering
means polishing something scheduled for replacement.

## 5. Things that will bite

- **Do not write `blocked_by` directly.** The cycle check is in `setTaskDependencies`; a circle
  written around it cannot be claimed by anyone and there is no UI to unpick it.
- **Do not treat `is_blocked` as authoritative.** It is display only. `claimTask` re-checks live.
- **Do not read `assigned_user_id` as "the worker".** It is the lead hand of a possibly larger crew.
- **Do not sum `settled_auec` and `committed_auec`.** Committed work is not yet done.
- **`suggested_auec: null` is a real answer**, not an error state.
- **Task credit and run time are different money.** Task labour settles directly at agreed credit;
  run time becomes shares in the pay pool. Never present them as the same thing, and never show task
  credit as contributing to shares.

---

# Part II — operations and the hall

Added after Phases 4.8 and 4.6 landed. Everything above still stands.

## 6. New entities (part II)

| Entity | Who reads it | Purpose |
|---|---|---|
| `operation_session` | anyone in `attendance_user_ids`, admins | a live run |
| `processing_job` | its `watcher_user_ids`, admins | a refinery clock |
| `instrument` / `instrument_signature` | all users / the signatory + admins | terms, and who signed what |
| `hall_lot` / `hall_bid` | all users | the auction house |
| `hall_obligation` | the debtor + admins | commission owed |
| `hall_dispute` | either party + admins | something went wrong |
| `buyback_offer` | the seller + admins | FSIS offers to buy |

Additions: `crew_operation` gains `role_slots[]`, `rsvps[].role`, `rsvps[].waitlisted`,
`stood_down_reason`, `reminders_sent[]`, `expected_haul_scu`, `hull_capacity_scu`,
`freight_plan_id`, `operation_template_id`. `User` gains `timezone`. `cargo_lot` / `loot_item` /
`salvage_scan` gain `operation_session_id`; scans also gain `cluster_name`, `worked_by_handle`,
`stripped`.

## 7. Live runs

**`startOperationSession`** *(council)* — `{ operation_id?, session_name?, op_type? }`. `operation_id`
is optional: ad-hoc runs are first-class.

**`markSessionPresence`** — `{ session_id, action: 'join'|'leave', user_id? }`. `user_id` marks
somebody else and is council-only. Returns a live `roster` whose minutes accrue against the clock —
safe to poll.

**`closeOperationSession`** *(council)* — `{ session_id, gross_auec?, debrief? }`. **Irreversible;
confirm before calling.** Writes `time_log` shares for members, settles contractors directly, awards
`muster_stood`, records no-shows, notifies everyone.

**`getSessionSummary`** — readable by **anyone who stood the run**, not just the council. Returns
roster, yield, costs, losses, clusters, and once closed the payouts with `outstanding_payouts`.
`yield.suggested_gross_auec` is a **reading, not a decision** — show `yield.basis` beside it.

**`attachToSession`** / **`recordSessionLoss`** *(council)*. Attaching is refused on a settled run.

**`markSessionPayoutPaid`** *(council)* — `{ session_id, user_id, paid?, paid_note? }`. **Refused for
lines with `settles_at_payday: true`** — those are members' shares, settled at pay day and not the
council's to tick. Disable the control for those rows with that explanation.

## 8. Musters

**`callMuster`** *(council)* — `{ op_name?, operation_template_id?, role_slots?, start_now?, … }`.
Pass `operation_template_id` to call a standing muster. **Always call this rather than creating
`crew_operation` directly** — it is what notifies the yard, carries role slots, and prevents a
zero-length run.

**`rsvpOperation`** — `{ operation_id, response: 'in'|'maybe'|'out', role?, note? }`. Returns
`slots`, `waitlisted`, and a `note` written for the comrade — render the note. A full place queues
rather than refusing.

**`standDownOperation`** *(council)* — `{ operation_id, reason }`. Reason required. Refused while a
run is underway.

**`getMusterTimes`** — each comrade's own clock plus a calendar file. Council additionally gets
`best_times` (all 24 hours ranked, each naming who it is **awkward for**) and `respondents`. Show
`your_time_note` where `your_time` is null.

**`getOperationPlan`** *(council)* — expected haul against hull capacity. `haul.fits` and
`haul.trips` are **null** when capacity is unstated; render `haul.note` rather than guessing.

## 9. Instruments

**`listMyInstruments`** — `signed[]` (including withdrawn and superseded, each with the **verbatim**
wording agreed to) and `asked[]` with `what_is_needed` written for the comrade.

**`signInstrument`** / **`withdrawFromInstrument`** / **`publishInstrument`** *(council, requires
`summary_of_changes` on a new version)*.

## 10. The hall

**`browseHall`** — **the ONLY way to read the hall.** `{ lot_id?, scope?: 'open'|'mine'|'watching', limit? }`.
`hall_lot` rows are readable directly ONLY by their seller and the council, precisely so the reserve
cannot be read off the record — every careful refusal message is worthless if the number is one
query away. `browseHall` never returns `reserve_auec` to a non-seller, and returns no "reserve met"
flag either, since that lets it be found by probing. With `lot_id` it also returns the bid history,
which is public: that is what makes the run of bidding checkable.

**`listHallLot`** — refused if the listing agreement is unsigned (409 carries `instrument_id`), the
item is already committed, a commission has suspended them, or the allowance is reached. A lot drawn
from a screenshot needs `extraction_confirmed: true`.

**`bulkDraftHallLots`** — `{ lots: [...] }`, max 50. Everything lands as **drafts**; `rejected[]`
reports per-line failures with reasons. Review as a batch before releasing.

**`placeHallBid`** — returns `next_bid_at_least`, `closes_at`, `close_extended`. **Never display the
reserve.** Bids below it are accepted and simply may not win.

**`watchHallLot`** / **`withdrawHallLot`** / **`relistHallLot`**. Withdrawal is free before any bid
and **council-only with a reason** afterwards (403 tells the seller why).

**`closeHallLots`** — scheduled. **`confirmHallSettlement`** — needs **both** parties.

**`raiseHallDispute`** / **`ruleHallDispute`** *(Owner)* — remedies are `no_action`, `relist`,
`void_sale`, `commission_waived`, `settled_between`. There is deliberately **no refund remedy**.
`touches_standing` is a **separate, deliberate control** — do not derive it from the remedy.

**`offerBuyback`** *(council)* / **`respondToBuyback`** — show `fraction_percent` and
`market_reference_auec` openly; the offer's honesty is the point.

**`settleHallObligation`** *(council)* — `paid` | `waived` | `void`; a reason is required for the
latter two. **`sweepHallObligations`** — scheduled.

## 11. Scheduled jobs — EIGHT, all silent when absent

These need registering as platform automations. **Every one fails invisibly**: the feature simply
never happens, and nothing errors.

| Job | If unregistered |
|---|---|
| `postRecurringTasks` | standing briefs never post |
| `sendMusterReminders` | no muster reminders at all |
| `checkProcessingTimers` | hoppers never announce |
| `expireStaleClaims` | stale claims sit forever |
| `lapseStandingMarks` | marks never lapse — comrades stay penalised |
| `closeHallLots` | **the hall silently does nothing** — no lot ever closes |
| `expireBuybackOffers` | stale offers stay honourable |
| `sweepHallObligations` | no commission is ever chased |
| `escalateStaleReviews` | quiet reviewers are never escalated past |

`closeHallLots` is the worst of these: bids accumulate, nothing is ever won, no commission is raised,
and the hall looks like it works.

## 12. Things that will bite (part II)

- **Never show a lot's reserve.** Not in the bid form, not in a tooltip.
- **The council cannot bid** — hide the bid control for them rather than letting it 403.
- **`suggested_gross_auec`, `best_times`, `haul`, `basis`, `what_is_needed`** are all readings that
  state their own limits. Render the accompanying note; a bare number loses the honesty.
- **Never sum settled and committed labour cost**, or gross and losses.
- **`fits: null` is not `false`.** It means capacity is unstated.
- **Session closeout and lot close are irreversible.** Confirm first.

---

## 13. The visual asset library

Somewhere for bespoke visual work to live, so it does not get hard-coded into whichever component
needed it first.

**`listVisualAssets`** — **readable without an account**, because the storefront is a public front
door.
```
→ { theme?: 'any'|'dark'|'light', family?: string, include_unfilled?: boolean }
← { assets: { [slot_key]: { image_url, alt_text, kind, theme, artist_handle, licence, status,
                            width, height } },
    filled_count, slot_count, note,
    unfilled?: [{ key, family, family_label, value, kind, guidance }], credits? }
```

**`upsertVisualAsset`** *(council)* — `{ slot_key, image_url, alt_text, kind?, theme?,
artist_handle?, licence?, status?, notes? }`, or `{ slot_key, retire: true }`. An unknown
`slot_key` is refused with `did_you_mean`. Replacing a slot retires the previous asset rather than
overwriting it.

### The two rules

- **Every slot degrades.** 89 slots exist; most will be empty for a long time. A slot with no asset
  must render as its absence — never a broken image, never a blank reserved box, and **no figure or
  state may be conveyed by an image alone**. Build the screen so it is complete with nothing loaded,
  then let assets enrich it.
- **Credit the maker.** `artist_handle` comes back with every asset; surface it somewhere a person
  can see, and show `licence` where one is set.

### Slots are derived, not listed

Slot keys come from the app's real enums (`shared/assets.js` imports `TIERS`, `MUSTER_ROLES`,
`NOTICE_KINDS`, `LOT_STATES`, `SKILL_TAGS`, `INSTRUMENT_KINDS` and the entity enums). Add a task
category and its slot appears automatically as unfilled. **Do not hard-code a slot list in the
frontend** — call `listVisualAssets` with `include_unfilled: true` and render what comes back.

Families: `task_category`, `muster_role`, `standing_tier`, `trade_tier`, `skill`, `op_type`,
`lot_item_type`, `lot_state`, `notice_kind`, `instrument_kind`, plus `standalone` (brand mark, hero
banners, empty states, run-underway, payday-published).

`status: 'placeholder'` is served like any other asset but marked — show placeholders as provisional
so nobody mistakes a stand-in for finished work.

**Suggested screen:** a council asset library — the 89 slots grouped by family, each showing what is
in it or an empty frame with its `guidance`, an upload/replace control, and a credits list. That
turns "make the app prettier" into a commissionable list of briefs.

---

## 14. Buyback appraisal — policy moved to the backend (2026-08-03)

`shared/buyback.js` now owns the appraisal. `src/components/apps/management/hall/appraisalMath.js`
should become a thin mirror of it or be deleted, because two copies of a pricing rule is how a haul
comes to be appraised on different terms than the item beside it.

**`offerBuyback` now accepts** `{ market_each_auec, quantity, base_fraction_percent, condition_key }`
and reckons the rest. It records `base_fraction_percent`, `condition_key`, `condition_factor`,
`standing_bonus_percent`, the effective `fraction_percent`, and a written `basis`.

Two corrections to what the calculators were doing:

1. **`fraction_percent` is the EFFECTIVE fraction** — after condition and standing — because it is
   the figure the member is told. A headline 60% while actually paying 45% breaks the one rule the
   feature rests on. Where a council member states a figure outright, the recorded fraction is the
   one that figure genuinely represents.
2. **The standing bonus comes from LABOUR standing**, not `pricing_tier.tier_discount_percent`.
   A storefront buyer discount ("this buyer gets 10% off products") is not a seller's buyback bonus
   ("we pay this seller 10 points more"). They are unrelated, and treating one as the other was a
   category error rather than a generous policy. The bonus is small, bounded, and **never negative**:
   a poor labour record is a matter for the standing ledger, not something taken out of what the
   collective pays a comrade for their own property.

Render `basis` on the offer card — it is the arithmetic in words, and it is what makes an offer
checkable rather than something a member has to take on trust.

---

## 15. Operations and debugging (2026-08-03)

**`runHealthCheck`** *(council)* — `{ deep?: boolean }`. Read-only; it never repairs anything, because
a diagnostic that silently fixes what it finds hides how often it is needed.
```
← { state: 'ok'|'warn'|'critical', headline, counts, findings: [...], sweeps: [...] }
```
Every finding carries `summary`, `what_it_means` and `what_to_do` — **render all three**. A
diagnostic that only says something is wrong hands the reader a second problem.

`deep: true` recomputes every cached standing total from its event log. Slower, and the only way to
catch a drifted cache.

**`traceMember`** *(self, or council for anyone)* — `{ user_id? }`. Answers "why is my standing /
my pay what it is?" by walking the records and **recomputing rather than reading the cache**. If the
two disagree, that appears in `discrepancies` at the top, and it is almost always the answer.

**`sweep_run`** records every scheduled job. The useful signal is the **absence** of recent rows: a
sweep that stops running writes nothing at all. `runHealthCheck.sweeps` reports each job's
`last_run_at`, `silent_hours` and `overdue`.

**`debug_log`** now receives every failure from the sweeps and the money paths, with source, stack
and context. Nothing is thrown by the logger itself — reporting a failure must never cause a second.

**Suggested screen:** a council operations panel — the health verdict as a badge, findings worst
first with their what-to-do, the sweep table with anything overdue highlighted, and recent
`debug_log` entries with a resolve toggle. Plus a member lookup running `traceMember`, which is what
you will actually want the first time somebody says their shares vanished.
