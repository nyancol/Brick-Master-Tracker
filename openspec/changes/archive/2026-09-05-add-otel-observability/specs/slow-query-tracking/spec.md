# slow-query-tracking

## ADDED Requirements

### Requirement: Statement execution is timed
The SQLite access layer SHALL measure the wall-clock duration of executed SQL statements (via a transparent wrapper around `better-sqlite3` statement execution), without changing the synchronous call semantics or return values that callers rely on.

#### Scenario: Wrapper is transparent
- **WHEN** existing endpoint code executes prepared statements through the wrapped database
- **THEN** results, synchronous error behavior, and transaction semantics are identical to direct `better-sqlite3` usage

### Requirement: Slow statements are logged
A statement whose execution exceeds a configurable threshold (`SLOW_QUERY_THRESHOLD_MS`, default 100 ms) SHALL produce a structured warning log entry containing the duration and the SQL text (truncated), and never any bound parameter values.

#### Scenario: Slow insert is surfaced
- **WHEN** a statement takes longer than the threshold to execute
- **THEN** a warning log entry appears with the SQL text and measured duration, and no parameter values

#### Scenario: Fast queries stay silent
- **WHEN** all statements during a request execute under the threshold
- **THEN** no slow-query log entries are produced for them

### Requirement: Threshold is configurable
The slow-query threshold SHALL be configurable via the `SLOW_QUERY_THRESHOLD_MS` environment variable, honored in both dev and production modes.

#### Scenario: Raising the threshold
- **WHEN** `SLOW_QUERY_THRESHOLD_MS` is set to a high value and previously-slow statements run
- **THEN** those statements no longer produce slow-query warnings
