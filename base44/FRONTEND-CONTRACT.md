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
