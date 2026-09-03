# authorized-transfers Delta

## MODIFIED Requirements

### Requirement: Transfer history references users by ID

The system SHALL store source and destination of transfers as foreign keys to the users table. Genesis rows (which anchor a brick's first tenure) have a NULL source.

#### Scenario: Transfer history returned with user IDs
- **WHEN** the client requests `GET /api/transfers`
- **THEN** the system SHALL return each transfer with `fromId`, `toId`, and `transferredById` as user ID integers, along with display names for display (`fromName`, `toName`, `transferredByName`)

#### Scenario: Genesis row in transfer history
- **WHEN** the client requests `GET /api/transfers` and a genesis row exists for a brick color
- **THEN** the genesis row SHALL be included with `fromId: null` and `fromName: null`, while `toId`, `toName`, and `transferredByName` identify the first holder
