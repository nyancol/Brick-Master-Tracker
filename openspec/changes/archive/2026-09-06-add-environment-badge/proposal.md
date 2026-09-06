# Proposal: add-environment-badge

## Why

The three running environments (host dev, preprod, production) are visually indistinguishable — a screenshot or a glance at an open tab cannot tell which instance you are looking at. This has real consequences: preprod is meant for testing flag rollouts before production (see `add-feature-flags`), but nothing on screen says which one you are on. We formalize the demo badge built during that change into a permanent environment indicator: «dev» / «staging» visible in dev and preprod, absent in production.

## What Changes

- Add an `APP_ENV` environment variable carrying the deployment environment identity (`dev` | `staging` | `production`; default `dev` for host-run dev)
- Expose the environment name to the SPA (public, unauthenticated — the login page needs it)
- Add a persistent environment badge UI element (footer, replacing the throwaway flag icon): renders the environment label («dev», «staging») in dev and preprod; renders nothing in production
- Localized badge text in both en and fr
- Remove the `ui-demo-badge` demo flag from the registry and all three flag files (the badge it gated is superseded by this real element; the flag plumbing itself is untouched and remains the template for future features)

Out of scope: changing any flag-infrastructure behavior; styling beyond a footer badge consistent with existing footer furniture; badge on the login page (footer lives in `Home`; login-page display deferred unless trivially cheap).

Visual surfaces in scope: footer badge only. No other visual surfaces change.

## Capabilities

### New Capabilities
- `environment-badge`: Persistent visual indicator of which deployment environment the user is viewing, shown in non-production environments and hidden in production.

### Modified Capabilities
<!-- none — existing capabilities unchanged; feature-flags spec is unaffected (the demo flag's removal does not alter any flag-system requirement) -->

## Impact

- **Server**: read `APP_ENV` in `server/app.ts`; expose it on an existing or new lightweight public endpoint
- **Client**: badge component in the footer (`src/pages/home.tsx`); i18n strings in `src/locales/en.ts` + `fr.ts`
- **Shared**: remove `ui-demo-badge` from `shared/flags.ts`; flag files revert to empty `flags` objects (or hold only future real flags)
- **Deployment**: `APP_ENV=production` in `compose.yaml`, `APP_ENV=staging` in `compose.preprod.yaml`; unset (default dev) for host dev
- **No DB changes; no new dependencies**
