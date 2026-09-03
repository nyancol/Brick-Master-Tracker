# Authorized Transfers

## Purpose

Enforce that brick transfers are authenticated and that only the current holder can initiate a transfer, track who performed each transfer, and return user information alongside API responses.

## Requirements

### Requirement: Transfer requires authentication

The system SHALL require a valid session to call the transfer endpoint.

#### Scenario: Authenticated user attempts transfer
- **WHEN** an authenticated user sends `POST /api/bricks/:color/transfer` with a valid session cookie
- **THEN** the system SHALL proceed to validate the transfer request

#### Scenario: Unauthenticated user attempts transfer
- **WHEN** an unauthenticated user sends `POST /api/bricks/:color/transfer` without a valid session cookie
- **THEN** the system SHALL return a 401 status

### Requirement: Only holder can transfer

The system SHALL enforce that only the user who currently holds a brick can transfer it to someone else.

#### Scenario: Holder transfers their own brick
- **WHEN** the authenticated user's id matches the brick's current holder_id and the transfer target is a valid, different user
- **THEN** the system SHALL execute the transfer and return the updated brick state

#### Scenario: Non-holder attempts transfer
- **WHEN** the authenticated user's id does NOT match the brick's current holder_id
- **THEN** the system SHALL return a 403 status with message "Only the current holder can transfer this brick"

### Requirement: Transfer target is any authenticated user

The system SHALL allow transfers to any user in the users table except the current holder.

#### Scenario: Transfer to another existing user
- **WHEN** the authenticated holder transfers to a user_id that exists in the users table and is not the holder
- **THEN** the system SHALL execute the transfer

#### Scenario: Transfer to invalid user
- **WHEN** the authenticated holder transfers to a user_id that does not exist in the users table
- **THEN** the system SHALL return a 400 status with message "Invalid recipient"

#### Scenario: Transfer to self
- **WHEN** the authenticated holder attempts to transfer to their own user_id
- **THEN** the system SHALL return a 400 status with message "Cannot transfer brick to the current holder"

### Requirement: Transfer attribution

The system SHALL record who performed each transfer in the transfer_history table.

#### Scenario: Transfer records the initiator
- **WHEN** a transfer is executed
- **THEN** the system SHALL store the authenticated user's id in the `transferred_by_id` column of the new transfer_history row

### Requirement: Transfer history references users by ID

The system SHALL store source and destination of transfers as foreign keys to the users table. Genesis rows (which anchor a brick's first tenure) have a NULL source.

#### Scenario: Transfer history returned with user IDs
- **WHEN** the client requests `GET /api/transfers`
- **THEN** the system SHALL return each transfer with `fromId`, `toId`, and `transferredById` as user ID integers, along with display names for display (`fromName`, `toName`, `transferredByName`)

#### Scenario: Genesis row in transfer history
- **WHEN** the client requests `GET /api/transfers` and a genesis row exists for a brick color
- **THEN** the genesis row SHALL be included with `fromId: null` and `fromName: null`, while `toId`, `toName`, and `transferredByName` identify the first holder

### Requirement: Transfer response includes user display info

The system SHALL return human-readable user information alongside brick state in API responses to avoid separate user lookups on the client.

#### Scenario: Brick state returned with user info
- **WHEN** the client requests `GET /api/bricks`
- **THEN** each brick SHALL include `holderId` (integer), `holderName` (display name), and `holderAvatarUrl` alongside color and updatedAt

#### Scenario: Transfer response includes user info
- **WHEN** a transfer completes successfully
- **THEN** the response SHALL include the new holder's `holderId`, `holderName`, and `holderAvatarUrl`

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
