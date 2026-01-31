# Agent Guidelines for jellewijma.github.io

This document provides guidelines for agentic coding assistants working in this repository. The project is a static portfolio website built with HTML, Tailwind CSS, and minimal vanilla JavaScript.

## Repository Overview

- **Type**: Static website (no build system, no framework)
- **Primary Technologies**: HTML5, Tailwind CSS (via CDN), vanilla JavaScript
- **Deployment**: GitHub Pages (serves files directly from root)
- **No package.json**, **no bundler**, **no test suite**

## AI Assistant Rules
No Cursor rules (`.cursor/rules/` or `.cursorrules`) or Copilot rules (`.github/copilot-instructions.md`) are present in this repository.

## Build/Lint/Test Commands

### Development Server
Since there is no build process, you can serve the site locally with any static HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (if you have `serve` installed)
npx serve .

# PHP
php -S localhost:8000
```

The repository includes a VS Code Live Server configuration (port 5501) in `.vscode/settings.json`.

### Linting & Formatting
There are no configured linters or formatters. However, you can:

1. **HTML Validation**: Use the W3C validator (https://validator.w3.org/)
2. **CSS Validation**: Validate inline styles with W3C CSS Validator
3. **Manual code review**: Ensure consistency with existing patterns

### Testing
No automated tests exist. Manual testing includes:
- Checking responsiveness across viewport sizes
- Verifying interactive elements (modals, mobile menu)
- Ensuring images load correctly
- Validating semantic HTML structure

## Code Style Guidelines

### General Principles
- **Keep it simple**: This is a static site; avoid unnecessary complexity.
- **Progressive enhancement**: Ensure core content works without JavaScript.
- **Accessibility**: Use semantic HTML, ARIA attributes where needed, and ensure keyboard navigation.
- **Performance**: Optimize images, minimize inline script size, leverage browser caching.

### HTML Conventions
- **Doctype**: Use `<!DOCTYPE html>`
- **Language**: Always set `lang="en"` on `<html>` tag
- **Viewport**: Include `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- **Character encoding**: Always include `<meta charset="UTF-8">`
- **Indentation**: 4 spaces (consistent with existing files)
- **Quotes**: Double quotes for attributes
- **Self-closing tags**: Use explicit closing (`<img src="..." alt="">`) or self‑closing slash for SVG elements
- **Semantic elements**: Prefer `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>` over generic `<div>` where appropriate
- **ID and class names**: Use kebab‑case (e.g., `mobile-menu`, `modal-title`)
- **Inline scripts**: Place `<script>` tags just before `</body>` unless they need to be in `<head>`

### Tailwind CSS Conventions
- **CDN usage**: The site uses Tailwind via CDN (`https://cdn.tailwindcss.com`). Do not introduce a local Tailwind build without explicit approval.
- **Class ordering**: Follow the [Tailwind CSS class order](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier#how-classes-are-sorted) (roughly: layout → flex/grid → spacing → typography → visual effects → transforms).
- **Responsive prefixes**: Group responsive variants together (e.g., `h-[50%] xl:h-full`).
- **Arbitrary values**: Use square‑bracket notation for custom values (e.g., `h-[88px]`, `border-[#ffffff26]`).
- **Custom styles**: For one‑off styles that Tailwind doesn't cover, add a `<style>` block at the end of the HTML file, before the closing `</body>` tag.
- **Avoid inline styles**: Prefer Tailwind classes; only use `style=` for dynamic values set by JavaScript.

### JavaScript Conventions
- **Vanilla JS only**: No frameworks (React, Vue, etc.) unless explicitly requested.
- **Script placement**: Place `<script>` blocks at the end of the file, after the closing `</main>` and `</footer>` but before `</body>`.
- **Event listeners**: Use `addEventListener` instead of `onclick` attributes.
- **Variable declarations**: Use `const` for values that won't be reassigned, `let` otherwise. Avoid `var`.
- **Function definitions**: Use regular functions (`function foo() {}`) for top‑level definitions; arrow functions for callbacks.
- **DOM queries**: Cache references to DOM elements when reused.
- **Error handling**: Wrap risky operations in `try...catch` if appropriate.
- **Modal/menu interactions**: Follow the existing pattern: toggle classes (`opacity-0`, `opacity-100`, `display: none`).

### File Organization
- **Root directory**: Contains `.html` files (index.html, gallery.html, etc.)
- **`/images`**: Store all static images (JPEG, PNG, etc.)
- **`/resources`**: Store design assets (mockups, source images)

- **`.vscode/`**: Editor‑specific settings (live‑server port)
- **No `src/` or `dist/` directories** – the repository is the deployment artifact.

### Git Guidelines
- **Branch naming**: Use descriptive names (`feature/add-contact-form`, `fix/mobile-menu-overflow`)
- **Commit messages**: Use imperative mood, concise summary (≤50 chars), optional body explaining *why*
- **Merge strategy**: Prefer squash‑and‑merge for feature branches
- **Deployment**: Pushing to `main` automatically deploys to GitHub Pages

## Agent‑Specific Instructions

### Before Making Changes
1. **Examine existing patterns**: Look at `index.html` and `gallery.html` for styling and scripting conventions.
2. **Check for similar components**: If adding a new page, copy the structure from an existing one.
3. **Verify image paths**: All image references should use root‑relative paths (starting with `/`).

### When Adding New Features
1. **Keep JavaScript minimal**: If interactivity can be achieved with CSS (e.g., `:hover`, `:focus`), prefer CSS.
2. **Test on mobile**: Use browser devtools to simulate various screen sizes.
3. **Ensure accessibility**: Add `alt` text to images, use ARIA labels for interactive elements, maintain keyboard navigation.

### When Editing Existing Code
1. **Preserve indentation**: The existing code uses 4‑space indents; do not mix tabs and spaces.
2. **Update both HTML and JS**: If you change an `id` or `class`, update any JavaScript that references it.
3. **Check for broken references**: After renaming or moving files, update all `href` and `src` attributes.

### After Changes
1. **Manual smoke test**: Open the changed page(s) in a browser and verify:
   - No JavaScript errors in console
   - Layout remains consistent
   - Interactive elements work as expected
2. **Validate HTML**: Run the page through the W3C validator (or use a browser extension).
3. **Check responsiveness**: Resize the viewport from 320px to 1920px.

## Known Limitations & Workarounds

- **No CSS preprocessor**: All styles are either Tailwind classes or inline `<style>` blocks.
- **No JavaScript bundler**: All scripts are inline; keep them small and focused.
- **No image optimization pipeline**: Images are manually optimized before being placed in `/images`.
- **No automatic deployment checks**: GitHub Pages serves whatever is in `main`; ensure changes work before merging.

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [HTML Living Standard](https://html.spec.whatwg.org/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---
*This file was generated by an agentic coding assistant. Update it as the project evolves.*