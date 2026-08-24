# Transfer Images

## Purpose

Allow the sender of a brick transfer to upload and manage photo attachments that document the circumstances of the transfer, creating a visual record alongside the narrative description.

## Requirements

### Requirement: Image upload by sender only

The system SHALL allow only the transfer sender to upload images to a transfer. Each request SHALL accept exactly one image file.

#### Scenario: Sender uploads image
- **WHEN** an authenticated user who matches the transfer's `fromId` sends `POST /api/transfers/:id/images` with a `multipart/form-data` request containing exactly one image file
- **THEN** the system SHALL store the file on the filesystem, insert a row in `transfer_images`, and return the image metadata

#### Scenario: Non-sender attempts upload
- **WHEN** an authenticated user who does NOT match the transfer's `fromId` attempts to upload an image
- **THEN** the system SHALL return a 403 status

#### Scenario: Transfer does not exist
- **WHEN** an authenticated user sends `POST /api/transfers/:id/images` where `:id` does not correspond to an existing transfer
- **THEN** the system SHALL return a 404 status

#### Scenario: Unauthenticated attempt
- **WHEN** an unauthenticated user attempts to upload an image
- **THEN** the system SHALL return a 401 status

### Requirement: File format and size limits

The system SHALL accept classic image formats with a 50MB per-file limit.

#### Scenario: Accepted formats
- **WHEN** a user uploads a file with MIME type `image/jpeg`, `image/png`, `image/webp`, or `image/gif` and size <= 50MB
- **THEN** the system SHALL accept and process the file

#### Scenario: Rejected format
- **WHEN** a user uploads a file with a MIME type not in `image/jpeg`, `image/png`, `image/webp`, or `image/gif`
- **THEN** the system SHALL return a 400 status with an error message indicating unsupported format

#### Scenario: File exceeds size limit
- **WHEN** a user uploads an image file larger than 50MB
- **THEN** the system SHALL return a 400 status with an error message indicating the file is too large

### Requirement: Staging upload before transfer creation

The system SHALL allow images to be uploaded before a transfer exists, in a staging state, via `POST /api/uploads/staging`. Images are held with `transfer_id = NULL` until the transfer is submitted.

#### Scenario: Staging image uploaded
- **WHEN** an authenticated user sends `POST /api/uploads/staging` with a valid image file
- **THEN** the system SHALL store the file and insert a row in `transfer_images` with `transfer_id = NULL`, returning the image metadata including its ID

#### Scenario: Staging image associated at transfer time
- **WHEN** a transfer is submitted via `POST /api/bricks/:color/transfer` with `imageIds` array containing valid staging image IDs
- **THEN** the system SHALL update those `transfer_images` rows to set `transfer_id` to the new transfer's ID, within the same transaction

#### Scenario: Staging image deleted by uploader
- **WHEN** the user who uploaded a staging image sends `DELETE /api/uploads/staging/:id`
- **THEN** the system SHALL delete the file from the filesystem and remove the `transfer_images` row

#### Scenario: Non-uploader attempts to delete staging image
- **WHEN** an authenticated user who is NOT the uploader attempts to delete a staging image
- **THEN** the system SHALL return a 403 status

### Requirement: File storage

The system SHALL store uploaded images on the local filesystem under the directory specified by the `DATA_PATH` environment variable.

#### Scenario: File stored with UUID name
- **WHEN** an image is uploaded successfully
- **THEN** the system SHALL store the file at `$DATA_PATH/uploads/<uuid>.<ext>` where uuid is a generated UUID and ext is the file extension derived from MIME type

#### Scenario: Metadata recorded
- **WHEN** an image is stored
- **THEN** the system SHALL insert a row in `transfer_images` with `transfer_id`, `filename` (uuid-based), `original_name` (user's filename), `mime_type`, `uploaded_by`, and `uploaded_at`

### Requirement: Image serving

The system SHALL serve uploaded images through an authenticated endpoint.

#### Scenario: Authenticated user views image
- **WHEN** an authenticated user requests `GET /api/uploads/:filename` with a valid UUID-based filename
- **THEN** the system SHALL serve the image file with the appropriate Content-Type

#### Scenario: Unauthenticated user requests image
- **WHEN** an unauthenticated user requests `GET /api/uploads/:filename`
- **THEN** the system SHALL return a 401 status

#### Scenario: Non-existent image requested
- **WHEN** a request is made for a filename that does not exist in the `transfer_images` table or on the filesystem
- **THEN** the system SHALL return a 404 status

### Requirement: Image deletion by sender only

The system SHALL allow only the transfer sender to delete images.

#### Scenario: Sender deletes image
- **WHEN** an authenticated user who matches the transfer's `fromId` sends `DELETE /api/transfers/:id/images/:imageId`
- **THEN** the system SHALL delete the file from the filesystem and remove the row from `transfer_images`

#### Scenario: Non-sender attempts deletion
- **WHEN** an authenticated user who does NOT match the transfer's `fromId` attempts to delete an image
- **THEN** the system SHALL return a 403 status

### Requirement: Image listing per transfer

The system SHALL return image metadata for a transfer via the story endpoint.

#### Scenario: Story includes images
- **WHEN** the client requests `GET /api/transfers/:id/story`
- **THEN** the response SHALL include an `images` array with image metadata (id, filename, originalName, mimeType, uploadedAt) for all images linked to that transfer_id