# Shame Seizure — Delta Spec

## ADDED Requirements

### Requirement: Seizure requires authentication

The system SHALL require a valid session to call the seizure endpoint.

#### Scenario: Authenticated knight attempts seizure
- **WHEN** an authenticated user sends `POST /api/bricks/blue/seize` with a valid session cookie
- **THEN** the system SHALL proceed to validate the seizure request

#### Scenario: Unauthenticated user attempts seizure
- **WHEN** an unauthenticated user sends `POST /api/bricks/blue/seize`
- **THEN** the system SHALL return a 401 status

### Requirement: Only a knight other than the bearer may seize

The system SHALL allow the Brick of Shame to change hands only when an authenticated knight who is NOT the current holder seizes it. The seizer becomes the holder. Visitors SHALL be rejected, and the current holder SHALL be rejected.

#### Scenario: Knight other than the bearer seizes
- **WHEN** an authenticated knight whose id does NOT match the blue brick's current `holder_id` sends `POST /api/bricks/blue/seize` with a valid request
- **THEN** the system SHALL execute the seizure: the caller becomes the holder and the brick state is updated

#### Scenario: Bearer attempts to seize their own shame
- **WHEN** an authenticated user whose id matches the blue brick's current `holder_id` sends `POST /api/bricks/blue/seize`
- **THEN** the system SHALL return a 403 status with a message indicating only another knight may seize the Shame, and the brick SHALL NOT change hands

#### Scenario: Visitor attempts seizure
- **WHEN** an authenticated user whose stored `role = 'visitor'` and who is not the holder sends `POST /api/bricks/blue/seize`
- **THEN** the system SHALL return a 403 status with a message indicating only knights can seize, and the brick SHALL NOT change hands

### Requirement: Seizure requires description

The system SHALL require a non-empty description when seizing the Brick of Shame. The description records the seizing knight's motive.

#### Scenario: Seizure with description accepted
- **WHEN** an eligible knight sends `POST /api/bricks/blue/seize` with a non-empty `description` field
- **THEN** the system SHALL execute the seizure and create a `transfer_story` row with the description

#### Scenario: Seizure without description rejected
- **WHEN** an eligible knight sends `POST /api/bricks/blue/seize` without a `description` field or with an empty description
- **THEN** the system SHALL return a 400 status with an error message indicating description is required

### Requirement: Seizure is atomic, attributed, and self-directed

The system SHALL execute a seizure within a single transaction: update `brick_state.holder_id` to the caller, insert a `transfer_history` row with `color = 'blue'`, `from_id` = previous holder, `to_id` = caller, and `transferred_by_id` = caller, and insert a `transfer_story` row with `edited_by` = caller. Staged image IDs provided in the request SHALL be linked to the new transfer within the same transaction. The response SHALL include the new holder's `holderId`, `holderName`, and `holderAvatarUrl`.

#### Scenario: Seizure history row records taker as actor
- **WHEN** a knight seizes the blue brick from another knight
- **THEN** the new `transfer_history` row SHALL have `to_id` and `transferred_by_id` both set to the seizing knight's id, and `from_id` set to the relieved holder's id

#### Scenario: Staged images attached at seizure time
- **WHEN** an eligible knight sends `POST /api/bricks/blue/seize` with an `imageIds` array containing valid staging image IDs uploaded by that knight
- **THEN** the system SHALL set those images' `transfer_id` to the new transfer's ID within the same transaction

#### Scenario: Seizure response includes holder info
- **WHEN** a seizure completes successfully
- **THEN** the response SHALL include `transferId`, `color`, the new `holderId` (the seizing knight), `holderName`, `holderAvatarUrl`, and `updatedAt`

### Requirement: Seize control in the Shame window

The system SHALL invert the SHAME.EXE window controls: the current blue holder SHALL see no transfer controls (only a waiting message in the holder's voice), and every other knight SHALL see a single Seize control that opens the story modal without a recipient picker. Visitors SHALL see no seize control.

#### Scenario: Blue holder sees waiting text only
- **WHEN** the current blue brick holder (knight) views the Shame window
- **THEN** the system SHALL show the holder-voiced waiting text and SHALL NOT render any transfer or recipient buttons

#### Scenario: Other knight sees a single Seize control
- **WHEN** a knight who does not hold the blue brick views the Shame window
- **THEN** the system SHALL show one Seize button (no recipient picker) that opens the seizure modal

#### Scenario: Seizure modal collects description and images
- **WHEN** a non-holder knight confirms the seizure modal with a description and optional staged images
- **THEN** the client SHALL call `POST /api/bricks/blue/seize` and on success refresh brick state, bump the chronicle view, and play the transfer sound

#### Scenario: Visitor sees no seize control
- **WHEN** a visitor views the Shame window
- **THEN** the system SHALL NOT render a Seize button

### Requirement: Blue brick cannot be offloaded by its holder

The system SHALL reject any holder-initiated transfer of the blue brick. `POST /api/bricks/blue/transfer` SHALL return a 403 status with a message indicating the Shame cannot be given and must be seized. The red brick transfer path SHALL remain unchanged.

#### Scenario: Blue transfer attempt rejected
- **WHEN** an authenticated knight sends `POST /api/bricks/blue/transfer` with any valid recipient and description
- **THEN** the system SHALL return a 403 status with an error message indicating the Shame cannot be given, and the brick SHALL NOT change hands

#### Scenario: Red transfer unaffected
- **WHEN** the red brick holder sends `POST /api/bricks/red/transfer` with a valid recipient and description
- **THEN** the system SHALL execute the transfer as before
