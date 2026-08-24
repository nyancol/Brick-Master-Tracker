## Purpose

This spec defines the medieval manuscript-inspired visual design system for the Brick Master Tracker, covering dual light/dark palettes, typography, textures, ornamentation, icons, chronicles layout, animations, and page themes.

## Requirements

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

### Requirement: Medieval Typography Hierarchy
The application SHALL use three distinct fonts forming a medieval typographic hierarchy: a display serif for titles, a body serif for prose, and a monospace for labels/metadata.

#### Scenario: Title rendering
- **WHEN** any page-level heading (h1) is rendered
- **THEN** it SHALL use Cinzel with extra-bold weight, uppercase, and expanded letter-spacing

#### Scenario: Body text rendering
- **WHEN** any body text or paragraph content is rendered
- **THEN** it SHALL use EB Garamond regular with appropriate leading for readability

#### Scenario: Label and metadata rendering
- **WHEN** metadata labels, dates, or UI chrome text is rendered
- **THEN** it SHALL use Cutive Mono with uppercase tracking

#### Scenario: Font loading
- **WHEN** the application loads
- **THEN** all three fonts (Cinzel, EB Garamond, Cutive Mono) are loaded from Google Fonts with subset and weight optimization

### Requirement: Background Texture
The application background SHALL include a subtle texture effect that enhances the medieval aesthetic without impairing readability.

#### Scenario: Light mode texture
- **WHEN** the Manuscript theme is active
- **THEN** the background SHALL display a subtle parchment-like grain via CSS gradients at low opacity

#### Scenario: Dark mode texture
- **WHEN** the Scriptorium theme is active
- **THEN** the background SHALL display a candlelit radial glow effect centered at the top of the viewport

### Requirement: Ornamentation System
The application SHALL use decorative elements — Unicode fleurons, CSS borders, and minimal inline SVGs — to create medieval visual framing without external image assets.

#### Scenario: Section dividers
- **WHEN** two distinct content sections are rendered adjacent
- **THEN** the divider between them SHALL include Unicode fleuron characters (e.g., ❦ ❧ ✦) or decorative CSS rules

#### Scenario: Card framing
- **WHEN** content is rendered inside a Card component
- **THEN** the card SHALL use less rounded corners and double-border or framed styling appropriate to the medieval theme

#### Scenario: Focus ring
- **WHEN** an interactive element receives keyboard focus
- **THEN** the focus ring SHALL be a golden liseré (gold pulse animation) rather than the current purple neon

### Requirement: Heraldic Icon Mapping
The application SHALL use medieval-appropriate Lucide icon names throughout the UI, replacing the current cyberpunk-aligned icon choices without changing the icon library.

#### Scenario: User avatar replacement
- **WHEN** a user display name is shown with an icon
- **THEN** the Shield icon SHALL be used in place of the User icon

#### Scenario: Chronicle section icon
- **WHEN** the Chronicles section header is rendered
- **THEN** the ScrollText icon SHALL be used in place of the BookOpen icon

#### Scenario: Edit action icon
- **WHEN** an inline edit button is rendered
- **THEN** the Feather icon SHALL be used in place of the Pencil icon

#### Scenario: Logout icon
- **WHEN** the logout link is rendered
- **THEN** the DoorOpen icon SHALL be used in place of the LogOut icon

### Requirement: Chronicles Illuminated Layout
The Chronicles section SHALL be redesigned to resemble an illuminated manuscript page, with decorative year headings in Roman numerals, entries framed as manuscript pages, and story text in italic serif.

#### Scenario: Year heading
- **WHEN** transfers for a given year are displayed
- **THEN** the year heading SHALL include decorative rules and fleurons, presented as "ANNO DOMINI" with Roman numerals (e.g., ANNO DOMINI MMXXV)

#### Scenario: Transfer entry styling
- **WHEN** a transfer entry is rendered
- **THEN** it SHALL be styled as a framed manuscript page with a fleuron bullet (✦) and a subtle border, distinct from the current flat card style

#### Scenario: Story text display
- **WHEN** a transfer's story description is displayed
- **THEN** it SHALL render in EB Garamond italic to evoke handwritten chronicle entries

#### Scenario: Photo miniature styling
- **WHEN** transfer photos are displayed in the photo gallery
- **THEN** each photo SHALL be framed with a gold-toned border evoking illuminated miniatures

#### Scenario: Section header
- **WHEN** the Chronicles section title is rendered
- **THEN** it SHALL be framed by double ornamental rules above and below the title text

### Requirement: Medieval Animation Language
The application SHALL use animations that evoke medieval manuscript interactions — scroll unfurling, seal stamping, and gold pulsing — replacing the current linear slide-up and neon hover effects.

#### Scenario: Chronicle entry expansion
- **WHEN** a user expands a chronicle entry
- **THEN** the content SHALL animate in with an "unfurl" effect (scaleY from 0 to 1, origin at top)

#### Scenario: Modal appearance
- **WHEN** the transfer confirmation modal opens
- **THEN** the modal SHALL animate in with a "seal stamp" effect (scale from small to full with a subtle bounce)

#### Scenario: Focus ring animation
- **WHEN** an element receives focus
- **THEN** the focus ring SHALL pulse with a gold glow animation at low intensity

#### Scenario: Card hover
- **WHEN** the user hovers over a brick card
- **THEN** the card SHALL respond with a subtle tilt effect rather than the current scale-up

### Requirement: Login and Error Page Theme
The login page and 404 page SHALL adopt the medieval theme with appropriate typography, colors, and ornamentation.

#### Scenario: Login page styling
- **WHEN** the login page is rendered
- **THEN** the title SHALL use Cinzel display font, the background SHALL include texture, and the sign-in button SHALL be styled heraldically

#### Scenario: 404 page styling
- **WHEN** the not-found page is rendered
- **THEN** it SHALL use the medieval card styling, serif typography, and themed color palette

### Requirement: Brick Presentation Preservation
The red and blue brick images, names, and their visual identity SHALL remain unchanged — they act as modern relics displayed within heraldic framing.

#### Scenario: Brick image display
- **WHEN** a brick card is rendered
- **THEN** the existing brick PNG images (`/red-brick.png`, `/blue-brick.png`) SHALL be displayed without visual modification

#### Scenario: Brick naming
- **WHEN** brick names are displayed
- **THEN** the existing i18n keys for honor/shame brick names SHALL be used without modification to their text content