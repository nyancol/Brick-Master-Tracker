# Transfer Images — Delta

## MODIFIED Requirements

### Requirement: Image upload by sender only

The system SHALL allow only the transfer's actor (the user identified by `transferredById`, who performed the transfer) to upload images to a transfer. Each request SHALL accept exactly one image file. For blue-brick seizures the actor is the seizing knight, which may differ from the previous holder recorded in `fromId`.

#### Scenario: Actor uploads image
- **WHEN** an authenticated user who matches the transfer's `transferredById` sends `POST /api/transfers/:id/images` with a `multipart/form-data` request containing exactly one image file
- **THEN** the system SHALL store the file on the filesystem, insert a row in `transfer_images`, and return the image metadata

#### Scenario: Non-actor attempts upload
- **WHEN** an authenticated user who does NOT match the transfer's `transferredById` attempts to upload an image — including the previous holder recorded in `fromId` for a seizure
- **THEN** the system SHALL return a 403 status

#### Scenario: Transfer does not exist
- **WHEN** an authenticated user sends `POST /api/transfers/:id/images` where `:id` does not correspond to an existing transfer
- **THEN** the system SHALL return a 404 status

#### Scenario: Unauthenticated attempt
- **WHEN** an unauthenticated user attempts to upload an image
- **THEN** the system SHALL return a 401 status

### Requirement: Image deletion by sender only

The system SHALL allow only the transfer's actor (the user identified by `transferredById`) to delete images.

#### Scenario: Actor deletes image
- **WHEN** an authenticated user who matches the transfer's `transferredById` sends `DELETE /api/transfers/:id/images/:imageId`
- **THEN** the system SHALL delete the file from the filesystem and remove the row from `transfer_images`

#### Scenario: Non-actor attempts deletion
- **WHEN** an authenticated user who does NOT match the transfer's `transferredById` attempts to delete an image — including the previous holder recorded in `fromId` for a seizure
- **THEN** the system SHALL return a 403 status

### Requirement: File storage

The system SHALL store uploaded images on the local filesystem in a single canonical uploads directory, resolved as `IMAGE_PATH` when set, otherwise `$DATA_PATH/uploads`. The stored filename SHALL be a UUID with the extension derived from the file's MIME type. Files stored by earlier versions without an extension SHALL remain servable.

#### Scenario: File stored with UUID name
- **WHEN** an image is uploaded successfully
- **THEN** the system SHALL store the file in the canonical uploads directory as `<uuid>.<ext>` where uuid is a generated UUID and ext is the file extension derived from the file's MIME type (`.jpg`, `.png`, `.webp`, or `.gif`)

#### Scenario: Legacy extensionless files remain servable
- **WHEN** an authenticated user requests `GET /api/uploads/:filename` for a file recorded in `transfer_images` whose stored filename has no extension (uploaded before extension derivation was fixed)
- **THEN** the system SHALL serve the file with the `mime_type` recorded in the database

#### Scenario: Metadata recorded
- **WHEN** an image is stored
- **THEN** the system SHALL insert a row in `transfer_images` with `transfer_id`, `filename` (uuid-based), `original_name` (user's filename), `mime_type`, `uploaded_by`, and `uploaded_at`
