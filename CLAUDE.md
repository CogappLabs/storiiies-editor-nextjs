# Storiiies Editor

A Next.js app for creating IIIF annotated stories. Users add annotations (text, images, audio) to high-resolution images and generate IIIF Presentation API v3 manifests for playback in various viewers.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack in dev)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Prisma 7 (hosted on Neon)
- **Styling:** Tailwind CSS 4
- **Linting/Formatting:** Biome (not ESLint/Prettier)
- **Pre-commit:** Lefthook (runs `biome check` + `tsc --noEmit`)
- **Package manager:** npm
- **Blob storage:** Vercel Blob (for uploaded image tiles)

## Commands

```bash
# Lint and format (auto-fix)
npx biome check --write .

# Lint (check only, CI mode)
npx biome check .

# Type check
npx tsc --noEmit

# Database: push schema changes (we use Neon, so db push not migrate)
npx prisma db push

# Database: regenerate client after schema changes
npx prisma generate

# Build
npm run build

# End-to-end tests (Playwright)
npm run test:e2e
```

### End-to-end tests

`npm run test:e2e` never touches Neon or your dev server. Playwright starts a
throwaway Postgres (`scripts/e2e-db.mjs`, PGlite via `@prisma/dev`), pushes the
schema, builds into `.next-e2e` and serves on port 3100. The single spec in
`e2e/` creates, edits and deletes a story end to end.

- CI sets `E2E_DATABASE_URL` to a Postgres service container instead.
- `PG_POOL_MAX=1` is set for the test server: PGlite shares one backend across
  connections, so concurrent queries would interleave.
- The upload test uses real Vercel Blob storage and skips without
  `BLOB_READ_WRITE_TOKEN`.

**Do not run `npm run dev`** — the user manages the dev server manually.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/
      manifest/[id]/      # IIIF manifest generation endpoint (public)
      images/             # Image upload/list/delete API
    editor/[id]/          # Story editor page
    preview/              # Viewer previews (storiiies, clover, mirador, annona)
    admin/                # Admin pages (all stories, uploaded images)
  components/             # React components
    AnnotatedViewer.tsx   # OpenSeadragon + Annotorious viewer
    AnnotationList.tsx    # Annotation CRUD with drag-and-drop reorder
    NewAnnotationForm.tsx # Create annotation form
    Editor.tsx            # Main editor orchestrator
    CreateStoryForm.tsx   # Story creation with IIIF image validation
    ui/                   # Shared UI components (Button, Header, Modal)
  lib/
    actions.ts            # Server actions (all DB mutations)
    blob.ts               # Vercel Blob storage helpers
    iiif.ts               # IIIF tile generation with sharp
    form-utils.ts         # Form field state helpers
    i18n/strings.ts       # All UI strings (centralized)
    validation.ts         # URL validation
    prisma.ts             # Prisma client singleton
    config.ts             # Viewer configuration constants
  generated/prisma/       # Generated Prisma client (gitignored)
prisma/
  schema.prisma           # Database schema
  prisma.config.ts        # Prisma config (loads .env.local)
```

## Key Patterns

- **Server actions** (`src/lib/actions.ts`): All database mutations go through server actions. They validate inputs and call `revalidatePath()` after writes. Mutations return `{ error }` instead of throwing, because Next hides thrown messages in production; callers must check the result.
- **Auth**: `src/proxy.ts` applies basic auth to everything except `/api/manifest`, which external viewers load.
- **Turbopack HMR workaround**: OpenSeadragon instances are stored in a `WeakMap` outside React state (`AnnotatedViewer.tsx`) to prevent Turbopack from trying to serialize them. Preview pages must not store viewer instances in React refs/state for the same reason.
- **IIIF manifests**: Generated dynamically at `/api/manifest/[id]`. Annotations become IIIF annotations with `TextualBody` and `Sound` bodies. Annotation images are embedded as `<img>` in a `text/html` TextualBody, because StoriiiesViewer ignores separate `Image` bodies.
- **Image sources**: An `ImageSource` can be shared by multiple stories (one-to-many). Sources can be URLs, manifest selections, or uploads.
- **Soft delete**: Stories use `deletedAt` for soft deletion.
- **i18n**: All UI strings are in `src/lib/i18n/strings.ts`. Use `getStrings()` (server) or `useStrings()` (client).

## Formatting

- **Indent:** Spaces (not tabs)
- **Quotes:** Double quotes
- Biome handles all formatting — do not use Prettier or ESLint

## Database

- Hosted on Neon PostgreSQL
- Use `npx prisma db push` (not `prisma migrate dev`) due to migration drift with Neon
- Schema is at `prisma/schema.prisma`, config at `prisma.config.ts`
- DB connection string comes from `POSTGRES_URL_NON_POOLING` in `.env.local`
