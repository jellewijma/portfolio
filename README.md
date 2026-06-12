# Jelle Wijma Portfolio

Next.js portfolio and photography gallery with Tailwind CSS, Convex for editable content, and Vercel Blob for new admin-uploaded images.

The canonical branch for active development is `main`.

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
    optimized/         Generated responsive seed images used by the site
    source/            Original seed photos used to regenerate optimized images
  js/                  Browser JavaScript for public pages and admin
app/                   Next.js App Router pages and shared page components
convex/                Backend schema, functions, HTTP routes, generated bindings
public/legacy/         Legacy static pages kept as fallback/reference
scripts/               Local build and validation utilities
```

## Development

Run `npm run dev` and open `http://localhost:3000`.

## Build

```sh
npm run build
```

The build regenerates optimized responsive image assets and the minified Tailwind stylesheet.

## Convex Admin

Set the admin email, allowed origins, magic-link delivery, and Blob upload token in Convex before using `/admin`:

```sh
npx convex env set ADMIN_EMAIL "you@example.com"
npx convex env set ADMIN_SITE_URL "https://admin.jellewijma.com"
npx convex env set ALLOWED_ORIGINS "https://jellewijma.com,https://www.jellewijma.com,https://admin.jellewijma.com"
npx convex env set RESEND_API_KEY "re_..."
npx convex env set MAGIC_LINK_FROM "Portfolio Admin <admin@your-domain.example>"
npx convex env set BLOB_READ_WRITE_TOKEN "vercel_blob_rw_..."
```

The public site and admin UI call the Convex HTTP API configured in `assets/js/runtime-config.js`. Admin uploads go through the authenticated Convex `/api/upload` HTTP action, which writes images to Vercel Blob and stores the public Blob URL in Convex.

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

This runs the production build, local asset reference check, and dependency audit.

## Image Workflow

Seed photos live in `assets/images/source/gallery/` and `assets/images/source/resources/`. Generated responsive seed variants are written to `assets/images/optimized/` by `npm run optimize:images`.

New images added through the admin panel are not committed to Git. They are uploaded to Vercel Blob, referenced by URL from Convex records, and old Vercel Blob objects are deleted when replaced or removed.
