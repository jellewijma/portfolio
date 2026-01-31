## 1. Preparation

- [ ] 1.1 Backup current HTML files (index.html, gallery.html, anthias/index.html)
- [ ] 1.2 Research exact TailwindCSS v4.1 CDN URL (confirm `https://cdn.tailwindcss.com/v4` is correct)
- [ ] 1.3 Set up local testing environment with `python3 -m http.server 8000`

## 2. CDN Updates

- [ ] 2.1 Update index.html: replace `https://cdn.tailwindcss.com` with v4.1 CDN URL
- [ ] 2.2 Update gallery.html: replace `https://cdn.tailwindcss.com` with v4.1 CDN URL
- [ ] 2.3 Update anthias/index.html: replace `https://unpkg.com/@tailwindcss/browser@4` with v4.1 CDN URL

## 3. Testing & Verification

- [ ] 3.1 Test index.html at viewports: 320px (mobile), 768px (tablet), 1024px (desktop), 1920px (wide)
- [ ] 3.2 Test gallery.html at same viewports
- [ ] 3.3 Test anthias/index.html functionality (video playback, FPS counter)
- [ ] 3.4 Verify mobile menu toggle works on all pages
- [ ] 3.5 Confirm modal dismissal with "Oke" button works
- [ ] 3.6 Check hover effects on photography category cards (grayscale toggle)
- [ ] 3.7 Validate border styling consistency (#ffffff26 borders)
- [ ] 3.8 Confirm dark theme (black background, white/gray text) renders correctly
- [ ] 3.9 Test cross-browser compatibility in Chrome, Firefox, Safari, Edge dev tools

## 4. Deployment

- [ ] 4.1 Commit changes with message "upgrade: TailwindCSS to v4.1"
- [ ] 4.2 Push to main branch for GitHub Pages deployment
- [ ] 4.3 Verify live site functions correctly after deployment
- [ ] 4.4 Document any observed differences or adjustments needed