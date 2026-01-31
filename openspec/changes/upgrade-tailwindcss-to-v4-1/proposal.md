## Why

Upgrade TailwindCSS from v3 to v4.1 to leverage performance improvements, new features, and ensure long-term support. The current CDN uses TailwindCSS v3 which is outdated, while v4.1 offers better developer experience, smaller bundle sizes, and modern CSS features. This upgrade will future-proof the portfolio site and allow use of the latest Tailwind utilities.

## What Changes

- **Update CDN URLs**: Replace `https://cdn.tailwindcss.com` (v3) with v4.1 CDN URL across all HTML files
- **Verify breaking changes**: Test and adapt any Tailwind classes affected by v4 breaking changes (color system, spacing, typography)
- **Ensure consistency**: Update anthias page to use same v4.1 CDN (currently uses `@tailwindcss/browser@4`)
- **Testing**: Validate responsive design, dark theme, and interactive elements work correctly with v4.1

## Capabilities

### New Capabilities
- `tailwindcss-v4-support`: Consistent TailwindCSS v4.1 integration across the portfolio site, including CDN configuration, class compatibility, and responsive design verification

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- **Affected code**: All HTML files using Tailwind classes (`index.html`, `gallery.html`, `anthias/index.html`)
- **Dependencies**: Changes from TailwindCSS v3 to v4.1 CDN
- **Systems**: GitHub Pages deployment remains unchanged (static CDN)
- **Visual impact**: May require minor CSS adjustments due to breaking changes in v4.1
- **Testing required**: Cross-browser compatibility, mobile responsiveness, and dark theme preservation