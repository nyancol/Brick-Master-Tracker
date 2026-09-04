# Proposal: Seize the Shame

## Why

The Blue Brick of Shame currently works like the Red Brick of Honor: its holder chooses a victim and offloads the curse. That is backwards — a shame that can be handed away at a moment of the bearer's choosing is not a shame, it is a weapon. A curse cannot be given; it can only be claimed by another. Inverting the mechanic makes the two bricks true mirror images: honor is *bestowed*, shame is *seized* — and the relieved holder's great satisfaction becomes the emotional payoff of every seizure.

## What Changes

- **BREAKING** `POST /bricks/blue/transfer` no longer works for the blue brick: the current holder can no longer give the shame away. The endpoint SHALL reject seizures-of-convenience (blue transfers initiated by the holder).
- New endpoint `POST /bricks/blue/seize`: any authenticated knight **except the current holder** claims the shame unto themselves. No recipient parameter — the caller becomes the holder. Description (the motive: atonement, honored promise, whim) and optional staged images required, same transaction semantics as the existing transfer.
- SHAME.EXE UI inversion: the blue holder sees no action buttons, only the waiting text ("The Shame clingeth to thee still"). Every other knight sees a single **Seize** button (no recipient picker). Non-holder visitors remain behold-only.
- Story and image rights follow the actor, not the giver: `PUT /transfers/:id/story`, `POST /transfers/:id/images`, and `DELETE /api/transfers/:id/images/:imageId` authorize on `transferred_by_id` instead of `from_id`. For all existing rows (red transfers, genesis) the invariant `transferred_by_id = from_id` holds, so behavior is unchanged for history; for seizures the taker can edit their own tale.
- No anti-ping-pong guard: shame itself deters — who was just freed will not soon re-curse themselves.
- The relieved holder gets no in-app voice: reactions live in chronicle marginalia (existing feature, untouched).
- Chronicle, marquee, tenure ledger, and the entire red-brick path remain untouched. The chronicle needs no new verb: "forged unto" applies only to genesis rows, and a seizure renders as the plain `from → to` passage it is.

## Capabilities

### New Capabilities
- `shame-seizure`: The seizure mechanic for the Brick of Shame — the dedicated seize endpoint, who may seize and when, the UI inversion (holder waits, everyone else seizes), and the fate of the old blue transfer path.

### Modified Capabilities
- `authorized-transfers`: The "only holder can transfer" requirement becomes red-brick-only; holder-initiated blue transfers are rejected. Seizure attribution and the seizure transaction requirements are owned by `shame-seizure`.
- `transfer-story`: Story editing authorization changes from the transfer's sender (`from_id`) to the transfer's actor (`transferred_by_id`).
- `transfer-images`: Image upload and deletion authorization changes from the transfer's sender (`from_id`) to the transfer's actor (`transferred_by_id`).

## Impact

- **Server** (`server/app.ts`): new `POST /bricks/:color/seize` (or blue-only variant); blue-transfer rejection in the existing endpoint; three authorization checks switch from `from_id` to `transferred_by_id`; OpenAPI annotations for the new endpoint.
- **Client** (`src/pages/home.tsx`, `src/api.ts`, `src/components/TransferModal.tsx`): Seize button + modal flow without recipient selection; API hook for seizure; error mapping for new server messages.
- **Locales** (`src/locales/en.ts`, `fr.ts`): new strings for the seize button, modal title, and waiting text variant — every user-facing string in both languages.
- **Database**: no schema change. `transfer_history` gains seizure rows where `transferred_by_id = to_id`; existing columns suffice.
- **Chronicles / marquee / tenure**: no changes required.
- **Visual surfaces out of scope**: chronicle marginalia, theme, window chrome, sound effects, marquee copy, tenure ledger rendering — none are modified by this change beyond inheriting seizure rows as ordinary transfers.
