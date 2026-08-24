# Transfer Story

## Purpose

Allow the sender of a brick transfer to attach a narrative description explaining why the recipient deserved the brick (honor or shame), and to edit that description later. Transform the transfer from a bare event into a recorded story.

## Requirements

### Requirement: Transfer description is required

The system SHALL require a description to be provided when executing a brick transfer.

#### Scenario: Transfer with description
- **WHEN** an authenticated holder sends `POST /api/bricks/:color/transfer` with a non-empty `description` field in the request body
- **THEN** the system SHALL execute the transfer and create a new row in `transfer_story` with the provided description

#### Scenario: Transfer without description
- **WHEN** an authenticated holder sends `POST /api/bricks/:color/transfer` without a `description` field or with an empty description
- **THEN** the system SHALL return a 400 status with an error message indicating description is required

### Requirement: Story creation at transfer time

The system SHALL create a `transfer_story` row atomically within the same transaction as the transfer.

#### Scenario: Story created in transaction
- **WHEN** a transfer with description is executed
- **THEN** the system SHALL INSERT a row into `transfer_story` with `transfer_id`, `description`, `edited_by` (set to sender), `edited_at`, and `created_at` all within the same transaction as the transfer_history INSERT

### Requirement: Story retrieval

The system SHALL provide two levels of transfer data: a summary list and per-transfer details.

#### Scenario: Transfer list returns summary
- **WHEN** the client requests `GET /api/transfers`
- **THEN** each transfer SHALL include basic metadata only (id, color, fromId, fromName, toId, toName, transferredById, transferredByName, transferredAt)

#### Scenario: Transfer story returns full details
- **WHEN** the client requests `GET /api/transfers/:id/story`
- **THEN** the response SHALL include `description`, `editedBy`, `editedByName`, `editedAt` from `transfer_story`, and an `images` array from `transfer_images`

### Requirement: Story editing by sender only

The system SHALL allow only the transfer sender to edit the description. The description SHALL remain non-empty after edit.

#### Scenario: Sender edits story
- **WHEN** an authenticated user who matches the transfer's `fromId` sends `PUT /api/transfers/:id/story` with a non-empty description
- **THEN** the system SHALL update the `transfer_story` row with the new description, set `edited_by` to the current user, and update `edited_at`

#### Scenario: Non-sender attempts edit
- **WHEN** an authenticated user who does NOT match the transfer's `fromId` attempts to edit the story
- **THEN** the system SHALL return a 403 status

#### Scenario: Edit with empty description rejected
- **WHEN** the sender attempts to update the description to an empty or whitespace-only string
- **THEN** the system SHALL return a 400 status with an error message indicating description must be non-empty

#### Scenario: Edit on non-existent story (upsert)
- **WHEN** the transfer has no existing story row
- **THEN** the system SHALL INSERT a new `transfer_story` row with the provided description

### Requirement: Story edit attribution

The system SHALL track who made each edit and when.

#### Scenario: Edit timestamp recorded
- **WHEN** a story is created or edited
- **THEN** the system SHALL store the editor's user ID in `edited_by` and the current timestamp in `edited_at`

### Requirement: Story response includes edit metadata

The system SHALL return edit metadata with story data.

#### Scenario: Story response includes edit info
- **WHEN** the client requests `GET /api/transfers/:id/story`
- **THEN** the response SHALL include `editedBy` (user ID), `editedByName` (display name), and `editedAt` (ISO timestamp) from the `transfer_story` table
