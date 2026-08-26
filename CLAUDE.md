# CLAUDE.md — The Right Spot

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
│   ├── web/              # Next.js API + web frontend
│   └── mobile/           # Expo React Native
├── packages/
│   ├── db/               # Prisma schema + client (@trs/db)
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
- Prisma client from `@trs/db`

## Design Rules (CRITICAL)

Minimalist, earthy, photography-focused. The photos ARE the design.

**DO**:

- Warm white backgrounds (#FAFAF8)
- Sand/sienna accents (#8B7355, #D4A574)
- Sage green for success/nature (#7D8C6E)
- Stone gray for secondary text (#6B6960)
- Sharp corners (2-4px border-radius max)
- Subtle 1px borders
- System fonts
- Generous whitespace
- Let photos breathe

**DO NOT** (LLM-style design anti-patterns):

- Purple/black gradients
- Colored bands at top
- 3-card feature grids
- Bento grids
- Over-rounded corners (12px+)
- Drop shadows everywhere
- Blurry orbs in background
- Sparkling stars
- Space Grotesk font
- Emojis in titles or as icons
- Neon colors
- Rainbow anything

## Code Conventions

- TypeScript strict mode everywhere
- UI text via i18n keys, never hardcoded strings
- API base URL from env: `NEXT_PUBLIC_API_URL`
- Auth tokens in SecureStore (mobile) / httpOnly cookies (web)
- Always write unit tests for new features
- Use validation schemas from @trs/shared for all API input
- Clean imports: @trs/shared, @trs/db — never relative cross-package
