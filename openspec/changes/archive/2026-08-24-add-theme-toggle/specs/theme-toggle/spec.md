## ADDED Requirements

### Requirement: Manual Theme Toggle
The application SHALL provide a manual theme toggle that allows the user to select between three modes — Manuscript (light), Scriptorium (dark), or System (follow device preference) — overriding the automatic `prefers-color-scheme` detection.

#### Scenario: Theme toggle displays three states
- **WHEN** the theme toggle button is rendered
- **THEN** it SHALL display a sun icon representing light mode and a moon icon representing dark mode
- **AND** the active mode's icon SHALL be visually distinguished (e.g., gold color, glow, or ring)
- **AND** the inactive icon SHALL appear muted (e.g., muted foreground color)

#### Scenario: Switch to light mode
- **WHEN** the user clicks the sun icon
- **THEN** the application SHALL render with the Manuscript palette
- **AND** the preference SHALL be persisted to localStorage
- **AND** the moon icon SHALL appear muted, the sun icon SHALL appear active

#### Scenario: Switch to dark mode
- **WHEN** the user clicks the moon icon
- **THEN** the application SHALL render with the Scriptorium palette
- **AND** the preference SHALL be persisted to localStorage
- **AND** the sun icon SHALL appear muted, the moon icon SHALL appear active

#### Scenario: Switch to system mode
- **WHEN** the user clicks the active icon or a third "system" option
- **THEN** the application SHALL revert to following the device `prefers-color-scheme` preference
- **AND** the preference SHALL be persisted to localStorage as "system"
- **AND** the effective theme SHALL update automatically when the device preference changes

#### Scenario: Theme survives page reload
- **WHEN** the user selects a theme and reloads the page
- **THEN** the selected theme SHALL be applied on the next page load without flicker

#### Scenario: Default to system preference
- **WHEN** no theme preference is stored in localStorage
- **THEN** the application SHALL default to following the device `prefers-color-scheme` preference

### Requirement: Theme Context Provider
The application SHALL provide a React context that exposes the current theme state and a setter to any consuming component.

#### Scenario: ThemeProvider wraps the application
- **WHEN** the application renders
- **THEN** a ThemeProvider SHALL wrap all pages and components
- **AND** it SHALL expose at minimum: `theme` (user choice: "light" | "dark" | "system"), `setTheme` (setter), and `resolvedTheme` ("light" | "dark", the effective mode)
- **AND** it SHALL manage the `.dark` class on the `<html>` element

#### Scenario: Theme change applies to all pages
- **WHEN** the user changes the theme
- **THEN** all pages and components SHALL update to reflect the new theme without a page reload

### Requirement: Flicker Prevention
The application SHALL prevent a flash of the wrong theme on page load when the user has a dark preference or a stored theme selection.

#### Scenario: Blocking script prevents flicker
- **WHEN** the page loads
- **THEN** a blocking script in `<head>` SHALL read localStorage and `matchMedia` before the first paint
- **AND** it SHALL apply or remove the `.dark` class on `<html>` synchronously
- **THEN** the first render SHALL use the correct theme palette