# language-default — Delta Spec

## ADDED Requirements

### Requirement: Device-based default language
When no language preference is stored, the app SHALL resolve its default language from the device locale: a locale whose primary language subtag is `fr` SHALL resolve to `fr`, and a locale whose primary language subtag is `en` SHALL resolve to `en`.

#### Scenario: French device defaults to French
- **WHEN** the device locale is `fr` (e.g. `fr-FR`) and no language preference is stored
- **THEN** the app renders in French

#### Scenario: English device defaults to English
- **WHEN** the device locale is `en` (e.g. `en-US`) and no language preference is stored
- **THEN** the app renders in English

#### Scenario: Regional variants map to their base language
- **WHEN** the device locale is a regional or script-tagged variant such as `fr-CA`, `fr-CH`, `en-GB`, or `fr-Latn-CA` and no language preference is stored
- **THEN** the app resolves to the base language of the variant (`fr` for the French variants, `en` for the English variants)

### Requirement: French as catch-all fallback
When no language preference is stored and the device locale is neither French nor English (or is unavailable), the app SHALL default to French.

#### Scenario: Unrelated device locale falls back to French
- **WHEN** the device locale is e.g. `de-DE` or `es-MX` and no language preference is stored
- **THEN** the app renders in French

#### Scenario: Unavailable device locale falls back to French
- **WHEN** the device locale cannot be determined (empty/undefined) and no language preference is stored
- **THEN** the app renders in French

### Requirement: Stored preference takes precedence over detection
A stored language preference (`en` or `fr`) SHALL always take precedence over device-language detection, on every load.

#### Scenario: Explicit English choice on a French device
- **WHEN** the stored language preference is `en` and the device locale is `fr-FR`
- **THEN** the app renders in English

#### Scenario: Explicit French choice on an English device
- **WHEN** the stored language preference is `fr` and the device locale is `en-US`
- **THEN** the app renders in French

### Requirement: Detection is a default, not a preference
Device-based resolution SHALL NOT persist anything to storage; only an explicit user language change SHALL write the stored preference.

#### Scenario: Device default does not write storage
- **WHEN** the app loads with no stored language preference and renders in the device-resolved language
- **THEN** no language key is written to storage

#### Scenario: Explicit change persists
- **WHEN** the user changes the language via the language toggle
- **THEN** the chosen language is persisted and wins on subsequent loads
