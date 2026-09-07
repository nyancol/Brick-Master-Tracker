# Transfer Story — Delta

## MODIFIED Requirements

### Requirement: Story editing by sender only

The system SHALL allow only the transfer's actor (the user identified by `transferredById`, who performed the transfer) to edit the description. For blue-brick seizures the actor is the seizing knight, which may differ from the previous holder recorded in `fromId`. The description SHALL remain non-empty after edit.

#### Scenario: Actor edits story
- **WHEN** an authenticated user who matches the transfer's `transferredById` sends `PUT /api/transfers/:id/story` with a non-empty description
- **THEN** the system SHALL update the `transfer_story` row with the new description, set `edited_by` to the current user, and update `edited_at`

#### Scenario: Seizing knight edits a seizure story
- **WHEN** the knight who seized the blue brick (the transfer's `transferredById`, distinct from the previous holder in `fromId`) attempts to edit the seizure's story
- **THEN** the system SHALL allow the edit

#### Scenario: Non-actor attempts edit
- **WHEN** an authenticated user who does NOT match the transfer's `transferredById` attempts to edit the story
- **THEN** the system SHALL return a 403 status

#### Scenario: Edit with empty description rejected
- **WHEN** the actor attempts to update the description to an empty or whitespace-only string
- **THEN** the system SHALL return a 400 status with an error message indicating description must be non-empty

#### Scenario: Edit on non-existent story (upsert)
- **WHEN** the transfer has no existing story row
- **THEN** the system SHALL INSERT a new `transfer_story` row with the provided description
