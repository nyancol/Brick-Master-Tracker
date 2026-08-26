## ADDED Requirements

### Requirement: OpenAPI spec is generated from JSDoc annotations
The system SHALL use `swagger-jsdoc` to parse JSDoc `@openapi` annotations in `server/app.ts` and produce an OpenAPI 3.0 specification object at server startup.

#### Scenario: Spec generation on startup
- **WHEN** the Express server starts
- **THEN** `swagger-jsdoc` SHALL parse `@openapi` blocks from `server/app.ts`
- **THEN** the resulting OpenAPI spec object SHALL contain all annotated endpoints

### Requirement: Swagger UI is served at GET /api/api-docs
The system SHALL serve Swagger UI at the path `/api/api-docs` using `swagger-ui-express` middleware, displaying the generated OpenAPI specification.

#### Scenario: Swagger UI loads in browser
- **WHEN** a browser navigates to `GET /api/api-docs`
- **THEN** the response SHALL be an HTML page rendering Swagger UI
- **THEN** Swagger UI SHALL display all documented API endpoints

### Requirement: Raw OpenAPI spec is served at GET /api/api-docs.json
The system SHALL serve the raw OpenAPI specification as JSON at the path `/api/api-docs.json`.

#### Scenario: Raw spec endpoint returns valid OpenAPI
- **WHEN** a client requests `GET /api/api-docs.json`
- **THEN** the response SHALL have content-type `application/json`
- **THEN** the response body SHALL be a valid OpenAPI 3.0 document

### Requirement: All 17 API endpoints are documented
Every existing API endpoint SHALL have a `@openapi` JSDoc block that specifies the HTTP method, path, parameters, request body (if applicable), response schemas, and authentication requirements.

#### Scenario: Health endpoint is documented
- **WHEN** `GET /healthz` is annotated
- **THEN** the spec SHALL show method `GET`, path `/healthz`, and response `200 { status: "ok" }`

#### Scenario: Auth login endpoint is documented
- **WHEN** `GET /auth/login` is annotated
- **THEN** the spec SHALL show method `GET`, path `/auth/login`, and response `302` redirect

#### Scenario: Auth callback endpoint is documented
- **WHEN** `GET /auth/callback` is annotated
- **THEN** the spec SHALL show method `GET`, path `/auth/callback`, response `302` redirect, and query parameters `code`, `state`

#### Scenario: Auth logout endpoint is documented
- **WHEN** `GET /auth/logout` is annotated
- **THEN** the spec SHALL show method `GET`, path `/auth/logout`, and response `302` redirect

#### Scenario: Auth me endpoint is documented
- **WHEN** `GET /auth/me` is annotated
- **THEN** the spec SHALL show method `GET`, path `/auth/me`, response `200` with User schema, and response `401` for unauthenticated

#### Scenario: Auth dev endpoint is documented
- **WHEN** `GET /auth/dev` is annotated
- **THEN** the spec SHALL show method `GET`, path `/auth/dev`, and response `200`

#### Scenario: Auth dev login endpoint is documented
- **WHEN** `POST /auth/dev/login` is annotated
- **THEN** the spec SHALL show method `POST`, path `/auth/dev/login`, request body with `username`, and response `200` with user data

#### Scenario: Bricks endpoint is documented
- **WHEN** `GET /bricks` is annotated
- **THEN** the spec SHALL show method `GET`, path `/bricks`, and response `200` with an array of BrickState schemas

#### Scenario: Transfers list endpoint is documented
- **WHEN** `GET /transfers` is annotated
- **THEN** the spec SHALL show method `GET`, path `/transfers`, and response `200` with an array of Transfer schemas

#### Scenario: Transfer story read endpoint is documented
- **WHEN** `GET /transfers/:id/story` is annotated
- **THEN** the spec SHALL show method `GET`, path `/transfers/{id}/story`, path parameter `id`, and response `200` with TransferStory schema

#### Scenario: Transfer story update endpoint is documented
- **WHEN** `PUT /transfers/:id/story` is annotated
- **THEN** the spec SHALL show method `PUT`, path `/transfers/{id}/story`, path parameter `id`, request body with `description`, security requirement for authentication, and response `200`

#### Scenario: Brick transfer endpoint is documented
- **WHEN** `POST /bricks/:color/transfer` is annotated
- **THEN** the spec SHALL show method `POST`, path `/bricks/{color}/transfer`, path parameter `color`, request body with `to`, `description`, `imageIds`, security requirement for authentication, and response `200`

#### Scenario: Staging image upload endpoint is documented
- **WHEN** `POST /uploads/staging` is annotated
- **THEN** the spec SHALL show method `POST`, path `/uploads/staging`, request body with file upload, security requirement for authentication, and response `200`

#### Scenario: Staging image delete endpoint is documented
- **WHEN** `DELETE /uploads/staging/:id` is annotated
- **THEN** the spec SHALL show method `DELETE`, path `/uploads/staging/{id}`, path parameter `id`, security requirement for authentication, and response `200`

#### Scenario: Transfer image upload endpoint is documented
- **WHEN** `POST /transfers/:id/images` is annotated
- **THEN** the spec SHALL show method `POST`, path `/transfers/{id}/images`, path parameter `id`, request body with file upload, security requirement for authentication, and response `200`

#### Scenario: Transfer image delete endpoint is documented
- **WHEN** `DELETE /transfers/:id/images/:imageId` is annotated
- **THEN** the spec SHALL show method `DELETE`, path `/transfers/{id}/images/{imageId}`, path parameters `id` and `imageId`, security requirement for authentication, and response `200`

#### Scenario: Uploaded file serve endpoint is documented
- **WHEN** `GET /uploads/:filename` is annotated
- **THEN** the spec SHALL show method `GET`, path `/uploads/{filename}`, path parameter `filename`, security requirement for authentication, and response `200` with binary content

### Requirement: Shared OpenAPI schemas are defined as components
The system SHALL define reusable OpenAPI schemas as `@openapi components/schemas` for `User`, `BrickState`, `Transfer`, `TransferStory`, `TransferImage`, and `Error` types.

#### Scenario: Schemas are available in components
- **WHEN** the OpenAPI spec is generated
- **THEN** it SHALL contain a `components/schemas` section
- **THEN** it SHALL include `User`, `BrickState`, `Transfer`, `TransferStory`, `TransferImage`, and `Error` schemas
- **THEN** route handlers SHALL reference these schemas via `$ref: "#/components/schemas/<SchemaName>"`

### Requirement: Endpoints are grouped by tags
The OpenAPI spec SHALL group endpoints using tags: `Health`, `Authentication`, `Bricks`, `Transfers`, `Uploads`.

#### Scenario: Tags appear in spec
- **WHEN** the OpenAPI spec is generated
- **THEN** the `tags` array SHALL contain `Health`, `Authentication`, `Bricks`, `Transfers`, `Uploads`
- **THEN** each endpoint SHALL reference its corresponding tag

### Requirement: Authentication endpoints indicate security
Endpoints protected by `requireAuth` middleware SHALL include `security: [{ cookieAuth: [] }]` in their OpenAPI definition, and a `cookieAuth` security scheme SHALL be defined in components.

#### Scenario: Protected endpoints have security annotation
- **WHEN** a protected endpoint (e.g., `POST /bricks/:color/transfer`) is annotated
- **THEN** the spec SHALL list `security: [{ cookieAuth: [] }]` for that endpoint

#### Scenario: cookieAuth security scheme is defined
- **WHEN** the OpenAPI spec is generated
- **THEN** `components/securitySchemes` SHALL contain `cookieAuth` of type `apiKey` with `in: cookie` and name `connect.sid`