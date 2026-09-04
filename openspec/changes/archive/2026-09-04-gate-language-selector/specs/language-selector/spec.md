# language-selector — Delta Spec

## ADDED Requirements

### Requirement: Language selector on the gate entry page
The gate entry (login) page SHALL display the EN/FR language selector so that an unauthenticated visitor can switch the UI language before signing in.

#### Scenario: Selector visible before authentication
- **WHEN** an unauthenticated visitor loads the gate entry page
- **THEN** the EN/FR language selector is rendered and operable

#### Scenario: Switching language on the gate page re-renders it
- **WHEN** the visitor activates the other language on the gate entry page
- **THEN** the gate entry page's rendered strings (title, subtitle, sign-in label) immediately display in the chosen language

### Requirement: Language selector on the home header
The home page header SHALL continue to display the EN/FR language selector, rendering the same control as the gate entry page.

#### Scenario: Selector visible on home
- **WHEN** an authenticated user views the home page
- **THEN** the EN/FR language selector is rendered in the header and operable

### Requirement: Active language indication
The language selector SHALL visually distinguish the currently active language from the inactive one on every surface where it is rendered.

#### Scenario: Active button highlighted
- **WHEN** the selector is rendered in language `X` (`en` or `fr`)
- **THEN** the button for `X` SHALL be visually highlighted as active and the other button muted

#### Scenario: Active indication follows a switch
- **WHEN** the user switches the selector from `X` to `Y`
- **THEN** `Y` becomes the visually active button and `X` becomes muted

### Requirement: Selector choice persists and wins
Activating a language in the selector SHALL persist the choice, and the persisted choice SHALL render on subsequent page loads on every page that uses the UI language.

#### Scenario: Choice survives navigation
- **WHEN** the user switches language via the selector and then navigates to another app page
- **THEN** the new page renders in the chosen language

#### Scenario: Choice survives reload
- **WHEN** the user switches language via the selector and reloads the page
- **THEN** the page renders in the chosen language
