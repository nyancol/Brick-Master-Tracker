## Why

The Brick Master Tracker has 17 API endpoints (bricks, transfers, auth, uploads) with no machine-readable documentation. This makes it difficult for developers to understand the API contract, test endpoints, or integrate with tooling. Adding OpenAPI 3.0 documentation via swagger-jsdoc provides a living, auto-generated spec derived from JSDoc annotations in the route handlers.

## What Changes

- Add `swagger-jsdoc` and `swagger-ui-express` npm dependencies
- Add JSDoc `@openapi` annotations to all 17 route handlers in `server/app.ts`
- Add a new GET `/api-docs` endpoint serving Swagger UI
- Add a new GET `/api-docs.json` endpoint serving the raw OpenAPI spec
- Configure swagger-jsdoc with API metadata (title, version, description, server URL)
- Define shared OpenAPI components (schemas for User, BrickState, Transfer, TransferStory, TransferImage, error responses)
- Mount Swagger UI to serve the interactive documentation

## Capabilities

### New Capabilities
- `api-documentation`: OpenAPI 3.0 spec auto-generated from JSDoc annotations, served via Swagger UI at `/api-docs`, covering all 17 API endpoints with request/response schemas, auth requirements, and error responses.

### Modified Capabilities

None.

## Impact

- **server/app.ts**: Add JSDoc `@openapi` annotations to all route handlers; add swagger-jsdoc initialization and Swagger UI middleware
- **server/index.ts**: Add `/api-docs` and `/api-docs.json` route mounting (or keep in `app.ts` since it's already mounted at `/api`)
- **package.json**: Add `swagger-jsdoc` and `swagger-ui-express` dependencies
- **No breaking changes** to existing API behavior