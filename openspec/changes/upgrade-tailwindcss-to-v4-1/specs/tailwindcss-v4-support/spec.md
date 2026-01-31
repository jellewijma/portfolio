## ADDED Requirements

### Requirement: CDN Configuration
The portfolio site SHALL use TailwindCSS v4.1 via CDN across all HTML pages.

#### Scenario: Main pages use v4.1 CDN
- **WHEN** visiting index.html or gallery.html
- **THEN** the page loads TailwindCSS from v4.1 CDN URL

#### Scenario: Anthias page uses consistent CDN
- **WHEN** visiting anthias/index.html
- **THEN** the page loads TailwindCSS from same v4.1 CDN URL (not @tailwindcss/browser@4)

### Requirement: Visual Consistency
The site SHALL maintain visual appearance equivalent to TailwindCSS v3 styling after upgrade.

#### Scenario: Dark theme preservation
- **WHEN** viewing any page
- **THEN** dark theme (black background, white/gray text) renders correctly

#### Scenario: Border styling consistency
- **WHEN** viewing grid layouts
- **THEN** border colors (#ffffff26) and widths match v3 appearance

### Requirement: Responsive Design
The site SHALL remain fully responsive across all viewport sizes.

#### Scenario: Mobile navigation
- **WHEN** viewing on mobile screen (< 1280px)
- **THEN** mobile menu toggle functions and navigation appears correctly

#### Scenario: Grid responsiveness
- **WHEN** resizing viewport
- **THEN** image grids adapt from 1 to 4 columns appropriately

### Requirement: Interactive Elements
All interactive elements SHALL function correctly with TailwindCSS v4.1.

#### Scenario: Modal functionality
- **WHEN** page loads
- **THEN** development modal can be dismissed with "Oke" button

#### Scenario: Hover effects
- **WHEN** hovering over photography category cards
- **THEN** grayscale effect toggles correctly (grayscale-0 applied)

### Requirement: Cross-browser Compatibility
The site SHALL work on modern browsers (Chrome, Firefox, Safari, Edge).

#### Scenario: Browser rendering
- **WHEN** loading site in supported browser
- **THEN** TailwindCSS styles apply without layout breaks