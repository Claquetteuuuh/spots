# CLAUDE.md — spots (repo: the-right-spot)

## Project Overview

Photography spot discovery app. Users photograph beautiful locations, tag them with
composition types, colors, and metadata, then see them on their personal map.
Follow other photographers to discover their spots too.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API / Web**: Next.js (App Router) — serverless on Vercel, serves both API and web UI
- **Mobile**: Expo React Native (SDK 53)
- **Database**: PostgreSQL 17 + Prisma ORM
- **Auth**: JWT (email/password + OAuth Google/Apple)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Maps**: react-native-maps (mobile), react-leaflet (web)
- **Geocoding**: Nominatim (OpenStreetMap) — free, no API key
- **i18n**: FR + EN via shared translation keys
- **State**: Zustand (mobile), React Context (web)
- **Validation**: Zod (shared schemas in @trs/shared)
- **Tests**: Vitest

## Architecture

```text
the-right-spot/
├── apps/
│   ├── web/              # Next.js API + web frontend + Prisma DB
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/
│   │       ├── generated/prisma/  # Generated Prisma client
│   │       └── lib/db.ts          # Prisma singleton export
│   └── mobile/           # Expo React Native
├── packages/
│   └── shared/           # Shared types, validation, i18n, constants (@trs/shared)
├── docker-compose.yml    # PostgreSQL for local dev
├── .pre-commit-config.yaml
└── .github/workflows/    # CI, Bearer SAST, Grype SCA, pre-commit
```

## Dev Commands

```bash
# Start everything
docker compose up -d          # PostgreSQL
pnpm install                  # Dependencies
pnpm db:generate              # Generate Prisma client
pnpm db:push                  # Push schema to DB
pnpm db:seed                  # Seed test data
pnpm dev                      # Start all apps (turbo)

# Individual apps
pnpm --filter @trs/web dev    # Next.js on :3000
pnpm --filter @trs/mobile dev # Expo on :8081

# Database
pnpm db:migrate               # Create migration
pnpm db:studio                # Prisma Studio GUI

# Quality
pnpm test                     # Run all tests
pnpm lint                     # Lint all apps
pnpm typecheck                # TypeScript check
pnpm build                    # Build all apps
```

## MANDATORY — Pre-commit checklist (BLOCKING)

**This section is the single most important rule in this file.**
You MUST run ALL 4 checks below before EVERY `git commit`. No exceptions.

```bash
# 1. Pre-commit hooks (linting, secrets, formatting, tests, typecheck)
pre-commit run --all-files

# 2. Grype SCA scan (dependency vulnerabilities)
grype dir:. --fail-on high

# 3. Bearer SAST scan (code-level security issues)
bearer scan . --severity critical,high

# 4. Full build
pnpm build
```

**If ANY check fails, DO NOT commit. Fix the issue first, then re-run.**

- Grype High/Critical → update dependency or add override in root `package.json`
- Bearer Critical/High → fix the flagged code pattern
- Medium/Low from grype or bearer are acceptable
- Pre-commit failures → fix and re-run until all pass

This is not a suggestion — it is a hard gate.

## API Conventions

- All endpoints under `/api/`
- Responses: `{ data: T }` for success, `{ error: string, details?: any }` for errors
- Auth via `Authorization: Bearer <token>` header
- Pagination: cursor-based with `?cursor=<id>&limit=<n>`
- Validation: Zod schemas from `@trs/shared/validation`
- Prisma client from `@/lib/db`

## Design Rules (CRITICAL)

The product is called **spots** in the interface. Folder, package and bundle
names still say `the-right-spot` — do not rename them.

Blue and white, one brand hue, photography-focused. The photos ARE the design.

**Identity**:

- Wordmark: "spots" set in Fredoka, with the `o` replaced by a filled circle —
  a spot on a map, dropped into the name. Use the `Wordmark` component
  (`components/wordmark.tsx` on web, `components/Wordmark.tsx` on mobile);
  never re-typeset it by hand.
- The filled dot is the recurring structural device: map markers, active
  states, the steps of a sequence. It is not decoration — if a dot appears,
  it should be standing for a place or a state.

**DO**:

- White canvas (#FFFFFF), cool near-whites for grouping (#F3F6FC, #E5ECF8)
- One brand blue, taken from the wordmark (#4574C4); dark navy (#0D1420) in
  dark mode, never pure black
- Blue-black text (#16203A) rather than neutral grey
- Green and red only for success and failure — there is no second accent
- Round corners: pills for anything pressable, 16px on photography
- Fredoka for the wordmark and display headings; Figtree (web) / the system
  face (mobile) for anything you actually read
- Grouping through spacing and tinted surfaces, not through borders on
  everything
- Generous whitespace; let photos breathe

**DO NOT** (LLM-style design anti-patterns):

- Warm cream backgrounds or terracotta accents
- Purple/black gradients
- Colored bands at top
- 3-card feature grids
- Bento grids
- Drop shadows everywhere (shadows are for things that genuinely float)
- Blurry orbs in background
- Sparkling stars
- Space Grotesk font
- Tracked-out ALL-CAPS eyebrow labels above headings
- Emojis in titles or as icons (including flag emoji for languages)
- Neon colors
- Rainbow anything

Colour tokens live in `@trs/shared/constants` (`COLORS`, `RADIUS`), which the
mobile theme reads directly, and are mirrored in `apps/web/src/app/globals.css`
for Tailwind. Change both together.

## Code Conventions

- TypeScript strict mode everywhere
- UI text via i18n keys, never hardcoded strings
- API base URL from env: `NEXT_PUBLIC_API_URL`
- Auth tokens in SecureStore (mobile) / httpOnly cookies (web)
- Always write unit tests for new features
- Use validation schemas from @trs/shared for all API input
- Clean imports: @trs/shared for shared code, @/lib/db for Prisma — never relative cross-package
