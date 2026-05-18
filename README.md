# Jelle Wijma Portfolio

Static portfolio and photography gallery built with plain HTML, Tailwind CSS, and Convex for editable photos/projects.

## Setup

```sh
npm install
```

## Project Structure

```text
assets/
  css/                 Tailwind input/output and shared global CSS
  icons/               Favicon and SVG assets
  images/
    optimized/         Generated responsive images used by the site
    source/            Original gallery and resource photos
  js/                  Browser JavaScript for public pages and admin
convex/                Backend schema, functions, HTTP routes, generated bindings
scripts/               Local build and validation utilities
*.html                 Static public pages served from the site root
```

## Development

```sh
npm run dev:css
```

Open `index.html` or serve the folder with a static file server.

## Build

```sh
npm run build
```

The build regenerates optimized responsive image assets and the minified Tailwind stylesheet.

## Convex Admin

Set the admin email and magic-link delivery settings in Convex before using `/admin.html`:

```sh
npx convex env set ADMIN_EMAIL "you@example.com"
npx convex env set ADMIN_SITE_URL "https://admin.jellewijma.com"
npx convex env set RESEND_API_KEY "re_..."
npx convex env set MAGIC_LINK_FROM "Portfolio Admin <admin@your-domain.example>"
```

The public site and admin UI call the Convex HTTP API configured in `assets/js/runtime-config.js`.

Run Convex locally with:

```sh
npx convex dev
```

Deploy Convex functions with:

```sh
npm run deploy:convex
```

## Checks

```sh
npm run check
```

This runs the CSS build and dependency audit.

## Image Workflow

Original photos live in `assets/images/source/gallery/` and `assets/images/source/resources/`. Generated responsive variants are written to `assets/images/optimized/` by `npm run optimize:images`.
