# Authorized Transfers

## ADDED Requirements

### Requirement: Transfer requires description

The system SHALL require a non-empty description to be provided when executing a brick transfer.

#### Scenario: Transfer with description accepted
- **WHEN** an authenticated holder sends `POST /api/bricks/:color/transfer` with a valid `to` user ID and a non-empty `description` field
- **THEN** the system SHALL execute the transfer, create the transfer_history row, and create a transfer_story row with the description

#### Scenario: Transfer without description rejected
- **WHEN** an authenticated holder sends `POST /api/bricks/:color/transfer` without a `description` field or with an empty description
- **THEN** the system SHALL return a 400 status with an error message indicating description is required

### Requirement: Images can be uploaded at transfer time

The system SHALL allow images to be uploaded immediately after a transfer completes, within the same modal flow.

#### Scenario: Images uploaded after transfer
- **WHEN** a transfer succeeds and the sender then uploads images via `POST /api/transfers/:id/images`
- **THEN** the system SHALL accept and store the images, linking them to the newly created transfer