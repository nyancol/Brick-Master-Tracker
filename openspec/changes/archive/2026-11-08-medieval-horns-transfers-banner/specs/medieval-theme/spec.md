## MODIFIED Requirements

### Requirement: Kitsch Page Furniture
The application SHALL include classic 1998 page furniture: a scrolling "Hear Ye!" herald marquee, an odometer visitor counter, a "Ye Olde Brick Webring" footer, a "Best viewed in Netscape Navigator 4.0 at 800×600" badge, 88×31 web buttons, and an "Under construction by þe King's Masons" badge.

#### Scenario: Marquee displays latest transfer
- **WHEN** at least one transfer exists
- **THEN** the marquee SHALL display the latest transfer as a herald announcement (e.g. "Hear Ye! The Brick of Honor hath passed unto Sir Yann!")
- **AND** the announcement SHALL scroll continuously unless `prefers-reduced-motion` is set
- **AND** the scrolling announcement SHALL be flanked by a mirrored pair of horn-herald period GIFs (left and right, facing inward) at native pixel dimensions, rendered outside the scrolling text element

#### Scenario: Marquee empty state
- **WHEN** no transfers exist
- **THEN** the marquee SHALL display a static herald call
- **AND** the horn-herald pair SHALL still flank the bar

#### Scenario: Marquee reduced motion
- **WHEN** the user has `prefers-reduced-motion` enabled
- **THEN** the marquee text SHALL render as static (non-scrolling) text
- **AND** the horn-herald GIFs SHALL render as a static first-frame image instead of the animated GIF

#### Scenario: Marquee horns are decorative
- **WHEN** the marquee is rendered with horn-herald GIFs
- **THEN** the horn images SHALL be hidden from assistive technology (`aria-hidden`, empty alt) so the marquee's announcement text remains the single accessible name

#### Scenario: Visitor counter display
- **WHEN** any page footer is rendered
- **THEN** a visitor counter SHALL display as mono digits in bordered odometer cells

#### Scenario: Visitor counter increments
- **WHEN** the page loads and the visit is registered
- **THEN** the displayed count SHALL equal the server-persisted visit count shared across all visitors, starting from 0, with no artificial base added

#### Scenario: Visitor counter deduplicates within a browser session
- **WHEN** the page is loaded again in the same browser session (cookie present)
- **THEN** the visit SHALL NOT be incremented and the previously recorded count SHALL be displayed

#### Scenario: Visitor counter count service unavailable
- **WHEN** the visit count cannot be fetched from the server
- **THEN** the counter SHALL display `0000000` and SHALL NOT fall back to any locally persisted count

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

#### Scenario: Herald horns flanking the marquee
- **WHEN** the "Hear Ye!" herald marquee is rendered
- **THEN** a horn-herald period GIF (herald blowing a horn, or fallback trumpet/herald figure) SHALL flank the announcement on both sides as a mirrored pair at native pixel dimensions

#### Scenario: Local assets and attribution
- **WHEN** GIFs are used anywhere in the app
- **THEN** they SHALL be served from `public/gifs/` (no hotlinking) and their source URLs SHALL be recorded in `public/gifs/CREDITS.md`
