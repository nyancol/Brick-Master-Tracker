## 1. Server: dev login infrastructure

- [x] 1.1 Add `isDevLoginEnabled()` helper and `DEV_TEST_USERS` constant to `server/auth.ts`
- [x] 1.2 Export `seedDevUsers()` from `server/auth.ts` that upserts the three test users via `upsertUser`
- [x] 1.3 Add `bootstrapDevBricks()` to `server/auth.ts` that assigns red→Yann, blue→Thomas when `brick_state` is empty

## 2. Server: dev login routes

- [x] 2.1 Register `GET /api/auth/dev` route in `server/app.ts` returning `{ enabled, users }` (always registered, empty list when disabled)
- [x] 2.2 Register `POST /api/auth/dev/login` route in `server/app.ts`, guarded by `isDevLoginEnabled()`, calling `getAuthMe` on success
- [x] 2.3 Call `seedDevUsers()` and `bootstrapDevBricks()` from `server/app.ts` startup when dev login enabled

## 3. Client: dev login types and API

- [x] 3.1 Add `DevLoginInfo`, `DevUserEntry` types to `src/api.ts`
- [x] 3.2 Add `fetchDevLoginConfig()` and `devLogin()` functions to `src/api.ts`

## 4. Client: login page test-user picker

- [x] 4.1 Update `src/pages/login.tsx` to fetch dev config on mount and render test-user buttons when `enabled`; call `devLogin` then reload on click

## 5. Documentation

- [x] 5.1 Update `.env.example` with `DEV_LOGIN` documentation
- [x] 5.2 Update `README.md` with dev test-user workflow section

## 6. Verification

- [x] 6.1 Run `pnpm typecheck` to ensure no TypeScript errors
- [x] 6.2 Dev smoke test: `pnpm dev`, verify picker shows, login as each test user, transfer bricks