# Storiiies Editor

A local-first editor for creating IIIF annotation stories. Create annotated narratives from IIIF images and preview them in multiple IIIF viewers.

## Features

- Create stories from IIIF image or manifest URLs
- Add annotations at the current viewport position
- Resize and reposition annotations with Annotorious
- Drag-and-drop reordering of annotations
- Add images to annotations
- Preview stories in multiple IIIF viewers:
  - Storiiies Viewer
  - Clover
  - Mirador
  - Annona
- Export as IIIF Presentation API 3.0 manifests
- Efficient tiled image rendering via IIIF Image API

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma (Neon recommended for serverless)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS 4
- **Image Viewer**: OpenSeadragon with IIIF tiled rendering
- **Annotations**: Annotorious for OpenSeadragon
- **Drag & Drop**: @hello-pangea/dnd
- **Linting/Formatting**: Biome

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd storiiies-editor-local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   For local development, you can either:
   - Use a Neon database (recommended) - add your connection strings to `.env.local`
   - Pull env vars from Vercel: `vercel env pull .env.local`

4. Initialize the database:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes (manifest generation)
│   ├── editor/             # Story editor
│   └── preview/            # Viewer previews (storiiies, clover, mirador, annona)
├── components/             # React components
│   ├── ui/                 # Reusable UI components (Button, Header, etc.)
│   ├── Editor.tsx          # Main editor component
│   ├── AnnotatedViewer.tsx # OpenSeadragon viewer with annotations
│   └── AnnotationList.tsx  # Draggable annotation list
├── lib/                    # Utilities and server actions
└── generated/              # Prisma generated client
```

## Usage

1. **Create a Story**: Paste a IIIF image `info.json` URL or a full IIIF manifest. If it’s a manifest, pick the desired canvas from the list of previews.
2. **Add Annotations**: Navigate to your desired view, then click "Add" to create an annotation at the current viewport
3. **Adjust Region**: Resize or reposition the annotation rectangle as needed
4. **Edit Content**: Add text and optional images to each annotation
5. **Reorder**: Drag annotations to change their order in the story
6. **Preview**: Use the "Share" button to preview in different IIIF viewers
7. **Export**: Copy the manifest URL to use in any IIIF-compatible viewer

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx biome check` - Run linting and formatting checks
- `npx biome check --write` - Auto-fix linting and formatting issues

## Deployment (Vercel + Neon)

### 1. Deploy to Vercel

1. Push your repository to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Vercel will auto-detect Next.js settings

### 2. Add Neon Database

1. In your Vercel project, go to **Storage** tab
2. Click **Connect Store** → **Browse Marketplace** → **Neon**
3. Create a new Neon database (or link existing)
4. Environment variables `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` will be auto-populated

### 3. Run Migrations

Migrations run automatically on build via the `prisma migrate deploy` command in the build script.

For manual migration:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 4. Basic Auth (Optional)

To protect the app with basic authentication, set these environment variables in Vercel:

- `BASIC_AUTH_USER` - Username
- `BASIC_AUTH_PASSWORD` - Password

If not set, authentication is disabled.

## Todo

- [ ] Handle manifest inputs on the homepage: if a user pastes a manifest instead of an `info.json`, parse its canvases, show a picker UI for each image, and then continue using the chosen canvas' `info.json`.

## License

MIT
