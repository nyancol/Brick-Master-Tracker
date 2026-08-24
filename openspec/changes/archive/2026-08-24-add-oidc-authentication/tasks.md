## 1. Dependencies and Configuration

- [x] 1.1 Add `express-session`, `better-sqlite3-session-store`, and `openid-client` to package.json
- [x] 1.2 Add `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URL`, `OIDC_OWNER_RED`, `OIDC_OWNER_BLUE`, `SESSION_SECRET` to `.env.example`
- [x] 1.3 Create shared type definitions for User, SessionUser, and API response types in `shared/types.ts`

## 2. Database Schema Changes

- [x] 2.1 Create `users` table (id INTEGER PK, sub TEXT UNIQUE, email TEXT NOT NULL, display_name TEXT NOT NULL, avatar_url TEXT, created_at INTEGER)
- [x] 2.2 Create `sessions` table for express-session SQLite store
- [x] 2.3 Migrate `brick_state`: add `holder_id INTEGER REFERENCES users(id)`, populate from legacy `holder` TEXT via user name matching, drop `holder` TEXT column
- [x] 2.4 Migrate `transfer_history`: add `from_id`, `to_id`, `transferred_by_id` FK columns, populate from legacy `from_holder`/`to_holder` TEXT, drop old TEXT columns
- [x] 2.5 Add initial brick ownership bootstrap logic: on empty DB, after user creation during login, check `OIDC_OWNER_RED`/`OIDC_OWNER_BLUE` env vars and assign bricks

## 3. OIDC Authentication Server

- [x] 3.1 Create `server/auth.ts` with OIDC client initialization, provider discovery, and utility functions (generate state, exchange code, verify ID token, upsert user)
- [x] 3.2 Add `GET /api/auth/login` — redirect to OIDC provider authorization endpoint
- [x] 3.3 Add `GET /api/auth/callback` — handle callback, exchange code, upsert user, create session, redirect to SPA
- [x] 3.4 Add `GET /api/auth/logout` — destroy session, clear cookie, redirect to SPA
- [x] 3.5 Add `GET /api/auth/me` — return current user info and full users list (or 401)
- [x] 3.6 Add session middleware (express-session with SQLite store) to Express app

## 4. Transfer Authorization

- [x] 4.1 Add auth guard middleware to `POST /api/bricks/:color/transfer` — reject with 401 if no session
- [x] 4.2 Enforce holder-only authorization — reject with 403 if `session.user.id !== brick.holder_id`
- [x] 4.3 Validate transfer target is a valid user_id in the users table
- [x] 4.4 Record `transferred_by_id` in new transfer_history rows
- [x] 4.5 Update transfer response to include `holderId`, `holderName`, `holderAvatarUrl`

## 5. Updated API Responses

- [x] 5.1 Update `GET /api/bricks` to JOIN users table and return `holderId`, `holderName`, `holderAvatarUrl` per brick
- [x] 5.2 Update `GET /api/transfers` to JOIN users table and return `fromId`/`fromName`, `toId`/`toName`, `transferredById`/`transferredByName` per transfer

## 6. Client: Auth State and Login

- [x] 6.1 Add `useCurrentUser()` hook in `src/api.ts` — fetches `GET /api/auth/me`, returns `{ user, users, loading, error, refetch }`
- [x] 6.2 Create `src/pages/login.tsx` — login page with "Sign in with OIDC" button that redirects to `/api/auth/login`
- [x] 6.3 Update `src/App.tsx` — on mount, check `useCurrentUser()`, render login page if unauthenticated (checking callback), render Home if authenticated
- [x] 6.4 Add user indicator and logout button to the home page header
- [x] 6.5 Update `src/pages/home.tsx` — show transfer buttons only when current user is holder, use dynamic user list for targets, show "Waiting for X" when not holder

## 7. Cleanup

- [x] 7.1 Remove `FRIENDS` array and `Friend` type from `shared/constants.ts`
- [x] 7.2 Remove or redirect all client-side references to `FRIENDS`
- [x] 7.3 Run `pnpm typecheck` and fix any remaining type errors