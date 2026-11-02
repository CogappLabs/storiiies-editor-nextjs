# Storiiies Editor

An editor for IIIF annotation stories. Pick a high-resolution image, mark up regions with text, images and audio, and publish the result as a IIIF Presentation API 3.0 manifest that any IIIF viewer can play.

## Features

- Create stories from a IIIF image `info.json`, a IIIF manifest (pick a canvas), or an uploaded image (tiled into IIIF with sharp)
- Add an annotation for the current view, then move or resize its box with the mouse or the keyboard
- Attach images and audio to annotations by URL or by upload; uploaded images are resized to WebP
- Reorder annotations by drag and drop
- Preview in the Storiiies Viewer, Clover, Mirador and Annona
- Admin pages for all stories (with restore) and all uploads

## Tech stack

- **Framework**: Next.js 16 (App Router, typed routes), React 19
- **Database**: PostgreSQL via Prisma 7 (Neon in production)
- **Storage**: Vercel Blob for uploaded tiles and annotation media
- **Viewer**: OpenSeadragon with an SVG annotation overlay
- **Styling**: Tailwind CSS 4, Cogapp's Civil and Untitled Serif typefaces
- **Tests**: Playwright end-to-end, against a throwaway local Postgres
- **Linting/formatting**: Biome, run by Lefthook on commit

## Getting started

Requires Node.js 24 and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` (or run `vercel env pull .env.local`) with:

   | Variable | Purpose |
   | --- | --- |
   | `POSTGRES_PRISMA_URL` | Pooled connection used by the app |
   | `POSTGRES_URL_NON_POOLING` | Direct connection used by the Prisma CLI |
   | `BLOB_READ_WRITE_TOKEN` | Vercel Blob, for uploads |
   | `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | Optional; turns on basic auth |

3. Push the schema and start the dev server:

   ```bash
   npx prisma db push
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The project uses `prisma db push` rather than migrations.

## Usage

1. **Create a story**: paste an `info.json` URL or a manifest (then pick a canvas), or upload an image. A preview confirms the image before you add a title.
2. **Add annotations**: pan and zoom to a region, then click **Add**. The new annotation covers the current view.
3. **Adjust the region**: select an annotation and drag its box or handles. With the box focused, the arrow keys move it and Shift with the arrow keys resizes it.
4. **Edit content**: add text, then images and audio by URL or upload.
5. **Reorder**: drag annotations in the list, or use the drag handle with the keyboard.
6. **Preview and share**: open the story in any of the four viewers, or copy its manifest URL.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Biome check |
| `npm run typecheck` | Generate Next route types, then `tsc --noEmit` |
| `npm run test:e2e` | Playwright suite on a throwaway Postgres and its own server (port 3100) |

The e2e suite never touches the shared database. The upload test uses real Blob storage, deletes what it uploads, and skips without `BLOB_READ_WRITE_TOKEN`.

## Deployment

The app runs on Vercel with a Neon database from the Vercel Marketplace, which fills in the Postgres variables. Add a Blob store for `BLOB_READ_WRITE_TOKEN`. Apply schema changes with `npx prisma db push` against the production database; the build does not change the schema.

With basic auth set, every route except `/api/manifest/*` needs a login, so external viewers can still load manifests.

GitHub Actions runs lint, types and the e2e suite (against a Postgres service container) on every push and pull request.

## License

MIT
