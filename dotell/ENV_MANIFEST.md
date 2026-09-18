# ENV_MANIFEST.md — dotell

## Section 1 — Human Summary

This file documents everything required to develop and publish `@joefuentes/dotell`, a standalone npm package. It covers three external services (Sentry, PostHog, and a Postgres database), three environment variables, and the full local setup sequence from clone to working dev build. Estimated setup time is 20–35 minutes, most of which is account and project creation across Sentry and PostHog. The package itself has no running server — "dev" means a working build and type-check loop, not a running process.

---

## Section 2 — Cursor Directive

### 1. Prerequisites

| Requirement | Version / Detail |
|---|---|
| Node.js | 18.17.0 or higher (ESM and `instrumentation.ts` support) |
| Package manager | `npm` 9+ or `pnpm` 8+ — no Yarn |
| TypeScript | Installed as a dev dependency — no global install required |
| `tsup` | Installed as a dev dependency — no global install required |
| npm account | Required only to publish — not required to build or test locally |

Check your Node version before starting:
```bash
node -v
```
If the version is below 18.17.0, install the correct version via `nvm`:
```bash
nvm install 18
nvm use 18
```

---

### 2. Environment Variables

dotell is a package, not an application. The environment variables listed here are:
- Used in the **test harness / local integration test app** (if one exists in this repo)
- Documented here as the exact variables **consuming apps must provide**

Create a `.env.local` file at the repo root for local development and testing:

```bash
# .env.local

# PostHog project API key — MUST be prefixed NEXT_PUBLIC_ to be available in browser context.
# This value is baked into the bundle at next build time by Next.js convention.
# Format: phc_ followed by a long alphanumeric string
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry DSN — read from environment at server startup (runtime, not build time).
# Format: https://<key>@<org>.ingest.sentry.io/<project-id>
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Postgres connection string — read from environment at server startup (runtime, not build time).
# Passed to your ORM (Prisma or Drizzle) before injecting the db client into initDotell().
# Format depends on your ORM and Postgres provider.
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

**Critical distinction:**
- `NEXT_PUBLIC_POSTHOG_KEY` — must exist **at build time** (`next build`). If it is missing at build time, the PostHog provider will silently be skipped in the client bundle. This cannot be fixed at runtime after the build.
- `SENTRY_DSN` and `DATABASE_URL` — must exist **at runtime** (server startup). They are read when the server process initializes. Missing values produce a console warning (Sentry DSN) or a hard throw (db client not injected).

---

### 3. External Services

#### Service 1: PostHog

**Purpose:** Client-side product analytics. Receives `track()` events and `identify()` trait calls from the browser. Not used in server context.

**Account creation URL:** https://app.posthog.com/signup

**Setup steps:**

1. Create an account at the URL above.
2. PostHog will prompt you to create an **Organization** and a **Project**. Name the project something that matches the consuming app (e.g., `dotell-test`).
3. After project creation, you land on the project dashboard. In the left sidebar, click **Project Settings** (gear icon).
4. Scroll to the section labeled **Project API Key**. You will see a key beginning with `phc_`.
5. Copy the full key value.
6. Paste it as the value of `NEXT_PUBLIC_POSTHOG_KEY` in your `.env.local`.

**Environment variable provided:** `NEXT_PUBLIC_POSTHOG_KEY`

**Verification step:**
In a consuming Next.js app with dotell installed and initialized, open the browser console and look for no PostHog-related errors. Then go to PostHog → **Live Events** in the left sidebar. Fire a `dotell.track('test_event', {})` call from the browser. The event should appear in the Live Events feed within 5–10 seconds.

---

#### Service 2: Sentry

**Purpose:** Error tracking. Receives `error()` calls from both client and server contexts. The DSN routes errors to the correct Sentry project.

**Account creation URL:** https://sentry.io/signup

**Setup steps:**

1. Create an account at the URL above.
2. After signup, Sentry will prompt you to create an **Organization**.
3. Click **Create Project**. Select **Next.js** as the platform.
4. Name the project (e.g., `dotell-test`). Click **Create Project**.
5. Sentry will display a DSN on the setup screen. It looks like: `https://examplePublicKey@o0.ingest.sentry.io/0`.
6. If you navigate away from that screen, you can find the DSN again at: **Project Settings → Client Keys (DSN)**.
7. Copy the DSN value.
8. Paste it as the value of `SENTRY_DSN` in your `.env.local`.

**Environment variable provided:** `SENTRY_DSN`

**Verification step:**
Call `dotell.error(new Error('test error'))` from a server context in a consuming Next.js app. Navigate to your Sentry project → **Issues**. The error should appear within 30 seconds. If the DSN is missing, dotell will log a console warning in development (`dotell: Sentry DSN not configured — skipping provider`) and skip silently in production.

---

#### Service 3: Postgres Database

**Purpose:** Persistent event storage. Every `track()` and `error()` call writes a row to the `events` table. The consuming app injects its own database client (Prisma or Drizzle) into `initDotell()`. dotell never manages its own connection pool.

**Account creation URL:** Use any Postgres provider. Recommended for local development: install Postgres locally or use [Supabase](https://supabase.com/dashboard/sign-up) or [Neon](https://neon.tech) for a hosted dev database.

**Setup steps (using a local Postgres install):**

1. Install Postgres if not already installed:
   ```bash
   brew install postgresql@15   # macOS
   ```
2. Start the Postgres service:
   ```bash
   brew services start postgresql@15
   ```
3. Create a database for local development:
   ```bash
   createdb dotell_dev
   ```
4. Your connection string for `.env.local` is:
   ```
   DATABASE_URL=postgresql://localhost:5432/dotell_dev
   ```
5. Apply the dotell migration SQL file. The file ships with the package at `node_modules/@joefuentes/dotell/migrations/events.sql` after install, and is also in this repo at `migrations/events.sql`. Run it against your database:
   ```bash
   psql dotell_dev < migrations/events.sql
   ```
   This creates the `events` table and the recommended indexes. dotell will not auto-migrate. You must run this step explicitly every time you set up a new database.

6. Set up your ORM. dotell accepts either Prisma or Drizzle. The db client you inject must satisfy this structural interface:
   ```typescript
   interface DbClient {
     events: {
       create(args: { data: EventRow }): Promise<unknown>
     }
   }
   ```
   Both Prisma and Drizzle satisfy this when configured against the `events` table schema dotell ships.

**Environment variable provided:** `DATABASE_URL` (consumed by your ORM config, not directly by dotell — dotell receives the initialized client object)

**Verification step:**
After applying the migration SQL, connect to your database and confirm the table exists:
```bash
psql dotell_dev -c "\d events"
```
You should see the full column list including `id`, `user_id`, `event`, `properties`, `context`, `identity_model`, and `created_at`. Then fire a `dotell.track('test_event', {})` from a server context and query:
```bash
psql dotell_dev -c "SELECT * FROM events LIMIT 5;"
```
You should see a row with `context = 'server'`.

---

### 4. Local Setup Sequence

Follow these steps in order. Do not skip the migration step.

```bash
# 1. Clone the repository
git clone https://github.com/joefuentes/dotell.git
cd dotell

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
# Then open .env.local and fill in all three values:
# NEXT_PUBLIC_POSTHOG_KEY, SENTRY_DSN, DATABASE_URL

# 4. Apply the Postgres migration
# Ensure your Postgres database exists and DATABASE_URL points to it, then:
psql $DATABASE_URL < migrations/events.sql
# Confirm the table was created:
psql $DATABASE_URL -c "\d events"

# 5. Run the TypeScript build (this is the "dev" loop for a package)
npm run build
# Expected output: dist/ folder with .js and .d.ts files, no TypeScript errors

# 6. Run type-check in watch mode during development
npm run dev
# This runs tsc --noEmit --watch or tsup --watch depending on the package.json scripts
```

**Note on `npm run dev` for a package:** Because dotell is an npm package and not a Next.js application, `npm run dev` runs the build/watch pipeline (via `tsup --watch`), not a web server. To test dotell end-to-end with real providers, you need a consuming Next.js app that has dotell installed locally via `npm link` or a `file:` path dependency.

**To test with a consuming app:**
```bash
# In the dotell repo root:
npm link

# In your consuming Next.js app:
npm link @joefuentes/dotell

# Then run the consuming app:
npm run dev
```

---

### 5. Common Failure Modes

**Failure 1: `NEXT_PUBLIC_POSTHOG_KEY` is missing at build time and PostHog silently does nothing**
- Symptom: No events appear in PostHog Live Events, no errors thrown.
- Cause: `NEXT_PUBLIC_POSTHOG_KEY` was missing when `next build` ran. The value is baked into the client bundle at build time — a runtime `.env` update has no effect on an already-built app.
- Fix: Confirm the variable exists in `.env.local` before running `next build`. Rebuild after adding it.

**Failure 2: `events` table does not exist — Postgres writes silently fail**
- Symptom: No rows appear in the `events` table. No thrown errors (dotell uses fire-and-forget writes).
- Cause: The migration SQL was never applied to the database.
- Fix: Run `psql $DATABASE_URL < migrations/events.sql` and confirm with `\d events`.

**Failure 3: `initDotell()` throws at startup — "db client is required"**
- Symptom: App crashes on startup with a hard error from dotell.
- Cause: The `db` client was not passed to `initDotell()`, or the ORM client was not initialized before being injected.
- Fix: Ensure your ORM client (Prisma: `new PrismaClient()`, Drizzle: `drizzle(...)`) is initialized and imported before the `initDotell()` call in `lib/dotell.ts`. Confirm `DATABASE_URL` is set correctly for the ORM to connect.

**Failure 4: `tsup` build fails with ESM interop errors**
- Symptom: Build error referencing `require()` or CommonJS interop when bundling Sentry or PostHog.
- Cause: An indirect dependency is CJS-only and tsup's ESM output cannot resolve it cleanly.
- Fix: Check `tsup.config.ts` for `format: ['esm']` and confirm `"type": "module"` is set in `package.json`. If a specific dependency causes the error, add it to `noExternal` or `external` in the tsup config as appropriate, and open an issue in this repo.

**Failure 5: `npm link` consuming app cannot resolve `@joefuentes/dotell` types**
- Symptom: TypeScript errors in the consuming app saying types from `@joefuentes/dotell` cannot be found, even though the package resolves at runtime.
- Cause: `dist/` was not built before `npm link`, so `.d.ts` files do not exist.
- Fix: Run `npm run build` in the dotell repo root before running `npm link`. After any source changes, re-run `npm run build` (or use `npm run dev` in watch mode) and restart the TypeScript server in the consuming app (`Cmd+Shift+P → TypeScript: Restart TS Server` in VS Code).