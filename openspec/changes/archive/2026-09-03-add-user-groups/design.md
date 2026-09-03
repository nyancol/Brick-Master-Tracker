## Context

Every logged-in user is currently a full participant: the transfer recipient picker lists all users (`/api/auth/me` → `users`), the Ledger of Tenure lists all users with zero-tenure "0d" rows (`src/pages/home.tsx:42` `buildLedgerRows`), and the only server-side transfer guards are `requireAuth` plus "you must be the holder" (`server/app.ts:1043`). There is no group/role concept anywhere; the OIDC scope is `openid profile email` (`server/auth.ts:64`) and only `sub`, `email`, `name`, `picture`, `preferred_username` claims are consumed (`server/auth.ts:114-128`).

Sessions hold only `{id, email}`; all profile data is re-fetched from the `users` table per request, and `upsertUser` (`server/auth.ts:136`) refreshes claims on every login. Dev login seeds three hardcoded users (`DEV_TEST_USERS`, `server/auth.ts:231`).

Group membership comes from the OIDC provider (Pocket ID): the two groups are « Les Visiteurs » and « Les Chevaliers de l'Amitié ». Decisions settled during exploration: strict block (no grandfathered handoff), history-based ledger membership, friendly visitor banner, env-configured group names.

## Goals / Non-Goals

**Goals:**
- Derive a `role` (`knight` | `visitor`) from the OIDC `groups` claim at login and persist it on `users`.
- Enforce participation: only knights transfer, only knights receive; visitors are observers.
- Keep the Ledger of Tenure history-faithful: tenure derived from `transfer_history` remains visible regardless of current role.
- Make the visitor experience explicit and friendly (banner, role badge, filtered recipient picker).
- Make group names operational config (env), not code.

**Non-Goals:**
- No re-architecting of sessions or auth middleware (session payload stays `{id, email}`).
- No role checks on story/image editing — those stay sender-based (a demoted knight may still edit chronicles of transfers they sent while a knight).
- No live re-sync of roles mid-session (role refreshes only at login, like every other claim).
- No admin UI for role management (roles are managed at the OIDC provider).
- No i18n of the two group names themselves — they are provider data, not UI copy; UI copy around roles is localized (en/fr).

## Decisions

### D1: Single `role` column, not a groups join table
`users.role TEXT NOT NULL DEFAULT 'knight' CHECK (role IN ('knight','visitor'))` via `ALTER TABLE` + backfill (same pattern as the `username` column, `server/db.ts:35-38`). Two fixed, mutually exclusive participation states don't justify many-to-many. **Alternative considered**: storing raw groups JSON — rejected: unbounded surface area, no current need.

### D2: Derive role in `upsertUser` from the ID-token `groups` claim
- Request `groups` in the scope list (`server/auth.ts:64`) — Pocket ID exposes group memberships via the `groups` claim.
- Mapping: groups ∩ `OIDC_GROUP_KNIGHTS` → `knight`; else groups ∩ `OIDC_GROUP_VISITORS` → `visitor`; else → `visitor` (secure default). Knight wins on both-membership.
- Unrecognized/missing claim → `visitor` **plus a server-side warning log** naming the user and raw groups received, so provider misconfig is diagnosable.
**Alternative considered**: defaulting unknown to `knight` to avoid lockouts — rejected: silently granting participation on misconfig is the worse failure; the freeze is visible and recoverable (see Risks).

### D3: Strict block lives in the transfer endpoint's role check
Order of guards in `POST /bricks/:color/transfer`: authenticated (401) → session user's role must be `knight` (403, "Only knights can transfer…") → holder check (403, unchanged) → self-check (400) → recipient must be `knight` (400, "Recipient is not a knight") → rest unchanged. Because only the holder can transfer, checking the *session user's* role covers the demoted-holder case without a separate lookup asymmetry. Role is read from the `users` row fetched for the request (pattern already used for profile data).
**Alternative considered**: grandfathered handoff for demoted holders — rejected by product decision: no guarantee the intended recipient wasn't demoted too; recovery is a provider-level fix + re-login.

### D4: Ledger membership = has tenure OR is knight
`buildLedgerRows` (`src/pages/home.tsx:42`) currently joins tenure map with ALL users. New rule: include a user if their id appears in the brick's derived tenure map (any tenure, from `computeTenures`) **or** `user.role === 'knight'`. Consequences: zero-tenure visitors vanish (previously shown "0d"); former knights' history stays visible; a demoted current holder keeps ticking live (self-diagnosing freeze). Server responses need no change beyond `role` on users — filtering stays client-side, matching the existing derivation architecture.

### D5: Role exposure via existing payloads
`/api/auth/me` `user` + `users[]` gain `role`; `GET /api/auth/dev` users gain `role`; `SessionUser` type gains `role` in `shared/types.ts` (session storage itself unchanged — role always re-read from DB). Transfer recipient picker and dev picker filter/badge from these payloads.

### D6: Env-configured group names
`OIDC_GROUP_KNIGHTS` (default `Les Chevaliers de l'Amitié`), `OIDC_GROUP_VISITORS` (default `Les Visiteurs`), optional, documented in `.env.example`. Matching is exact string equality against claim entries — the Pocket ID group names must match the env values precisely (accents matter: "Chevaliers", no circumflex). **Alternative considered**: hardcoded names — rejected: survives provider-side renames without redeploy.

### D7: Dev users carry roles
`DEV_TEST_USERS` becomes a list of `{username, displayName, role}`: yann/anselme/thomas → `knight`, new `salma` → `visitor`. Dev seeding/upsert passes role through the same `upsertUser` path so dev and OIDC behave identically. Dev picker buttons get a localized role badge.

### D8: Visitor banner + header badge
- Banner on home for `role === 'visitor'`: friendly copy, en: "Visitors watch as the Knights of Friendship carry the brick." / fr: « Les Visiteurs regardent, les Chevaliers portent la brique. » — final wording at implementation, must exist in both locales.
- Header badge shows localized role ("Knight"/"Chevalier", "Visitor"/"Visiteur") next to the display name (which keeps using `displayName` per the username change).
- Transfer modal: recipient picker lists knights only (client-side filter on `users`).

## Risks / Trade-offs

- [Brick freeze on demoted holder] → Strict block can strand the brick with a visitor holder. Mitigation: tenure keeps ticking visibly (freeze is self-diagnosing); recovery is documented (fix group in Pocket ID → user re-logs in → role refreshed → transfer resumes). Accepted by product decision.
- [Stale role mid-session] → Group changes at the provider don't apply until re-login; a demoted holder can still *view* as before (harmless) but retains knight privileges server-side until re-login. Mitigation: sessions are short (7 days); accepted as consistent with existing claim-refresh semantics.
- [Missing `groups` claim from provider] → All users silently become visitors on next login. Mitigation: server warning log on unrecognized groups; role visible in header badge; spike task verifies Pocket ID emits `groups` before rollout.
- [Exact-match group names] → Accents/spelling mismatches (`Chôvaliers` vs `Chevaliers`) demote everyone. Mitigation: env config so names can be corrected without redeploy; warning log surfaces raw claim values.
- [Ledger "0d" rows shrink] → Zero-tenure visitors no longer listed; the ledger may look shorter. Intended behavior per history-based membership decision.

## Migration Plan

1. Ship `role` column migration + backfill (`knight`) — non-breaking, all existing users keep participating.
2. Add env vars to `.env.example`; operators create the two groups in Pocket ID, assign members, and ensure the OIDC client requests/allows the `groups` claim (spike task first).
3. Deploy new code; roles refresh at each user's next login. Before that first login, backfilled roles apply (knights unaffected).
4. Rollback: env vars removed → everyone logs in as visitor → freeze risk; rollback strategy is to revert the deploy (column is harmless when unused).

## Open Questions

- ~~Confirm Pocket ID `groups` claim behavior~~ **Resolved (spike, 2026-09-03)**: the live instance (`pocketid.patates.club`) advertises `groups` in both `scopes_supported` and `claims_supported` of its discovery document. Pocket ID emits group memberships in the token only when the client requests the `groups` scope — the app sends it in the authorization request, and the OIDC client config in Pocket ID admin must have the `groups` scope enabled. Exact group names must match the env values (accents matter: « Les Chevaliers de l'Amitié » / « Les Visiteurs »).
