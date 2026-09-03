# window-chrome Specification

## Purpose

This spec defines the Win98-style window chrome for the Brick Master Tracker, covering the brick panel windows, transfer group box, status bars, transfer modal dialog chrome, tooltip styling, and internationalization of all chrome strings.

## Requirements

### Requirement: Brick Panel Window Chrome
The Honor and Shame brick panels SHALL be rendered as authentic Win98-style windows on top of the existing bevel frame, preserving the existing `HONOR.EXE` / `SHAME.EXE` title bar text, brick images, and holder display.

#### Scenario: Title bar window buttons
- **WHEN** a brick panel window is rendered
- **THEN** its title bar SHALL display three window buttons (`_`, `□`, `✕`) styled as Win98 bevel buttons

#### Scenario: Decorative buttons
- **WHEN** the user hovers the `_` or `□` button
- **THEN** a period-appropriate tooltip SHALL appear (e.g. "Nothing to minimize, my liege")
- **AND** clicking either button SHALL perform no window action

#### Scenario: Close button behavior
- **WHEN** the user clicks the `✕` button on a brick window
- **THEN** the window SHALL play a shake animation
- **AND** a toast SHALL appear with a medieval refusal message (e.g. "Thou canst not close the Honor!")

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion` is set
- **THEN** the `✕` click SHALL show the refusal toast without the shake animation

#### Scenario: Themed chrome
- **WHEN** either Day (light) or Dungeon (dark) theme is active
- **THEN** the window chrome (title bar gradient, bevel borders) SHALL use the theme's bevel color variables, preserving each brick's red/blue title bar identity

### Requirement: Transfer Group Box
The transfer recipient buttons SHALL be framed in a Win98-style group box with an etched border and a legend label.

#### Scenario: Group box rendering
- **WHEN** the brick holder's transfer buttons are rendered
- **THEN** they SHALL be surrounded by a group box whose legend reads "Bestow upon:" (Honor) or "Offload upon:" (Shame) using the existing i18n keys

#### Scenario: Non-holder state
- **WHEN** the viewing user is not the holder
- **THEN** the group box SHALL NOT be rendered (existing waiting message remains)

### Requirement: Brick Window Status Bar
Each brick window SHALL include a status bar strip below the content.

#### Scenario: Status bar contents
- **WHEN** a brick window is rendered
- **THEN** the status bar SHALL show a brick count ("1 brick(s)") on the left
- **AND** the days the current holder has held the brick on the right, followed by an era joke label (e.g. "56k modem")

#### Scenario: Days held computation
- **WHEN** the status bar is rendered
- **THEN** days held SHALL be computed client-side from the most recent transfer timestamp for that brick color (0 days on the day of transfer)

### Requirement: Transfer Modal Dialog Chrome
The transfer modal SHALL be rendered as a Win98 dialog window with a titled title bar, replacing the current borderless header.

#### Scenario: Dialog title bar
- **WHEN** the transfer modal opens
- **THEN** it SHALL display a title bar reading "Bestow the Brick — {name}" (Honor) or "Offload the Brick — {name}" (Shame)
- **AND** the title bar SHALL include a working `✕` button that cancels the modal

#### Scenario: Animation preserved
- **WHEN** the transfer modal opens
- **THEN** the existing seal-stamp entry animation and gold corner ornaments SHALL remain

#### Scenario: Status bar
- **WHEN** the transfer modal is rendered
- **THEN** a slim status bar SHALL show the recipient name and era joke label

### Requirement: Window Chrome Internationalization
All window chrome strings (tooltips, refusal toasts, status bar labels, dialog titles) SHALL be provided in both `en` and `fr` locales.

#### Scenario: Locale switching
- **WHEN** the user switches language
- **THEN** all window chrome strings SHALL render in the selected locale

### Requirement: Window Tooltip Style
Tooltips on window chrome SHALL use the Win98 tooltip style: pale yellow background, 1px dark border, small text.

#### Scenario: Tooltip rendering
- **WHEN** a window chrome tooltip is shown
- **THEN** it SHALL render as a styled element (pale yellow `#FFFFE1` background, 1px black border, small sans/mono text), not the browser-native `title` attribute
