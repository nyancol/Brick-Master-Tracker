## MODIFIED Requirements

### Requirement: Dual Palette Theme Toggle
The application SHALL support two visual themes — Day (light, castle-stone wall) and Dungeon (dark, starfield) — and SHALL activate automatically based on the user's device `prefers-color-scheme` preference, with the option for the user to manually override via a theme toggle.

#### Scenario: Light mode activation
- **WHEN** user's device reports `prefers-color-scheme: light` (or user manually selects Day mode)
- **THEN** the application renders with the Day palette (tiled castle-stone wall background, parchment content cards, brass/gold accents, era-default link colors in the footer zone)

#### Scenario: Dark mode activation
- **WHEN** user's device reports `prefers-color-scheme: dark` (or user manually selects Dungeon mode)
- **THEN** the application renders with the Dungeon palette (near-black starfield tile background, bone/gold text, torch GIFs providing accent lighting, dark stone cards)

#### Scenario: Theme transition
- **WHEN** the device theme preference changes while the app is loaded (and user is in system-follow mode)
- **THEN** the application transitions smoothly to the new palette without page reload

#### Scenario: Manual override
- **WHEN** the user manually selects a theme via the toggle
- **THEN** the palette SHALL change immediately to the selected theme
- **AND** the automatic `prefers-color-scheme` detection SHALL be overridden until the user returns to system-follow mode

### Requirement: Medieval Typography Hierarchy
The application SHALL use an era-faithful 1998 web typography hierarchy: a blackletter display font for headings, Times New Roman for body prose, Comic Sans (with fallback) for casual asides, and monospace for odometer digits and small labels.

#### Scenario: Title rendering
- **WHEN** any page-level heading (h1) is rendered
- **THEN** it SHALL use UnifrakturMaguntia (blackletter) with a crisp offset drop shadow (no blur)

#### Scenario: Body text rendering
- **WHEN** any body text or paragraph content is rendered
- **THEN** it SHALL use "Times New Roman", Times, serif with readable leading

#### Scenario: Casual aside rendering
- **WHEN** webmaster asides or fine-print text is rendered (e.g. "best viewed" notice)
- **THEN** it SHALL use "Comic Sans MS" with "Comic Neue" as fallback

#### Scenario: Label and counter rendering
- **WHEN** metadata labels, dates, or visitor-counter digits are rendered
- **THEN** they SHALL use Cutive Mono

#### Scenario: Footer link rendering
- **WHEN** links in the footer webring zone are rendered
- **THEN** they SHALL use the era-default link colors (#0000EE unvisited, #551A8B visited) with underlines

#### Scenario: Font loading
- **WHEN** the application loads
- **THEN** UnifrakturMaguntia and Comic Neue are loaded from Google Fonts; Times New Roman and Comic Sans MS resolve from system fonts with declared fallbacks

### Requirement: Background Texture
The application background SHALL be an obviously repeating tiled texture that is deliberately period-authentic rather than subtle.

#### Scenario: Light mode texture
- **WHEN** the Day theme is active
- **THEN** the background SHALL display a tiled castle-stone wall texture with visible compression artifacts (JPEG-crushed tile), visibly repeating at large viewports

#### Scenario: Dark mode texture
- **WHEN** the Dungeon theme is active
- **THEN** the background SHALL display a near-black starfield tile

#### Scenario: Content readability
- **WHEN** content is rendered over the tiled background
- **THEN** cards SHALL use sufficiently opaque backgrounds so text contrast is maintained

### Requirement: Ornamentation System
The application SHALL combine period animated GIFs, Win98-style bevel chrome, and unicode ornaments for visual framing, replacing the text-only manuscript ornamentation.

#### Scenario: Section dividers
- **WHEN** two distinct content sections are rendered adjacent
- **THEN** the divider between them SHALL be a rainbow/period divider bar (GIF or CSS recreation)

#### Scenario: Card framing
- **WHEN** content is rendered inside a Card component
- **THEN** the card SHALL use bevel/framed styling appropriate to the kitsch theme with visible tiled seams

#### Scenario: Focus ring
- **WHEN** an interactive element receives keyboard focus
- **THEN** the focus ring SHALL remain the golden liseré (gold pulse animation)

### Requirement: Chronicles Illuminated Layout
The Chronicles section SHALL resemble a GeoCities-era illuminated manuscript page, with decorative year headings in Roman numerals, parchment entry cards with visible seams, illuminated drop caps, and period GIF ornamentation.

#### Scenario: Year heading
- **WHEN** transfers for a given year are displayed
- **THEN** the year heading SHALL be presented as "ANNO DOMINI" with Roman numerals (e.g., ANNO DOMINI MMXXV)

#### Scenario: Transfer entry styling
- **WHEN** a transfer entry is rendered
- **THEN** it SHALL be styled as a parchment card with visible tiled seams rather than a flat modern card

#### Scenario: Story text display
- **WHEN** a transfer's story description is displayed
- **THEN** the first letter SHALL be rendered as an illuminated drop cap (blackletter, ~3em floated)

#### Scenario: Photo miniature styling
- **WHEN** transfer photos are displayed in the photo gallery
- **THEN** each photo SHALL be framed with a gold-toned border evoking illuminated miniatures

#### Scenario: Section header
- **WHEN** the Chronicles section title is rendered
- **THEN** it SHALL be accompanied by a scroll/parchment period GIF

### Requirement: Medieval Animation Language
The application SHALL use animations combining retained manuscript interactions (unfurl, seal stamp, gold pulse) with era-appropriate marquee scrolling.

#### Scenario: Chronicle entry expansion
- **WHEN** a user expands a chronicle entry
- **THEN** the content SHALL animate in with an "unfurl" effect (scaleY from 0 to 1, origin at top)

#### Scenario: Modal appearance
- **WHEN** the transfer confirmation modal opens
- **THEN** the modal SHALL animate in with a "seal stamp" effect (scale from small to full with a subtle bounce)

#### Scenario: Focus ring animation
- **WHEN** an element receives focus
- **THEN** the focus ring SHALL pulse with a gold glow animation at low intensity

#### Scenario: Marquee scrolling
- **WHEN** the "Hear Ye!" herald marquee is rendered with content wider than its container
- **THEN** the content SHALL scroll horizontally in a continuous loop

#### Scenario: Reduced motion
- **WHEN** the user has `prefers-reduced-motion` enabled
- **THEN** the marquee SHALL render as static (non-scrolling) text and looping decorative animations SHALL be paused

### Requirement: Login and Error Page Theme
The login page and 404 page SHALL adopt the kitsch theme with blackletter titles, period GIFs, and beveled controls.

#### Scenario: Login page styling
- **WHEN** the login page is rendered
- **THEN** a castle-gate period GIF SHALL accompany the title, the title SHALL use blackletter, and the sign-in button SHALL use bevel styling

#### Scenario: 404 page styling
- **WHEN** the not-found page is rendered
- **THEN** it SHALL use the kitsch card styling with blackletter title and themed copy ("Halt! Who goes there?")

## ADDED Requirements

### Requirement: Kitsch Page Furniture
The application SHALL include classic 1998 page furniture: a scrolling "Hear Ye!" herald marquee, an odometer visitor counter, a "Ye Olde Brick Webring" footer, a "Best viewed in Netscape Navigator 4.0 at 800×600" badge, 88×31 web buttons, and an "Under construction by þe King's Masons" badge.

#### Scenario: Marquee displays latest transfer
- **WHEN** at least one transfer exists
- **THEN** the marquee SHALL display the latest transfer as a herald announcement (e.g. "Hear Ye! The Brick of Honor hath passed unto Sir Yann!")
- **AND** the announcement SHALL scroll continuously unless `prefers-reduced-motion` is set

#### Scenario: Marquee empty state
- **WHEN** no transfers exist
- **THEN** the marquee SHALL display a static herald call

#### Scenario: Visitor counter display
- **WHEN** any page footer is rendered
- **THEN** a visitor counter SHALL display as mono digits in bordered odometer cells

#### Scenario: Visitor counter increments
- **WHEN** the user loads the page
- **THEN** the displayed count SHALL equal a large base (41,000) plus the locally persisted visit count (localStorage), incremented per visit

#### Scenario: Webring footer
- **WHEN** the footer is rendered
- **THEN** it SHALL include a "Ye Olde Brick Webring" bar with prev/random/next links using era-default link styling

#### Scenario: Best viewed badge
- **WHEN** the footer is rendered
- **THEN** a "Best viewed in Netscape Navigator 4.0 at 800×600" notice SHALL be displayed in fine print (Comic Sans)

#### Scenario: 88×31 badges
- **WHEN** the footer is rendered
- **THEN** at least two 88×31 style web badges SHALL be displayed (e.g. medieval/period-themed, rendered as SVG or period GIFs)

#### Scenario: Construction badge
- **WHEN** the footer is rendered
- **THEN** an "Under construction by þe King's Masons" badge SHALL be displayed with a knight/mason period GIF

### Requirement: Bevel Chrome System
Interactive chrome SHALL use Win98-style bevel styling recast as carved stone / brass plaques.

#### Scenario: Button default state
- **WHEN** a Button is rendered
- **THEN** it SHALL use an outset bevel border (light top-left, dark bottom-right edges)

#### Scenario: Button pressed state
- **WHEN** a Button is active/pressed
- **THEN** the bevel SHALL invert to an inset style

#### Scenario: Card framing
- **WHEN** a card or panel is rendered
- **THEN** it SHALL use the bevel chrome appropriate to its surface (stone card, brass plaque)

### Requirement: Period GIF Ornamentation
The application SHALL use authentic period animated GIFs downloaded locally into `public/gifs/` as ornamentation at their native pixel dimensions, with source attribution recorded.

#### Scenario: Title dragon
- **WHEN** the home page header is rendered
- **THEN** a dragon period GIF SHALL be displayed beside the title

#### Scenario: Torch flanking
- **WHEN** the brick cards are rendered
- **THEN** torch/flame period GIFs SHALL flank the brick presentation (accent lighting in Dungeon mode)

#### Scenario: Shame skull
- **WHEN** the Brick of Shame card is rendered
- **THEN** a skull period GIF SHALL be displayed as a warning mark

#### Scenario: Construction knight
- **WHEN** the construction badge is rendered
- **THEN** a knight/mason period GIF SHALL be displayed

#### Scenario: Local assets and attribution
- **WHEN** GIFs are used anywhere in the app
- **THEN** they SHALL be served from `public/gifs/` (no hotlinking) and their source URLs SHALL be recorded in `public/gifs/CREDITS.md`

### Requirement: Era-Fidelity Broken Details
The application SHALL deliberately include lovingly-wrong period details: JPEG-crushed background tile, non-uniform GIF scaling in one location, era-default footer link colors, and slightly inconsistent section margins.

#### Scenario: Crushed tile
- **WHEN** the stone background tile is used
- **THEN** it SHALL visibly carry JPEG compression artifacts (crushed at ~quality 15)

#### Scenario: Non-uniform scaling
- **WHEN** the construction badge GIF is rendered
- **THEN** it SHALL be stretched slightly non-uniformly (~103% width)

#### Scenario: Uneven rhythm
- **WHEN** adjacent footer sections are rendered
- **THEN** vertical margins MAY differ slightly between sections (era-authentic inconsistency, not a defect)

### Requirement: Herald Copy Register
UI copy SHALL shift to a herald register in both EN and FR, with thorn characters used sparingly (headings and buttons only) and meta-text kept readable.

#### Scenario: Transfer copy
- **WHEN** transfer actions are displayed in English
- **THEN** "Bestow upon" SHALL be used for the honor transfer target and "Set þe Seal" for the confirm action

#### Scenario: Session copy
- **WHEN** the logout and loading states are displayed in English
- **THEN** "Flee þe Keep" and "Summoning þe bricks..." SHALL be used

#### Scenario: French copy
- **WHEN** the app is used in French
- **THEN** the corresponding French register strings SHALL be used (e.g. "Sceller à jamais", "Fuir le donjon", "Invocation des briques...")

#### Scenario: Brick names preserved
- **WHEN** brick names are displayed
- **THEN** the existing i18n brick name strings SHALL remain unchanged
