# The Right Spot

A photography spot discovery app. Photograph beautiful locations, tag them with
composition types, colors, and metadata, then see them on your personal map.
Follow other photographers to discover their spots.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Monorepo | pnpm workspaces + Turborepo |
| Web + API | Next.js (App Router) |
| Mobile | Expo React Native (SDK 53) |
| Database | PostgreSQL 17 + Prisma ORM |
| Auth | JWT (email/password + Google OAuth) |
| Storage | Cloudflare R2 (S3-compatible) |
| Maps | react-native-maps (mobile), MapLibre GL + OpenFreeMap vector tiles (web) |
| Geocoding | Nominatim (OpenStreetMap) |
| i18n | French + English |
| State | Zustand (mobile), React Context (web) |
| Validation | Zod (shared schemas) |
| Tests | Vitest |
| CI/CD | GitHub Actions (lint, test, SAST, SCA, CodeQL) |

## Architecture

```text
the-right-spot/
├── apps/
│   ├── web/                  # Next.js — API routes + web frontend + Prisma
│   │   ├── prisma/           # Schema, migrations, seed
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/      # REST API endpoints
│   │       │   └── (app)/    # Authenticated web pages
│   │       ├── components/   # React components
│   │       ├── generated/    # Prisma client (generated)
│   │       └── lib/          # Utilities, API client, auth
│   └── mobile/               # Expo React Native
│       └── src/
│           ├── screens/      # Tab screens (Map, Search, Add, Notifications, Profile)
│           ├── components/   # Shared UI components
│           ├── navigation/   # PagerView-based swipeable tabs + stack navigator
│           ├── stores/       # Zustand state stores
│           └── lib/          # API client, utilities
├── packages/
│   └── shared/               # @trs/shared — types, Zod validation, i18n, constants
├── docker-compose.yml        # Local PostgreSQL
├── turbo.json                # Turborepo task config
└── .github/workflows/        # CI pipelines
```

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** 9.15+ (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** (for local PostgreSQL)
- **Expo CLI** (`npx expo` — bundled, no global install needed)
- iOS Simulator (macOS) or Android Emulator for mobile dev

---

## Development Setup

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/the-right-spot.git
cd the-right-spot
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `localhost:5432` with:

- User: `trs`
- Password: `trs_local_pwd`
- Database: `the_right_spot`

### 3. Configure environment

```bash
cp apps/web/.env.example apps/web/.env
```

The defaults work for local dev. The `.env.example` contains:

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://trs:trs_local_pwd@localhost:5432/the_right_spot` |
| `JWT_SECRET` | Access token signing key | Change in production |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Change in production |
| `R2_ACCOUNT_ID` | Cloudflare R2 account | Required for photo uploads |
| `R2_ACCESS_KEY_ID` | R2 access key | Required for photo uploads |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | Required for photo uploads |
| `R2_BUCKET_NAME` | R2 bucket name | `the-right-spot` |
| `R2_PUBLIC_URL` | Public URL for stored photos | Required for photo display |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID | Optional |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth (client-side) | Optional |
| `GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID — lets the API accept tokens from the mobile app | Optional |
| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID — same, for Android | Optional |
| `RESEND_API_KEY` | Resend email API key | Optional |
| `EMAIL_FROM` | Sender email address | `noreply@therightspot.app` |
| `NEXT_PUBLIC_APP_URL` | Web app URL | `http://localhost:3000` |

> **Note**: Photo uploads require Cloudflare R2 credentials. Google OAuth and email sending are optional for local dev.

### 4. Initialize the database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed test data
```

The seed creates two test users and sample spots:

| User         | Email               | Password    |
| ------------ | ------------------- | ----------- |
| alice_photo  | <alice@example.com> | password123 |
| bob_captures | <bob@example.com>   | password123 |

### 5. Start development

```bash
pnpm dev
```

This runs all apps in parallel via Turborepo:

- **Web**: <http://localhost:3000>
- **Mobile**: Expo DevTools on port 8081

To run apps individually:

```bash
pnpm --filter @trs/web dev        # Next.js only
pnpm --filter @trs/mobile dev     # Expo only
```

For the mobile app, press `i` for iOS Simulator or `a` for Android Emulator in the Expo CLI.

---

## Available Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm db:generate` | Generate Prisma client from schema |
| `pnpm db:push` | Push Prisma schema to database (no migration) |
| `pnpm db:migrate` | Create and apply a Prisma migration |
| `pnpm db:studio` | Open Prisma Studio GUI (database browser) |
| `pnpm db:seed` | Seed the database with test data |
| `pnpm clean` | Remove all `node_modules` and build artifacts |

---

## Production Deployment

### Web (Vercel)

The Next.js app deploys to Vercel as a serverless application serving both the API and the web frontend.

1. **Connect your repo** to [Vercel](https://vercel.com)

2. **Configure the project**:
   - Root directory: `apps/web`
   - Framework preset: Next.js
   - Build command: `pnpm build` (Turborepo handles dependencies)
   - Install command: `pnpm install`

3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` — Production PostgreSQL connection string (use a managed provider like Neon, Supabase, or Railway)
   - `JWT_SECRET` — Strong random secret (≥ 32 chars)
   - `JWT_REFRESH_SECRET` — Different strong random secret
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 credentials
   - `NEXT_PUBLIC_APP_URL` — Your production URL (e.g. `https://therightspot.app`)
   - `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — For Google OAuth
   - `RESEND_API_KEY`, `EMAIL_FROM` — For transactional emails

4. **Run migrations** after first deploy:

   ```bash
   # From your local machine with DATABASE_URL pointing to production
   pnpm db:migrate
   ```

### Mobile (Expo EAS)

The mobile app uses [Expo Application Services](https://expo.dev/eas) for building and distributing.

1. **Install EAS CLI**:

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS** (if not already done):

   ```bash
   cd apps/mobile
   eas build:configure
   ```

3. **Set the API URL** — Point the mobile app to your production API:

   ```bash
   # In apps/mobile/.env or via EAS secrets
   EXPO_PUBLIC_API_URL=https://therightspot.app/api
   ```

4. **Google sign-in** (optional) — the mobile app uses Google's native flow,
   which needs its own OAuth clients on top of the Web one the site uses.
   In the Google Cloud project, create an **iOS** client (bundle ID
   `com.trs.therightspot`) and an **Android** client (package
   `com.trs.therightspot` + the SHA-1 from `eas credentials`), then:

   ```bash
   # apps/mobile/.env — the button only shows when the web ID and the
   # current platform's ID are both set
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...      # same as GOOGLE_CLIENT_ID on the web
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...

   # apps/web/.env — so the API accepts the tokens those clients issue
   GOOGLE_IOS_CLIENT_ID=...
   GOOGLE_ANDROID_CLIENT_ID=...
   ```

   Native Google sign-in does not work in Expo Go (Google rejects its
   `exp://` redirect) — use a development build: `npx expo run:ios`,
   `npx expo run:android`, or `eas build --profile development`.

5. **Build for stores**:

   ```bash
   # iOS
   eas build --platform ios --profile production

   # Android
   eas build --platform android --profile production
   ```

6. **Submit to stores**:

   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

### Database (Production)

Use a managed PostgreSQL provider:

- [Neon](https://neon.tech) — Serverless, scales to zero
- [Supabase](https://supabase.com) — Managed Postgres + extras
- [Railway](https://railway.app) — Simple managed Postgres

Set `DATABASE_URL` in your environment to the provider's connection string.

### Storage (Cloudflare R2)

1. Create a bucket in [Cloudflare R2](https://developers.cloudflare.com/r2/)
2. Create an API token with read/write permissions
3. Configure a public custom domain for serving images
4. Set the R2 environment variables in your deployment

---

## CI/CD Pipelines

The project includes a comprehensive DevSecOps pipeline via GitHub Actions:

| Workflow | Purpose |
| -------- | ------- |
| `ci.yml` | Lint, typecheck, test, build on every PR |
| `pre-commit.yml` | Pre-commit hooks validation |
| `bearer.yml` | SAST — static application security testing |
| `security-scan.yml` | Grype SCA — dependency vulnerability scanning |
| `codeql.yml` | GitHub CodeQL semantic analysis |
| `dependency-review.yml` | License and vulnerability checks on new deps |
| `scorecard.yml` | OpenSSF Scorecard supply chain security |
| `ci-hardening.yml` | Additional CI security hardening |

---

## API Overview

All endpoints are under `/api/`. Authentication uses Bearer JWT tokens.

**Auth**: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`

**Spots**: `GET /api/spots`, `POST /api/spots`, `GET /api/spots/:id`,
`PATCH /api/spots/:id`, `DELETE /api/spots/:id`, `GET /api/spots/feed`

**Users**: `GET /api/users/:username`, `POST /api/users/:username/follow`,
`DELETE /api/users/:username/follow`, `GET /api/users/:username/followers`,
`GET /api/users/:username/following`

**Notifications**: `GET /api/notifications`, `PATCH /api/notifications/:id`

Response format:

```json
{ "data": { ... } }          // Success
{ "error": "message" }       // Error
```

---

## License

Private project — all rights reserved.
