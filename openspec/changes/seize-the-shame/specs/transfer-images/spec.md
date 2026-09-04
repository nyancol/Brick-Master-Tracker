# Transfer Images — Delta Spec

## REMOVED Requirements

### Requirement: Image upload by sender only

**Reason**: With seizures, the transfer actor is no longer always the sender: for a seizure the actor (`transferred_by_id`) is the taker, while `from_id` is the relieved previous holder. Upload rights now follow the actor.
**Migration**: Replaced below by "Image upload by transfer actor only", which authorizes on `transferred_by_id`.

### Requirement: Image deletion by sender only

**Reason**: Same actor/sender divergence as upload; deletion rights now follow the actor.
**Migration**: Replaced below by "Image deletion by transfer actor only", which authorizes on `transferred_by_id`.

## ADDED Requirements

### Requirement: Image upload by transfer actor only

The system SHALL allow only the transfer's actor — the user recorded in `transferred_by_id` — to upload images to a transfer. Each request SHALL accept exactly one image file. For all pre-existing rows (red transfers, genesis) `transferred_by_id` equals `from_id`, so historical upload rights are unchanged.

#### Scenario: Actor uploads image
- **WHEN** an authenticated user who matches the transfer's `transferred_by_id` sends `POST /api/transfers/:id/images` with a `multipart/form-data` request containing exactly one image file
- **THEN** the system SHALL store the file on the filesystem, insert a row in `transfer_images`, and return the image metadata

#### Scenario: Non-actor attempts upload
- **WHEN** an authenticated user who does NOT match the transfer's `transferred_by_id` attempts to upload an image
- **THEN** the system SHALL return a 403 status

#### Scenario: Seizing knight uploads images to their seizure
- **WHEN** the knight who performed a seizure (matching `transferred_by_id` but not `from_id`) uploads an image to that transfer
- **THEN** the system SHALL accept and store the image

#### Scenario: Transfer does not exist
- **WHEN** an authenticated user sends `POST /api/transfers/:id/images` where `:id` does not correspond to an existing transfer
- **THEN** the system SHALL return a 404 status

#### Scenario: Unauthenticated attempt
- **WHEN** an unauthenticated user attempts to upload an image
- **THEN** the system SHALL return a 401 status

### Requirement: Image deletion by transfer actor only

The system SHALL allow only the transfer's actor — the user recorded in `transferred_by_id` — to delete images from a transfer.

#### Scenario: Actor deletes image
- **WHEN** an authenticated user who matches the transfer's `transferred_by_id` sends `DELETE /api/transfers/:id/images/:imageId`
- **THEN** the system SHALL delete the file from the filesystem and remove the row from `transfer_images`

#### Scenario: Non-actor attempts deletion
- **WHEN** an authenticated user who does NOT match the transfer's `transferred_by_id` attempts to delete an image
- **THEN** the system SHALL return a 403 status
