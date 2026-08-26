## 1. Database & Server Changes

- [x] 1.1 Add `username TEXT NOT NULL DEFAULT ''` column to the `users` table in `server/db.ts`
- [x] 1.2 Update `upsertUser` in `server/auth.ts` to extract `preferred_username` from ID token claims, with fallback to slugged `name` claim; pass it as the `username` parameter
- [x] 1.3 Update `getAuthMe` and all user-returning queries (bricks, transfers, stories) to select `u.username` instead of or alongside `u.display_name`, aliased appropriately

## 2. Shared Types & API Layer

- [x] 2.1 Add `username: string` to the `User` interface in `shared/types.ts`
- [x] 2.2 Add `username: string` to `AuthUser` and `UserEntry` in `src/api.ts`

## 3. Frontend Display Changes

- [x] 3.1 Update `src/pages/home.tsx` — change brick holder name display (`holderName`), recipient buttons (`friend.displayName`), and the transfer modal recipient name to use `username`
- [x] 3.2 Update `src/components/ChroniclesView.tsx` — change transfer from/to names and story editor byline to use `username`
- [x] 3.3 Keep `src/pages/home.tsx` header badge (line 94) using `user.displayName` unchanged

## 4. Verification

- [x] 4.1 Verify all `/api/auth/me`, `/api/bricks`, `/api/transfers` responses include `username` fields correctly
- [x] 4.2 Verify the header badge still shows the full display name (first/last)
- [x] 4.3 Verify all other user-name references show the OIDC username