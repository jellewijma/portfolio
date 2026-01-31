## Context

The portfolio site currently uses TailwindCSS v3 via CDN (`https://cdn.tailwindcss.com`) across main pages (index.html, gallery.html). The anthias subdirectory uses TailwindCSS v4 via `@tailwindcss/browser@4` from unpkg. This inconsistency creates maintenance overhead and misses performance benefits of TailwindCSS v4.1. The site is static HTML with no build system, relying entirely on CDN-delivered CSS.

## Goals / Non-Goals

**Goals:**
- Upgrade all pages to TailwindCSS v4.1 using a consistent CDN source
- Maintain visual consistency with existing v3 styling
- Ensure responsive design, dark theme, and interactive elements continue working
- Complete upgrade with minimal risk through thorough testing

**Non-Goals:**
- Rewriting custom CSS or changing design system
- Introducing build tools or local Tailwind compilation
- Adding new visual features beyond v4 compatibility
- Modifying content or page structure

## Decisions

1. **CDN Selection**: Use `https://cdn.tailwindcss.com/v4` as the primary CDN for all pages.
   - **Rationale**: Official TailwindCSS v4 CDN, consistent with upgrade path from v3, better performance than unpkg.
   - **Alternative considered**: `https://unpkg.com/@tailwindcss/browser@4` (currently used by anthias) – rejected to align with main pages and use official distribution.

2. **Breaking Changes Mitigation**: Manual visual testing across all viewports and interactive elements.
   - **Rationale**: No automated tests exist; manual verification ensures no regressions.
   - **Alternative considered**: Creating test suite – rejected due to time investment vs. small static site.

3. **Update Approach**: Direct CDN URL replacement followed by incremental testing.
   - **Rationale**: Simple, low-risk change; can be rolled back instantly by reverting CDN URL.
   - **Alternative considered**: Gradual rollout (one page at a time) – rejected because pages share same CSS source.

4. **Browser Compatibility**: Target modern browsers (Chrome, Firefox, Safari, Edge) without polyfills.
   - **Rationale**: TailwindCSS v4 uses modern CSS features compatible with browsers supporting CSS Grid and Flexbox.
   - **Alternative considered**: Adding legacy browser support – rejected as portfolio audience uses modern browsers.

## Risks / Trade-offs

**Risks:**
- [Breaking changes in v4.1 affect layout] → Mitigation: Test each page at mobile/tablet/desktop breakpoints.
- [CDN reliability] → Mitigation: Use same CDN provider (cdn.tailwindcss.com) with proven uptime.
- [Browser-specific rendering issues] → Mitigation: Test in Chrome, Firefox, Safari, Edge dev tools.

**Trade-offs:**
- Simplicity vs. robustness: Choosing manual testing over automated tests reduces upfront effort but increases risk of missing edge cases.
- Consistency vs. flexibility: Unifying CDN source simplifies maintenance but removes option to use different Tailwind versions per page.

## Migration Plan

1. **Preparation**: Backup current HTML files.
2. **Implementation**: Update CDN URLs in index.html, gallery.html, and anthias/index.html.
3. **Testing**:
   - Visual inspection of each page at 320px, 768px, 1024px, 1920px viewports
   - Verify mobile menu functionality
   - Confirm modal dismissal works
   - Check hover effects on photography categories
   - Validate border styling and dark theme
4. **Deployment**: Push changes to main branch for automatic GitHub Pages deployment.
5. **Rollback**: If issues emerge, revert CDN URLs to previous v3 version.

## Open Questions

- Exact CDN URL for TailwindCSS v4.1: Confirm `https://cdn.tailwindcss.com/v4` serves latest v4.1.
- Anthias page FPS counter compatibility: Ensure JavaScript FPS counter still functions with new CDN.