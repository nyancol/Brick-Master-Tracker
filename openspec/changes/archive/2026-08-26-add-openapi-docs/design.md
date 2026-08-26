## Context

The application is a single Express 5 process that serves both a React SPA and a REST API. All 17 API endpoints are defined inline in `server/app.ts` with no separate controllers or models. The API currently has zero documentation infrastructure — no Swagger, no OpenAPI, no API blueprint. The shared types are defined in `shared/types.ts` and mirrored with slight differences in `src/api.ts`.

## Goals / Non-Goals

**Goals:**
- Generate OpenAPI 3.0 spec from JSDoc annotations on route handlers using `swagger-jsdoc`
- Serve interactive Swagger UI at `GET /api/api-docs` and raw spec at `GET /api/api-docs.json`
- Define reusable OpenAPI components (schemas) matching the existing shared types
- Cover all 17 existing endpoints with request parameters, request bodies, response schemas, and error responses
- Exclude swagger-ui-express from the production bundle via esbuild externals to keep size minimal

**Non-Goals:**
- Not changing any existing API behavior or response shapes
- Not generating a static OpenAPI YAML/JSON file (spec is generated at runtime)
- Not adding API versioning or deprecation
- Not adding authentication flows to the OpenAPI spec (OIDC flow is external; docs will note auth requirement)

## Decisions

1. **swagger-jsdoc over manual YAML/JSON**: JSDoc annotations live alongside route handler code, reducing drift between implementation and documentation. `swagger-jsdoc` parses the annotations at runtime and produces the spec object. Manual YAML files would require a separate edit for every API change.

2. **swagger-ui-express over ReDoc or custom UI**: `swagger-ui-express` is the standard drop-in middleware for Express, requires zero configuration beyond passing the spec object, and provides the familiar Swagger UI interface.

3. **Runtime generation over build-time generation**: The spec is generated once when the server starts (not on every request) by calling `swaggerJsdoc()`. This avoids build complexity and keeps the spec always in sync with the running code. The `swagger-ui-express` middleware serves the UI and the raw spec endpoint (`/api-docs.json`) is served separately.

4. **API base path `/api`**: In production, routes are mounted under `/api`. The OpenAPI spec's `servers[0].url` will be set dynamically to `/api` so that Swagger UI's "Try it out" URLs are correct. The swagger-jsdoc `apis` glob pattern targets `server/app.ts` only.

5. **Schemas as `@openapi/components/schemas` annotations**: Rather than maintaining a separate schema file, each shared type (User, BrickState, etc.) will be defined once at the file level via `@openapi components/schemas` blocks. Route handlers reference these schemas via `$ref`.

6. **Route namespace organization**: Tags will group endpoints: `Health`, `Authentication`, `Bricks`, `Transfers`, `Uploads`. This mirrors the logical grouping in the codebase and makes the Swagger UI sidebar navigable.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| JSDoc annotations grow stale if route handlers change without updating comments | Code review practice; the annotations are right above each handler so drift is visible |
| `swagger-ui-express` adds frontend assets (CSS, JS) to the server bundle | Exclude it in esbuild config (`--external:swagger-ui-express`); it's resolved from node_modules at runtime |
| Swagger UI exposes API surface in production | Can be gated behind `NODE_ENV !== "production"` or auth middleware if desired; start with no restriction since the API is already public for most endpoints |
| OpenAPI spec may be large with 17 endpoints | Acceptable; spec generation is a one-time startup cost, not per-request |
| `@openapi` YAML in JSDoc strings is verbose | Worth the trade-off for co-location with handlers; consider extracting schemas to a separate annotated file if it becomes unwieldy