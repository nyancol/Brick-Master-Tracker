# Design: Seize the Shame

## Context

Today both bricks share one mechanic and one endpoint: `POST /bricks/:color/transfer` (server/app.ts:1034), where the current holder picks a recipient and gives the brick away. The UI mirrors this for both bricks (holder gets a recipient picker, everyone else gets waiting text — src/pages/home.tsx:285–316 and 378–409). Three downstream endpoints authorize story/image operations on `transfer.from_id` (server/app.ts:941, 1389, 1470), which currently equals the actor because only the giver can initiate a transfer.

The exploration settled the law of the new mechanic:

1. The shame cannot be given — only seized (`POST /bricks/blue/seize`, no recipient).
2. Any knight may seize except the bearer; visitors behold.
3. The seizure description is the motive (atonement, honored promise, whim).
4. The relieved holder has no in-app voice — reactions live in marginalia.
5. No anti-ping-pong guard — shame itself deters.
6. The tenure ledger already answers "which knight deserves more shame".
7. The red path is untouched.

## Goals / Non-Goals

**Goals**
- Blue brick changes hands only by seizure: a knight claims it unto themselves.
- Holder of the blue brick loses all agency over it (UI shows waiting text only).
- Taker-authored stories/images remain editable by their author.
- Chronicle, marquee, tenure math, and red-brick flow unchanged.
- Every user-facing string in EN and FR.

**Non-Goals**
- No new chronicle verbs or marquee templates (genesis "forged unto" logic already handles history; seizures render as `from → to`).
- No anti-ping-pong guard or cooldowns.
- No relieved-holder farewell, reaction UI, or notification.
- No changes to marginalia, themes, sounds, or window chrome.

## Decisions

### D1: Separate endpoint `POST /bricks/:color/seize`, not `to = self` on the existing endpoint

Reuse-with-self-recipient would overload the semantics of `to`, complicate the existing validation chain (holder check, self-check, recipient-exists check all point the wrong way), and produce misleading OpenAPI docs. A dedicated endpoint has no recipient parameter, its own guard set, and reads honestly: the operation *is* different.

- Route shape: `POST /bricks/blue/seize` (blue-only path parameter not needed; a generic `:color` route would invite a red "seize" that must then be rejected). Keep it color-specific for clarity, mounted next to the existing transfer route.
- **BREAKING behavior**: the existing `POST /bricks/blue/transfer` must now reject. Implementation: in the transfer handler, after color validation, reject `color === "blue"` with 403 and a distinct message ("The Shame cannot be given — it must be seized"). The red path is untouched.

### D2: Seizure server logic mirrors the transfer transaction, minus recipient selection

Inside `db.transaction()`:

1. Read current blue brick holder.
2. Reject if caller is the holder (403, "Only another knight may seize the Shame").
3. Reject if caller is not a knight (403, same role gate as transfer).
4. Reject if description empty (400, same message as transfer).
5. `UPDATE brick_state SET holder_id = caller`, `INSERT INTO transfer_history (color, from_id, to_id, transferred_by_id, ...)` with `from_id = old holder`, `to_id = transferred_by_id = caller`, `INSERT INTO transfer_story` with caller as `edited_by`, and attach staged images with `uploaded_by = caller` (the taker stages their own images; the existing `UPDATE ... WHERE uploaded_by = ?` clause works unchanged).
6. Return the same BrickState-shaped payload as transfer.

Alternatives considered: reusing the transfer endpoint with `to: self` (rejected — see D1); client-side two-step "transfer then edit" (rejected — no atomicity, wrong authorization).

### D3: Authorization follows the actor (`transferred_by_id`), not the giver (`from_id`)

Switch the three checks (story edit server/app.ts:941, image upload server/app.ts:1389, image deletion server/app.ts:1470) from `transfer.from_id !== userId` to `transfer.transferred_by_id !== userId`.

Rationale: `transferred_by_id` already means "who performed this". For every pre-existing row (red transfers, genesis), the invariant `transferred_by_id = from_id` holds, so no historical behavior changes and no data migration is needed. For seizures, the taker (not the relieved giver) authored the tale and staged the photos, so the actor must retain edit rights. The transfer-story spec's "Story editing by sender only" and transfer-images' "by sender only" requirements are updated accordingly.

Alternatives considered: keep `from_id` checks and also allow `to_id` when the row is a seizure (rejected — two rules where one suffices; the actor column is the natural single source of truth).

### D4: UI — one Seize button, no recipient picker

In SHAME.EXE (src/pages/home.tsx blue column):

- Current blue holder (knight): keep the waiting text; show **no** recipient buttons. Wording moves from "Waiting for {name} to transfer…" to a holder-voiced variant ("The Shame clingeth to thee still…" exists already as the refuse toast; reuse its register for the waiting line).
- Other knights: a single Seize button (no recipient picker). It opens the existing `TransferModal` flow unchanged (description + staged images), with a seize-flavored title string.
- Visitors (non-holders and holder alike): existing behold behavior, unchanged.
- `chroniclesKey` bump, refetch, sfx hook: identical to the transfer flow in `handleTransferConfirm`.

### D5: API client & i18n

- `src/api.ts`: add `seizeBlueBrick(description, imageIds)` calling the new endpoint; reuse the existing error-toast mapping pattern in home.tsx, adding mappings for the two new server messages (holder-cannot-seize, blue-cannot-be-transferred).
- New locale keys in both `en.ts` and `fr.ts`: seize button label, seize modal title, blue-holder waiting line, and error strings. FR register matches the existing medieval FR tone.

### D6: No ping-pong guard, no new signals

Deliberately none. The deterrent is intrinsic (bearing shame again immediately is its own punishment), the negotiation happens off-app, and marginalia remains the venue for judgment. If abuse ever emerges, a cooldown is a small future change.

## Risks / Trade-offs

- [Old clients / stale sessions could still POST blue transfer] → server rejects authoritatively; the client change is cosmetic in comparison.
- [Ping-pong seizures between two knights] → accepted per the law: shame itself deters; social contract of three knights.
- [`transferred_by_id` semantics silently drift] → add a task to verify the invariant claim on the real DB shape (`transferred_by_id = from_id` for all existing rows) before flipping the three checks, using a scratch DB fixture per the repo's UX testing conventions.
- [Two buttons-modals paths to maintain (bestow vs seize)] → both reuse `TransferModal`; only the confirm handler and titles differ.
- [Bundled "blue transfer" usage anywhere unaccounted for] → grep for `transferBrick(` and `bricks/blue/transfer` during implementation; the only caller today is home.tsx.

## Migration Plan

1. Ship server changes (new seize endpoint, blue-transfer rejection, three authorization flips) — backward compatible: old clients lose only the ability to offload blue, which is the intended breaking change.
2. Ship client changes in the same release (single-process deployment; `pnpm build` produces both).
3. Rollback: revert commit; no schema or data changes to undo — seizure rows are ordinary `transfer_history` rows and remain valid history (plain `from → to`) if the feature is reverted.
4. Bump `package.json` minor version (new route + behavior change).

## Open Questions

None — all were settled during exploration (endpoint shape, no voice for the relieved holder, no guard, chronicle untouched).
