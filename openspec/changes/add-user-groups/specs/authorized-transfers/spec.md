## MODIFIED Requirements

### Requirement: Only holder can transfer

The system SHALL enforce that only the user who currently holds a brick can transfer it to someone else, and that only users with the `knight` role can transfer at all. Since only the holder can initiate a transfer, the role check effectively blocks visitors — including a demoted current holder, whose brick SHALL remain frozen (nobody can transfer it) until their role is restored at the OIDC provider and they re-login.

#### Scenario: Holder transfers their own brick
- **WHEN** an authenticated user whose `role = 'knight'` has an id matching the brick's current `holder_id` and transfers to a valid other user
- **THEN** the system SHALL execute the transfer and update the brick state

#### Scenario: Non-holder attempts transfer
- **WHEN** an authenticated user's id does NOT match the brick's current `holder_id`
- **THEN** the system SHALL return a 403 status with message "Only the current holder can transfer this brick"

#### Scenario: Knight demoted to visitor cannot transfer
- **WHEN** an authenticated user whose stored `role = 'visitor'` has an id matching the brick's current `holder_id`
- **THEN** the system SHALL return a 403 status with a message indicating only knights can transfer, and the brick SHALL NOT change hands

### Requirement: Transfer target is any authenticated user

The system SHALL allow transfers only to users with the `knight` role, except the current holder. Transfers to visitors SHALL be rejected.

#### Scenario: Transfer to another knight
- **WHEN** the authenticated knight holder transfers to a user_id that exists in the users table, has `role = 'knight'`, and is not the holder
- **THEN** the system SHALL execute the transfer

#### Scenario: Transfer to a visitor
- **WHEN** the authenticated knight holder transfers to a user_id that exists in the users table but has `role = 'visitor'`
- **THEN** the system SHALL return a 400 status with an error message indicating the recipient is not a participant (not a knight)

#### Scenario: Transfer to invalid user
- **WHEN** the authenticated holder transfers to a user_id that does not exist in the users table
- **THEN** the system SHALL return a 400 status with message "Invalid recipient"

#### Scenario: Transfer to self
- **WHEN** the authenticated holder attempts to transfer to their own user_id
- **THEN** the system SHALL return a 400 status with message "Cannot transfer brick to the current holder"
