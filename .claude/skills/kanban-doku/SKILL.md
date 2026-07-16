---
name: kanban-doku
description: Tracks work progress, decisions, and milestones for the JLU Design System as cards on this repo's kanban board (kanban-mcp). Use whenever a task is started, the status of an in-progress task changes (e.g. in progress, in review, done), or an interim result/decision should be recorded. Trigger phrases: "put it on the board", "kanban", "create/move a card", "track progress", completing a milestone.
---

# Kanban tracking (kanban-mcp)

This project tracks tasks and progress on a Kanban board in addition to the Markdown docs, so that
across sessions it stays visible what is open / in progress / done.

## Board coordinates (kanban-mcp tools)

- Workspace: `KI` — publicId `o8h0ip5s4bvv`
- Board: `JLU Design System` — publicId `2jndfdkukjwa` (slug `jlu-design-system-components`)

**Lists** (in order) — use these publicIds directly:

| List | publicId | Meaning |
|---|---|---|
| `Backlog` | `ufnbo2903wz6` | Known future work, not scheduled yet |
| `To Do` | `o99qy0x98v5f` | Scheduled, ready to pick up next |
| `Needs Decision` | `rp5lhfs3hdey` | **Blocked on user input** — see rule below |
| `In Progress` | `7u3f8zan9jrk` | **Actively being worked right now** |
| `Code Review` | `t3tanijo46nm` | Finished, awaiting review/verification |
| `Done` | `7ahgbomojvew` | Finished and verified |

**`Needs Decision` rule:** whenever a card is blocked on input only the user can give
(a go/no-go, a scope choice, infrastructure, priorities), move it to `Needs Decision`
instead of leaving it in Backlog/To Do — and **append a "Decision needed:" section to the
card description** stating the concrete question and the options, so the user can decide
asynchronously from the board alone. Once decided, move the card back into the normal flow
and record the decision (with date) in the description.

**Labels** — publicIds:

| Label | publicId |
|---|---|
| `Bug` | `n0ckzznhqef8` |
| `Feature` | `4y9ruxgp2rnw` |
| `Enhancement` | `05bxdlmccgto` |
| `Critical` | `cvmyaopg0mgl` |
| `Documentation` | `cgwfopxy1xt1` |

> If a call fails with a stale-id error (board recreated, lists renamed, etc.), re-resolve:
> `list_workspaces` → the workspace → `get_board` with the board publicId → read the current
> `lists`/`labels` ids, **and update the tables above in this file** so the next session is correct
> again. Do **not** use `find_board_by_name` (throws an internal error on a name mismatch instead of
> a clean "not found"); use `get_board` / `get_board_by_slug`.

## Language

Cards on this board are written in **English** (titles and descriptions).

## The core rule: `In Progress` must mirror reality

**Whenever you are actively working a milestone, exactly that card must be in `In Progress`.**
Concretely, on every substantive task:

1. **Before starting work** — make sure a card exists for it (create one if not) and move it to
   `In Progress` (`update_card` with the `In Progress` list publicId, `index: 0`). If a card
   is already in `In Progress` for the previous task, resolve it first (step 3) — don't leave
   two cards in `In Progress` unless both really are in flight.
2. **While working** — keep interim results/decisions on the card. Update the card **description** to
   capture the "why" of a decision. *(See caveat on comments below.)*
3. **When finishing** — move the card **out of `In Progress`**:
   - → `Code Review` if someone should verify the result first (default for milestones that produce
     an artifact to inspect), **or**
   - → `Done` if it is a small, self-evidently complete step.

**Anti-patterns to actively avoid:**
- Working on something while `In Progress` is empty. If you catch this, move the right card in.
- Leaving a completed task sitting in `To Do`/`Backlog`. If work is done, it belongs in
  `Code Review` or `Done`, never in a pre-start list.
- A card in `In Progress` that nobody is working on. Pausing mid-milestone is fine (it *is* in
  progress) — but a finished one must be moved.

At the start of a session, `get_board` and reconcile before doing new work.

## When to create a card

- A new milestone is started.
- A non-trivial bug or open uncertainty is found that should be tracked beyond this session.

Create in `Backlog` or directly in `To Do` (`create_card`). Title short and concrete
(conventional-commit style, e.g. `feat: ...`, `fix: ...`, matching the board's existing cards);
description with context and a reference to the related doc if any. Attach the right label
(`toggle_card_label`).

## Tooling caveats (verified on this kanban server)

- **`update_label`** may require `colourCode` even when you only want to rename a label.
- Use `update_card` `index: 0` to place a moved card at the **top** of its target list.

## What does not belong on the board

- No secrets/credentials/tokens in card text or comments.
- Nothing the repo's docs mark as off-limits for a hosted third-party service.
