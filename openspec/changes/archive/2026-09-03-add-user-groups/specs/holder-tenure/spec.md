## MODIFIED Requirements

### Requirement: Tenure ledger in brick windows

Each brick window SHALL render a tenure ledger listing users with their total tenure for that brick, sorted descending by total tenure (longest first), with the current holder's row visually distinguished. Ledger membership SHALL be history-based: a user SHALL be listed if they have any tenure in that brick's transfer history OR currently have the `knight` role. Visitors without tenure SHALL NOT appear; former knights keep their historical tenure visible. Users with zero tenure who are listed SHALL still be shown with a "0d" duration and a themed flavor line. All ledger strings SHALL exist in both `en` and `fr` locales.

#### Scenario: Leaderboard ordering
- **WHEN** the tenure ledger is rendered for a brick
- **THEN** listed users SHALL be ordered in descending order of total tenure for that brick, with the current holder's row visually distinguished

#### Scenario: Zero-tenure knight
- **WHEN** a user with `role = 'knight'` has never held a given brick
- **THEN** the ledger SHALL show that knight with a "0d" duration and a themed flavor line

#### Scenario: Visitor without tenure excluded
- **WHEN** a user with `role = 'visitor'` has never held the brick
- **THEN** the ledger SHALL NOT list that user

#### Scenario: Former knight with tenure remains visible
- **WHEN** a user with `role = 'visitor'` has tenure in the brick's transfer history
- **THEN** the ledger SHALL still list that user with their historical tenure

#### Scenario: Demoted current holder keeps ticking
- **WHEN** the current holder's role changes to `visitor` while they still hold the brick
- **THEN** the ledger SHALL continue showing their tenure growing in real time until a transfer occurs

#### Scenario: Locale switching
- **WHEN** the user switches language
- **THEN** all tenure ledger strings SHALL render in the selected locale
