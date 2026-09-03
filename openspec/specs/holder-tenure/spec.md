# holder-tenure Specification

## Purpose

Track and display how long each user has held each brick color. A genesis ledger row anchors the first holder's tenure at the fixed founding epoch; the client derives per-holder tenure totals from the transfer list and renders them as a leaderboard in each brick window, with a live timer for the current holder.

## Requirements

### Requirement: Genesis ledger record

The system SHALL ensure every brick color has exactly one genesis row in `transfer_history` anchoring the first holder's tenure: `from_id = NULL`, `to_id` = the first holder, `transferred_by_id` = the first holder, and `transferred_at` = the fixed founding epoch `2026-07-01T00:00:00Z`. Each genesis row SHALL be seeded with an immutable founding story in `transfer_story`, written in French.

#### Scenario: Fresh bootstrap creates genesis row
- **WHEN** a brick is bootstrapped into `brick_state` for a user (OIDC owner bootstrap or dev bootstrap) and no genesis row exists for that color
- **THEN** the system SHALL insert a genesis `transfer_history` row with `from_id = NULL`, `to_id` = the bootstrapped holder, and `transferred_at` = the founding epoch

#### Scenario: Migration backfills genesis for colors with transfers
- **WHEN** the migration runs against an existing database where a brick color has transfer rows but no genesis row
- **THEN** the system SHALL insert a genesis row with `to_id` = the `from_id` of that color's earliest known transfer and `transferred_at` = the founding epoch

#### Scenario: Migration backfills genesis for colors without transfers
- **WHEN** the migration runs against an existing database where a brick color has no transfer rows but has a `brick_state` holder
- **THEN** the system SHALL insert a genesis row with `to_id` = the current `brick_state.holder_id` and `transferred_at` = the founding epoch

#### Scenario: No duplicate genesis rows
- **WHEN** the bootstrap or migration runs on a database that already has a genesis row (row with `from_id IS NULL`) for a brick color
- **THEN** the system SHALL NOT insert a second genesis row for that color

#### Scenario: Genesis founding story seeded
- **WHEN** a genesis row is created, whether by fresh bootstrap or by migration backfill
- **THEN** a `transfer_story` row SHALL be created for it containing the fixed French founding text for that brick's color

#### Scenario: Genesis story is immutable
- **WHEN** any authenticated user sends `PUT /api/transfers/{genesisId}/story`
- **THEN** the system SHALL reject the request with 403, since a genesis row has no sender
- **AND** the Chronicle SHALL NOT render a story edit affordance for genesis entries

### Requirement: Client-side tenure derivation

The client SHALL derive per-holder total tenure for each brick color from the transfer list: the `to_id` of each transfer holds the brick from that transfer's `transferred_at` until the next transfer's `transferred_at` (or until the current time for the latest transfer). The genesis row anchors the first tenure.

#### Scenario: Tenure totals per holder
- **WHEN** the client renders tenure for a brick color
- **THEN** each holder's total SHALL equal the sum of all their holding periods for that color, derived from the transfer list without additional API calls

#### Scenario: Current holder tenure is open-ended
- **WHEN** the current holder's tenure is computed
- **THEN** their open holding period SHALL end at the current time, so the displayed duration grows in real time

#### Scenario: Genesis holder with no subsequent transfers
- **WHEN** a brick color has only its genesis row
- **THEN** the genesis holder's tenure SHALL be computed as the time elapsed since the founding epoch

### Requirement: Tenure ledger in brick windows

Each brick window SHALL render a tenure ledger group box listing every user with their total tenure for that brick, sorted leaderboard-style by total tenure (longest first). Users with zero tenure SHALL still be listed with a "0d" duration and a themed flavor line. All ledger strings SHALL exist in both `en` and `fr` locales.

#### Scenario: Leaderboard ordering
- **WHEN** the tenure ledger is rendered for a brick
- **THEN** users SHALL be listed in descending order of total tenure for that brick, with the current holder's row visually distinguished

#### Scenario: Zero-tenure user
- **WHEN** a user has never held a given brick
- **THEN** the ledger SHALL show that user with a "0d" duration and a themed flavor line

#### Scenario: Locale switching
- **WHEN** the user switches language
- **THEN** all tenure ledger strings SHALL render in the selected locale

### Requirement: Live tenure timer

The current holder's tenure SHALL be displayed as a live duration (days, hours, minutes, seconds) that updates every second. The update SHALL be textual only — no CSS animation or transition SHALL be used for the tick.

#### Scenario: Per-second tick
- **WHEN** a brick window is open with a current holder
- **THEN** the ledger row for the current holder SHALL re-render its duration at least once per second

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion` is set
- **THEN** the live tenure tick SHALL still update textually every second and SHALL NOT use animation

### Requirement: Genesis entry in the Chronicle

The Chronicle SHALL render genesis rows (transfers with no source holder) as a "forged unto" line naming the first holder, not as a from → to transfer line, and SHALL NOT break on their null source fields.

#### Scenario: Genesis entry rendering
- **WHEN** the Chronicle renders a transfer whose source holder is null
- **THEN** it SHALL display a "forged unto {name}" line for that brick's first holder instead of a from → to rendering

#### Scenario: Regular transfers unaffected
- **WHEN** the Chronicle renders a transfer with a source holder
- **THEN** its rendering SHALL be unchanged from existing behavior
