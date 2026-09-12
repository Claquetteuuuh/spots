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
You MUST run ALL 5 checks below before EVERY `git commit`. No exceptions.

```bash
# 0. Stage EVERYTHING first — `pre-commit run --all-files` only looks at files
#    git knows about, so an untracked new file (a migration, a component)
#    is silently skipped and fails in CI instead.
git add -A

# 1. Pre-commit hooks (secrets, formatting, tests, typecheck)
pre-commit run --all-files
# If a hook "modified files", stage its fixes and run it again until it passes.

# 2. ESLint — CI runs it and pre-commit does not, so run it yourself
pnpm lint

# 3. Grype SCA scan (dependency vulnerabilities)
grype dir:. --fail-on high

# 4. Bearer SAST scan (code-level security issues)
bearer scan . --severity critical,high

# 5. Full build
pnpm build
```

**If ANY check fails, DO NOT commit. Fix the issue first, then re-run.**

- ESLint errors → fix the code; warnings are tolerated, errors are not
- Grype High/Critical → update dependency or add override in root `package.json`
- Bearer Critical/High → fix the flagged code pattern
- Medium/Low from grype or bearer are acceptable
- Pre-commit failures → fix and re-run until all pass
- Generated files (`prisma migrate diff --script` output, tool dumps) often
  lack a trailing newline: stage them and let `end-of-file-fixer` fix them
  BEFORE committing, then stage the fix

Once per clone, install the git hook so a commit can never skip the hooks:

```bash
pre-commit install
```

This is not a suggestion — it is a hard gate.

## Testing (MANDATORY)

A regression is the one failure that must never reach users, so every change
ships with its tests in the same commit — a feature without tests is not
finished.

- **Unit tests** for every new function, helper, store action and schema
  (`lib/__tests__`, `stores/__tests__`, `packages/shared/src/__tests__`).
- **Functional tests for every API route** (`apps/web/src/app/api/__tests__`):
  happy path, 401/403, 400 validation, 404, and a downstream failure
  (storage, DB) — all mocked, never against live services.
- **Component tests** for any UI that holds logic — pickers, forms, dialogs —
  with `@testing-library/react` on web and `@testing-library/react-native`
  on mobile.
- **A regression test for every bug fix**, written to fail before the fix.
- Cover both platforms: a mobile feature gets mobile tests, a web feature gets
  web tests.
- `pnpm test` runs everything and is part of pre-commit and CI.

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

## Mobile native dependencies (MANDATORY)

The app runs in Expo Go, which ships a fixed set of native modules. A JS
package newer than its native side (gesture-handler, reanimated, maps,
screens, safe-area-context, every `expo-*`) crashes at launch with
`TypeError: undefined is not a function`.

- Add or bump native packages ONLY with `npx expo install <pkg>` from
  `apps/mobile` — never `pnpm add` with a hand-picked version.
- `npx expo install --check` must be clean; pre-commit and CI run it.
- Pure-JS tooling (jest, @types/jest) is excluded via `expo.install.exclude`
  in `apps/mobile/package.json`.

## Web ↔ Mobile Parity (MANDATORY)

Every feature ships on both the web app and the mobile app, in the same
change. A feature built on one platform is not done until it exists on the
other — UI, API client method, i18n keys, tests. The only exception is when
the user explicitly says a feature is web-only or mobile-only.

Server-side behaviour (compression, storage cleanup, validation) lives in the
API and already serves both clients; what needs mirroring is the client side.

## Commits & Versioning

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`,
with an optional scope (`fix(ci):`, `feat(mobile):`).

Versions are `vX.Y.Z`, and the commit types in a release decide which number
moves:

- **X — major**: only the user decides to bump it. Never propose or tag a
  major version on your own, whatever the size of the change.
- **Y — feature**: the release contains at least one `feat:`. Resets Z to 0.
- **Z — bug fix**: the release contains only `fix:` (and chores/docs).

See "Release flow" below for how a version reaches production.

## Deployment

- **Hosting**: Vercel — project root directory set to `apps/web`
- **Deploy trigger**: GitHub Releases only (`ignoreCommand: "exit 0"` blocks all auto-deploys)
- **Config**: `apps/web/vercel.json` (installCommand navigates to monorepo root)
- **Workflow**: `.github/workflows/deploy.yml` — on `release:published`

### Release flow

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
# GitHub → Releases → Create release on the tag
```

The workflow runs: install → generate → test → **prisma migrate deploy** → vercel deploy --prod.

### Database migrations in production

- Migrations are applied automatically by the deploy workflow (`prisma migrate deploy`)
- **Creating a migration** (dev): modify `prisma/schema.prisma`, then `pnpm db:migrate`
- The migration file in `prisma/migrations/` MUST be committed — it's what `migrate deploy` applies
- Never use `prisma db push` in production — always `migrate deploy`

### Required secrets (GitHub Actions)

- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_ORG_ID` — `team_Ch39vqrjZFQ7aIfwPf9ARHRk`
- `VERCEL_PROJECT_ID` — `prj_k2tDktliUOadnJP0UkoGWNKHq5Sz`
- `DATABASE_URL` — PostgreSQL connection string (same as on Vercel)

### Required env vars (Vercel)

`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`

Optional: `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `RESEND_API_KEY`, `EMAIL_FROM`

## Code Conventions

- TypeScript strict mode everywhere
- UI text via i18n keys, never hardcoded strings
- API base URL from env: `NEXT_PUBLIC_API_URL`
- Auth tokens in SecureStore (mobile) / httpOnly cookies (web)
- Tests ship with the change, on both platforms — see "Testing" above
- Use validation schemas from @trs/shared for all API input
- Clean imports: @trs/shared for shared code, @/lib/db for Prisma — never relative cross-package
