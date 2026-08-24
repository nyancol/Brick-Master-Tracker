## MODIFIED Requirements

### Requirement: Dual Palette Theme Toggle
The application SHALL support two visual themes — Manuscript (light) and Scriptorium (dark) — and SHALL activate automatically based on the user's device `prefers-color-scheme` preference, with the option for the user to manually override via a theme toggle.

#### Scenario: Light mode activation
- **WHEN** user's device reports `prefers-color-scheme: light` (or user manually selects light mode)
- **THEN** the application renders with the Manuscript palette (parchment background, sepia text, gold accents)

#### Scenario: Dark mode activation
- **WHEN** user's device reports `prefers-color-scheme: dark` (or user manually selects dark mode)
- **THEN** the application renders with the Scriptorium palette (dark wood background, bone text, candlelit gold accents)

#### Scenario: Theme transition
- **WHEN** the device theme preference changes while the app is loaded (and user is in system-follow mode)
- **THEN** the application transitions smoothly to the new palette without page reload

#### Scenario: Manual override
- **WHEN** the user manually selects a theme via the toggle
- **THEN** the palette SHALL change immediately to the selected theme
- **AND** the automatic `prefers-color-scheme` detection SHALL be overridden until the user returns to system-follow mode