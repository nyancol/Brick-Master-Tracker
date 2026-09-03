# Chronicle Marginalia — Delta Spec

## ADDED Requirements

### Requirement: Glossing open to knights and visitors

The system SHALL allow any authenticated user — regardless of role (`knight` or `visitor`) — to inscribe a gloss (comment) on any chronicle entry (transfer). Visitors SHALL remain unable to hold or transfer bricks; this requirement grants them only the right to gloss.

#### Scenario: Knight inscribes a gloss
- **WHEN** an authenticated user with `role = 'knight'` sends `POST /api/transfers/:id/comments` with a valid body
- **THEN** the system SHALL create the gloss with that user as author

#### Scenario: Visitor inscribes a gloss
- **WHEN** an authenticated user with `role = 'visitor'` sends `POST /api/transfers/:id/comments` with a valid body
- **THEN** the system SHALL create the gloss with that user as author (no 403 based on role)

#### Scenario: Unauthenticated user attempts to gloss
- **WHEN** a request without a valid session is sent to `POST /api/transfers/:id/comments`
- **THEN** the system SHALL return a 401 status

### Requirement: Gloss validation

The system SHALL require gloss text to be non-empty after trimming and SHALL reject glosses longer than 500 characters. The system SHALL store the trimmed text with the author's user ID and the creation timestamp.

#### Scenario: Empty gloss rejected
- **WHEN** an authenticated user sends `POST /api/transfers/:id/comments` with an empty or whitespace-only body
- **THEN** the system SHALL return a 400 status with an error message indicating the gloss must not be empty

#### Scenario: Overlong gloss rejected
- **WHEN** an authenticated user sends `POST /api/transfers/:id/comments` with a body longer than 500 characters
- **THEN** the system SHALL return a 400 status with an error message indicating the gloss is too long

#### Scenario: Valid gloss stored
- **WHEN** an authenticated user sends `POST /api/transfers/:id/comments` with a valid body
- **THEN** the system SHALL insert a row into `transfer_comments` with `transfer_id`, `author_id`, the trimmed `body`, and `created_at`

#### Scenario: Gloss on non-existent transfer rejected
- **WHEN** an authenticated user sends `POST /api/transfers/:id/comments` for a transfer id that does not exist
- **THEN** the system SHALL return a 404 status

### Requirement: Gloss retrieval

The system SHALL return all glosses for a transfer via `GET /api/transfers/:id/comments`, ordered chronologically (oldest first), each including `id`, `authorId`, `authorName`, `authorRole`, `body`, `createdAt` (ISO), `blottedAt` (ISO or null), `huzzahCount`, and `huzzahedByMe` (whether the requesting user has huzzahed it).

#### Scenario: Glosses returned chronologically
- **WHEN** an authenticated user requests `GET /api/transfers/:id/comments` for a transfer with glosses
- **THEN** the response SHALL list all glosses ordered by creation time ascending, with author display name and role included for each

#### Scenario: Transfer without glosses returns empty list
- **WHEN** an authenticated user requests `GET /api/transfers/:id/comments` for a transfer with no glosses
- **THEN** the system SHALL return an empty array (not an error)

#### Scenario: Comments on non-existent transfer rejected
- **WHEN** an authenticated user requests `GET /api/transfers/:id/comments` for a transfer id that does not exist
- **THEN** the system SHALL return a 404 status

### Requirement: Huzzah reactions are one-shot

The system SHALL allow a user to proclaim "Huzzah!" on a gloss at most once. A `UNIQUE(comment_id, user_id)` constraint SHALL enforce this. The author MAY huzzah their own gloss. Huzzahing a blotted gloss SHALL be rejected. A duplicate attempt SHALL return 409 with an error message the client renders as a localized period rebuke (EN: "Thou hast already proclaimed thy huzzah!").

#### Scenario: First huzzah succeeds
- **WHEN** an authenticated user sends `POST /api/transfers/:id/comments/:commentId/huzzah` for a gloss they have not huzzahed
- **THEN** the system SHALL record the huzzah and return the updated huzzah count

#### Scenario: Duplicate huzzah rejected
- **WHEN** an authenticated user who has already huzzahed a gloss sends the huzzah request again
- **THEN** the system SHALL return a 409 status with an error message indicating the huzzah was already proclaimed

#### Scenario: Huzzah on blotted gloss rejected
- **WHEN** an authenticated user sends a huzzah request for a blotted gloss
- **THEN** the system SHALL return a 409 status

#### Scenario: Huzzah count visible to all
- **WHEN** glosses are retrieved
- **THEN** each gloss SHALL include the total huzzah count and whether the requesting user has huzzahed it

### Requirement: Blotting soft-deletes a gloss

The system SHALL allow a gloss's author to blot it out. Blotting SHALL set `blotted_at` without deleting the row; the gloss SHALL remain in the list rendered as a struck-through, semi-illegible line with the localized copy "Here a word was blotted out." (FR: "Ici un mot fut biffé") instead of its text. Blotting SHALL be author-only (403 otherwise) and idempotent for an already-blotted gloss.

#### Scenario: Author blots own gloss
- **WHEN** the gloss's author sends `POST /api/transfers/:id/comments/:commentId/blot`
- **THEN** the system SHALL set `blotted_at` and the gloss SHALL render as a blotted line for all users

#### Scenario: Non-author attempts to blot
- **WHEN** an authenticated user who is not the gloss's author sends the blot request
- **THEN** the system SHALL return a 403 status

### Requirement: Chiseling hard-deletes a gloss

The system SHALL allow a gloss's author to chisel it from the record entirely. Chiseling SHALL delete the gloss row and its huzzahs. Chiseling SHALL be author-only. Only the author SHALL be offered the chisel action, and only for a gloss they have blotted (chisel follows blot).

#### Scenario: Author chisels a blotted gloss
- **WHEN** the gloss's author sends `DELETE /api/transfers/:id/comments/:commentId` for a gloss they previously blotted
- **THEN** the system SHALL delete the gloss and its huzzahs; it SHALL disappear from the list for all users

#### Scenario: Non-author attempts to chisel
- **WHEN** an authenticated user who is not the gloss's author sends the chisel request
- **THEN** the system SHALL return a 403 status

### Requirement: No gloss editing

The system SHALL NOT provide any means to edit the text of an existing gloss. A scribe's word is writ; the only remedies are blotting and chiseling.

#### Scenario: No edit endpoint
- **WHEN** any request is made to modify a gloss's body after creation
- **THEN** no such endpoint SHALL exist (404 for any unmatched method/path on the comments routes)

### Requirement: Illuminated margin presentation

The expanded chronicle entry SHALL present glosses in a section below the photos, styled as manuscript marginalia: a blackletter-accented header "In þe Margins" (FR: "En marge du récit") with the gloss count in Roman numerals (e.g. "III glosses" / "III gloses"), an empty state ("No glosses yet — be þe first to scribe" / FR equivalent), a beveled `group-box` margin treatment compatible with WindowFrame chrome, and a gloss composer with placeholder "Add thy gloss to þe tale..." (FR equivalent) and a "Affix þy Seal" submit button (FR equivalent). The section SHALL work in both Day and Dungeon themes.

#### Scenario: Margin section appears when entry expands
- **WHEN** a chronicle entry is expanded
- **THEN** the margin section SHALL render below the story and photos with the localized header and gloss count

#### Scenario: Empty margin state
- **WHEN** a transfer has no glosses and its entry is expanded
- **THEN** the margin SHALL display the localized empty-state copy instead of an empty list

#### Scenario: Both themes
- **WHEN** the margin section is rendered in Day mode and in Dungeon mode
- **THEN** ink, seals, and blots SHALL remain legible in both palettes

### Requirement: Ink colors and scribe hand

Each gloss SHALL render its text in an ink color derived deterministically from the author's user ID: knights SHALL draw from a medieval colored-ink palette (iron-gall brown, red ochre, lapis, verdigris, etc.), visitors SHALL render in a humble graphite tone. Each gloss SHALL carry a slight deterministic rotation (hash-derived, within ±1.5°) and a circular wax-seal avatar disc (gold wax for knights, muted wax for visitors). The derivation SHALL be a pure function of the author ID (no randomness at render time).

#### Scenario: Same author, same ink
- **WHEN** two glosses by the same author are rendered anywhere in the app
- **THEN** they SHALL use the identical ink color and rotation

#### Scenario: Knight vs visitor ink
- **WHEN** a knight's gloss and a visitor's gloss are rendered side by side
- **THEN** the knight's text SHALL appear in a colored ink and the visitor's in graphite

### Requirement: Period relative timestamps

Gloss timestamps SHALL be displayed as localized period phrasing rather than clock time: "but now" (moments ago), "this very day" (same day), "yestereve" (previous day), otherwise "N days past" with N rendered in Roman numerals (FR: "à l'instant", "ce jour même", "hier au soir", "il y a N jours"). The phrasing function SHALL be a pure function of (timestamp, now, locale).

#### Scenario: Fresh gloss
- **WHEN** a gloss created less than a minute ago is rendered
- **THEN** its timestamp SHALL display as "but now" (or "à l'instant")

#### Scenario: Old gloss
- **WHEN** a gloss created three days ago is rendered
- **THEN** its timestamp SHALL display as "III days past" (or "il y a III jours")

### Requirement: Huzzah interaction and feedback

Each non-blotted gloss SHALL offer a one-shot "Huzzah!" action with a small seal affordance and the current count; after the user's own huzzah the control SHALL render as spent (disabled or marked, no toggle-off). A duplicate attempt SHALL surface the localized period rebuke via the standard toast system. The huzzah micro-animation SHALL be skipped when `prefers-reduced-motion` is set.

#### Scenario: User huzzahs a gloss
- **WHEN** an eligible user activates the huzzah control on a gloss
- **THEN** the count SHALL increase and the control SHALL render as spent

#### Scenario: Reduced motion
- **WHEN** a user with `prefers-reduced-motion` huzzahs a gloss
- **THEN** the count SHALL update without the micro-animation

### Requirement: Lazy loading of margins

The app SHALL fetch a transfer's glosses only when its chronicle entry is first expanded, mirroring the story's lazy-loading behavior, and SHALL refetch after any gloss mutation so the count and list stay current.

#### Scenario: Expand triggers fetch
- **WHEN** a chronicle entry is expanded for the first time
- **THEN** the app SHALL request `GET /api/transfers/:id/comments` once and render the margin section with the result

#### Scenario: Mutation refreshes margin
- **WHEN** the user inscribes, huzzahs, blots, or chisels a gloss
- **THEN** the margin list SHALL refresh to reflect the change without reloading the page

### Requirement: Bilingual copy and localization plumbing

All user-facing marginalia strings SHALL exist in both `en` and `fr` locales, and the translation hook's key union SHALL be extended to cover them.

#### Scenario: French locale renders margin
- **WHEN** the app language is set to `fr` and a chronicle entry is expanded
- **THEN** all marginalia copy (header, counts, placeholder, empty state, rebukes, blot text, timestamps) SHALL render in French

#### Scenario: English locale renders margin
- **WHEN** the app language is set to `en`
- **THEN** all marginalia copy SHALL render in English with thorn characters used only in headings/buttons per the herald copy register
