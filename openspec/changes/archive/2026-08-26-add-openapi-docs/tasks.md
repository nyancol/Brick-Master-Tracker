## 1. Setup Dependencies

- [x] 1.1 Install `swagger-jsdoc` and `swagger-ui-express` npm packages with their type definitions
- [x] 1.2 Add `swagger-ui-express` to esbuild external list in `build-server.mjs` (already covered by `packages: "external"`)

## 2. OpenAPI Configuration

- [x] 2.1 Add `@openapi` definition block at top of `server/app.ts` with API metadata (title, version, description, server URL `/api`)
- [x] 2.2 Define `components/schemas` for `User`, `BrickState`, `Transfer`, `TransferStory`, `TransferImage`, and `Error` types
- [x] 2.3 Define `components/securitySchemes` with `cookieAuth` apiKey scheme
- [x] 2.4 Define OpenAPI tags: `Health`, `Authentication`, `Bricks`, `Transfers`, `Uploads`
- [x] 2.5 Initialize swagger-jsdoc with `apis` glob pointing to `server/app.ts` and export the spec object

## 3. Annotate Health and Authentication Endpoints

- [x] 3.1 Add `@openapi` annotation for `GET /healthz` (tag: Health)
- [x] 3.2 Add `@openapi` annotation for `GET /auth/login` (tag: Authentication)
- [x] 3.3 Add `@openapi` annotation for `GET /auth/callback` (tag: Authentication) with query params `code`, `state`
- [x] 3.4 Add `@openapi` annotation for `GET /auth/logout` (tag: Authentication)
- [x] 3.5 Add `@openapi` annotation for `GET /auth/me` (tag: Authentication) with 200 and 401 responses
- [x] 3.6 Add `@openapi` annotation for `GET /auth/dev` (tag: Authentication)
- [x] 3.7 Add `@openapi` annotation for `POST /auth/dev/login` (tag: Authentication) with request body

## 4. Annotate Bricks and Transfers Endpoints

- [x] 4.1 Add `@openapi` annotation for `GET /bricks` (tag: Bricks)
- [x] 4.2 Add `@openapi` annotation for `GET /transfers` (tag: Transfers)
- [x] 4.3 Add `@openapi` annotation for `GET /transfers/{id}/story` (tag: Transfers)
- [x] 4.4 Add `@openapi` annotation for `PUT /transfers/{id}/story` (tag: Transfers) with security
- [x] 4.5 Add `@openapi` annotation for `POST /bricks/{color}/transfer` (tag: Transfers) with security

## 5. Annotate Uploads Endpoints

- [x] 5.1 Add `@openapi` annotation for `POST /uploads/staging` (tag: Uploads) with file upload body and security
- [x] 5.2 Add `@openapi` annotation for `DELETE /uploads/staging/{id}` (tag: Uploads) with security
- [x] 5.3 Add `@openapi` annotation for `POST /transfers/{id}/images` (tag: Uploads) with file upload body and security
- [x] 5.4 Add `@openapi` annotation for `DELETE /transfers/{id}/images/{imageId}` (tag: Uploads) with security
- [x] 5.5 Add `@openapi` annotation for `GET /uploads/{filename}` (tag: Uploads) with security

## 6. Mount Swagger UI Middleware

- [x] 6.1 Import and mount `swagger-ui-express` middleware at `/api-docs` in `server/app.ts`, passing the generated spec
- [x] 6.2 Serve raw OpenAPI spec JSON at `GET /api-docs.json` in `server/app.ts`
- [x] 6.3 Verify the build and dev server start successfully with the new dependencies

## 7. Update README API Documentation

- [x] 7.1 Replace the hardcoded "## API Routes" table and "Transfer flow" sequence diagram in `README.md` with a reference to the OpenAPI spec, linking to Swagger UI at `/api/api-docs` for both dev (`http://localhost:5173/api/api-docs`) and production