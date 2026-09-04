# Transfer Story — Delta Spec

## REMOVED Requirements

### Requirement: Story editing by sender only

**Reason**: With seizures, the transfer actor is no longer always the sender: for a seizure the actor (`transferred_by_id`) is the taker, while `from_id` is the relieved previous holder. Story rights now follow the actor.
**Migration**: Replaced below by "Story editing by transfer actor only", which authorizes on `transferred_by_id`.

## ADDED Requirements

### Requirement: Story editing by transfer actor only

The system SHALL allow only the transfer's actor — the user recorded in `transferred_by_id` — to edit the description. The description SHALL remain non-empty after edit. For all pre-existing rows (red transfers, genesis) `transferred_by_id` equals `from_id`, so historical edit rights are unchanged; for seizure rows the seizing knight retains edit rights over their own tale.

#### Scenario: Actor edits story
- **WHEN** an authenticated user who matches the transfer's `transferred_by_id` sends `PUT /api/transfers/:id/story` with a non-empty description
- **THEN** the system SHALL update the `transfer_story` row with the new description, set `edited_by` to the current user, and update `edited_at`

#### Scenario: Non-actor attempts edit
- **WHEN** an authenticated user who does NOT match the transfer's `transferred_by_id` attempts to edit the story
- **THEN** the system SHALL return a 403 status

#### Scenario: Edit with empty description rejected
- **WHEN** the actor attempts to update the description to an empty or whitespace-only string
- **THEN** the system SHALL return a 400 status with an error message indicating description must be non-empty

#### Scenario: Edit on non-existent story (upsert)
- **WHEN** the transfer has no existing story row
- **THEN** the system SHALL INSERT a new `transfer_story` row with the provided description

#### Scenario: Seizing knight edits their own seizure tale
- **WHEN** the knight who performed a seizure (matching `transferred_by_id` but not `from_id`) edits the seizure's story
- **THEN** the system SHALL accept the edit and update `edited_by` and `edited_at`

#### Scenario: Relieved former holder cannot edit the seizure tale
- **WHEN** the previous blue brick holder (matching the seizure's `from_id` but not `transferred_by_id`) attempts to edit the seizure's story
- **THEN** the system SHALL return a 403 status
