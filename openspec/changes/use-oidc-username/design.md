## Context

The app currently stores a single display name per user from the OIDC `name` claim and uses it everywhere — header badge, brick holder labels, transfer history, recipient buttons. The OIDC provider (Pocket ID) also exposes a `preferred_username` claim that serves as a stable, unique handle. Users should be identified by this username in most contexts, while the full display name (first/last) remains in the header to show who is logged in.

## Goals / Non-Goals

**Goals:**
- Store the OIDC `preferred_username` in a new `users.username` column.
- Show `username` in brick holders, transfer history, recipient buttons, and transfer modal.
- Keep `displayName` in the top-right header badge.
- Backfill existing users with a sensible username (use their current `displayName` lowercased/slugged or email prefix).
- Expose both `username` and `displayName` in all API responses.

**Non-Goals:**
- No changes to the OIDC auth flow beyond extracting `preferred_username`.
- No re-architecting of the session or auth middleware.
- No user-facing settings to edit username or display name.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Claim to use** | `preferred_username` | Pocket ID exposes `preferred_username` as the user's chosen username. Falls back to `name` claim if absent. |
| **DB migration** | ALTER TABLE ADD COLUMN with backfill in `upsertUser` | Simpler than a standalone migration script. Existing users get a username on their next OIDC login. |
| **Fallback for existing users** | Use `displayName` lowercased with spaces replaced by `-` | Ensures every existing user gets a non-null username without manual intervention. |
| **Frontend prop** | Add `username` to shared `User`/`AuthUser`/`UserEntry` types | All components already consume these types; swapping the displayed field is a one-line change per component. |
| **Header badge** | Keeps using `user.displayName` | Only location where the friendly name is desired per requirements. |

## Risks / Trade-offs

- **Risk**: An existing user might have a `displayName` that, when slugged, collides with another user's `preferred_username`. → **Mitigation**: The `preferred_username` from OIDC is already unique per the provider. The fallback path (existing users without a `preferred_username` in the DB yet) uses slugged `displayName`, and collisions are extremely unlikely in a small private app. If one occurs, it will be caught on first login post-migration when the user's OIDC login provides the actual `preferred_username`.
- **Trade-off**: Two name fields instead of one adds minor complexity to queries and types. Worth it for the semantic clarity of having a stable handle vs. a friendly name.