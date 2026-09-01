## Purpose

This spec defines the optional medieval-flavored background music (lute music) behavior for the Brick Master Tracker, covering the header music toggle, playback, and preference persistence.

## Requirements

### Requirement: Lute Music Toggle
The application SHALL provide an explicit music toggle button (♪) in the header that plays or stops medieval-flavored background music. Music SHALL never autoplay; the user's preference SHALL be persisted.

#### Scenario: Default state
- **WHEN** a user visits the app with no stored music preference
- **THEN** music SHALL be off and no audio SHALL play

#### Scenario: User enables music
- **WHEN** the user clicks the ♪ toggle
- **THEN** the lute music SHALL start playing from the beginning and loop continuously
- **AND** the toggle SHALL visually indicate the active state
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: User disables music
- **WHEN** the user clicks the active ♪ toggle
- **THEN** the music SHALL stop immediately
- **AND** the preference SHALL be persisted to localStorage as off

#### Scenario: Preference survives reload
- **WHEN** the user has enabled music and reloads the page
- **THEN** music SHALL NOT autoplay on load
- **AND** the toggle SHALL be rendered in its active state awaiting user interaction to resume playback

#### Scenario: No runtime synthesis
- **WHEN** music is played
- **THEN** playback SHALL use a pre-rendered audio file via the native HTMLAudioElement (no runtime MIDI synthesis, no third-party audio libraries)
