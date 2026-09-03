# sound-effects Specification (Delta)

## ADDED Requirements

### Requirement: Sound Effects Toggle
The application SHALL provide an explicit sound-effects toggle in the header, separate from the lute music toggle, that controls playback of sound effects. The user's preference SHALL be persisted.

#### Scenario: Default state
- **WHEN** a user visits the app with no stored SFX preference
- **THEN** sound effects SHALL be enabled (default ON) and the toggle SHALL render in its active state

#### Scenario: User disables sound effects
- **WHEN** the user clicks the SFX toggle while it is active
- **THEN** sound effects SHALL stop playing immediately and subsequent triggers SHALL be silent
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: User enables sound effects
- **WHEN** the user clicks the SFX toggle while it is inactive
- **THEN** sound effects SHALL be enabled and subsequent triggers SHALL play
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: Preference survives reload
- **WHEN** the user has set an SFX preference and reloads the page
- **THEN** the stored preference SHALL be honored and the toggle SHALL render accordingly

#### Scenario: Independence from lute toggle
- **WHEN** either the lute toggle or the SFX toggle is switched
- **THEN** the other toggle's state SHALL remain unchanged

### Requirement: Transfer Sword Sound
A sword-draw sound effect ("shing") SHALL play when the user successfully confirms a brick transfer.

#### Scenario: Successful transfer
- **WHEN** a transfer request completes successfully (modal confirm resolves without error)
- **THEN** the sword sound SHALL play once (not looped)

#### Scenario: Failed transfer
- **WHEN** a transfer request fails
- **THEN** no sword sound SHALL play

#### Scenario: SFX disabled
- **WHEN** a transfer succeeds while sound effects are disabled
- **THEN** no sound SHALL play and no error SHALL surface to the user

### Requirement: Pre-rendered SFX Audio
Sound effects SHALL use a pre-rendered audio file played via the native HTMLAudioElement — no runtime synthesis, no third-party audio libraries.

#### Scenario: Asset storage
- **WHEN** the application is built
- **THEN** the sword sound asset SHALL exist locally under `public/audio/`
- **AND** its source and license SHALL be recorded in the GIF/audio credits file
