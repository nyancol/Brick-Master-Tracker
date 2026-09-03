# window-chrome Delta

## MODIFIED Requirements

### Requirement: Brick Window Status Bar
Each brick window SHALL include a status bar strip below the content.

#### Scenario: Status bar contents
- **WHEN** a brick window is rendered
- **THEN** the status bar SHALL show a brick count ("1 brick(s)") on the left
- **AND** the current holder's live tenure (days, hours, minutes, seconds, ticking every second) on the right, followed by an era joke label (e.g. "56k modem")

#### Scenario: Days held computation
- **WHEN** the status bar tenure is rendered
- **THEN** it SHALL be derived from the shared genesis-aware tenure computation (genesis row anchored at the founding epoch), so a genesis holder shows a real duration instead of a placeholder
- **AND** the status bar tenure SHALL match the current holder's tenure shown in the brick window's tenure ledger
