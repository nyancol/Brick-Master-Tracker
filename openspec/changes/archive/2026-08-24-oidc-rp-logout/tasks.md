## 1. Data Model

- [x] 1.1 Add `idToken: string` field to `SessionUser` type in `shared/types.ts`
- [x] 1.2 Update `server/session.d.ts` to include `idToken` in SessionData (or rely on it being part of SessionUser)

## 2. Server-side Auth Changes

- [x] 2.1 Update `handLeCallback()` in `server/auth.ts` to include the raw `id_token` string in the returned `SessionUser` object
- [x] 2.2 Add `buildLogoutUrl()` function in `server/auth.ts` using `client.buildEndSessionUrl()` with `id_token_hint` and `post_logout_redirect_uri` derived from `APP_URL`

## 3. Route Changes

- [x] 3.1 Update `GET /auth/callback` in `server/app.ts` to store `idToken` in `req.session` alongside `user`
- [x] 3.2 Update `GET /auth/logout` in `server/app.ts` to redirect to the OIDC end_session endpoint when `idToken` is available, falling back to local-only logout when it is not

## 4. Configuration

- [x] 4.1 Add note to `.env.example` about registering the post_logout_redirect_uri in the OIDC provider's client settings