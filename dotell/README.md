# @joefuentes/dotell

dotell is a unified observability baseline for Next.js App Router apps. One npm install wraps PostHog, Sentry, and a Postgres `events` table behind three methods — `track()`, `identify()`, and `error()`. dotell detects execution context internally (client, server, or edge) and routes each call to the correct providers without caller involvement. You configure it once with `initDotell()` and hold the returned instance for the lifetime of your app.

---

## Installation

```bash
npm install @joefuentes/dotell
```

You also need a Postgres database, an ORM client (Prisma or Drizzle) that satisfies the `DbClient` interface, and `@sentry/nextjs` initialized in your app. dotell bundles PostHog and Sentry SDK dependencies; it does not call `Sentry.init()` for you.

---

## Quick start

```typescript
// lib/dotell.ts
import { initDotell } from '@joefuentes/dotell'
import { db } from './db'

export const dotell = initDotell({
  model: 'authenticated',
  db,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  sentryDsn: process.env.SENTRY_DSN,
})
```

```typescript
// In a client component or server action
import { dotell } from '@/lib/dotell'

dotell.identify('user_abc123')
dotell.track('page_view', { path: '/dashboard' })
```

All three methods return `void` synchronously. Never `await` them.

---

## Environment variables

| Variable | Timing | Required | Purpose |
|----------|--------|----------|---------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Build time (inlined when passed to `initDotell`) | Optional | PostHog project API key — client analytics |
| `SENTRY_DSN` | Runtime (passed to `initDotell`) | Optional | Sentry DSN — error tracking |
| Database connection | Runtime | Required | Your ORM/Postgres client — injected as `db` |

dotell does not read `process.env` directly. You pass values into `initDotell()` at call time.

---

## initDotell() config reference

```typescript
import type { DotellConfig, DbClient, DotellInstance } from '@joefuentes/dotell'

interface DotellConfig {
  model: 'anonymous' | 'authenticated' | 'hybrid'  // required
  db: DbClient                                    // required
  posthogKey?: string                             // optional
  sentryDsn?: string                              // optional
}
```

| Key | Type | Required | If omitted |
|-----|------|----------|------------|
| `model` | `'anonymous' \| 'authenticated' \| 'hybrid'` | Yes | Hard error at init — unrecognized or missing model |
| `db` | `DbClient` | Yes | Hard error at init — `dotell: db client is required` |
| `posthogKey` | `string` | No | PostHog skipped silently; dev-only warning at init |
| `sentryDsn` | `string` | No | Sentry skipped silently; dev-only warning at init |

**Idempotency:** A second `initDotell()` call with identical config returns the existing instance and logs a console warning. A second call with different config throws a hard error.

**DbClient shape:**

```typescript
interface DbClient {
  events: {
    create(args: { data: EventInsert }): Promise<unknown>
  }
}
```

---

## Identity models

### Anonymous

Use when you want automatic device-level tracking with no auth integration. dotell manages a UUID in `localStorage` on the client — your app never touches it. Server-side calls emit events with `user_id: null`.

```typescript
export const dotell = initDotell({
  model: 'anonymous',
  db,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  sentryDsn: process.env.SENTRY_DSN,
})

// No identify() required on client — UUID is automatic
dotell.track('page_view', { path: '/' })
```

### Authenticated

Use when users log in via Clerk, Supabase, or any auth provider. Pass the auth user ID to `identify()` once per session.

```typescript
export const dotell = initDotell({
  model: 'authenticated',
  db,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  sentryDsn: process.env.SENTRY_DSN,
})

dotell.identify(session.user.id, { plan: 'pro' })
dotell.track('checkout_started', { cartId: 'cart_123' })
```

### Hybrid

Use for kiosk or shared-device apps where a device session owner rotates through PIN-authenticated workers. Your app owns all PIN validation — dotell only accepts the current identity via `identify()`.

```typescript
export const dotell = initDotell({
  model: 'hybrid',
  db,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  sentryDsn: process.env.SENTRY_DSN,
})

// Register the device
dotell.identify(deviceId, { role: 'device' })

// Worker signs in with PIN (your app validates the PIN first)
dotell.identify(workerId, { role: 'worker', parentId: deviceId })

// Worker signs out — re-identify device to tear down PIN user
dotell.identify(deviceId, { role: 'device' })
```

When a PIN user is active: Postgres events use `user_id = workerId`, with `properties.deviceId` and `properties.role = 'worker'`.

---

## Methods

### track(event, properties?)

```typescript
dotell.track('button_clicked', { buttonId: 'checkout' })
```

- **Signature:** `track(event: string, properties?: TrackProperties): void`
- **Behavior:** Reads current identity, detects context, routes to providers. Emits even when `userId` is null. Never throws.
- **Dev warning:** If called before identity is established: `dotell: track() called before identify(). userId will be null.`

`TrackProperties` is `Record<string, unknown>` — exported from `@joefuentes/dotell`.

### identify(userId, traits?)

```typescript
dotell.identify('user_abc123', { plan: 'pro' })
```

- **Signature:** `identify(userId: string, traits?: IdentifyOptions): void`
- **Behavior:** Updates in-memory identity state. Sends PostHog traits on client. Does **not** write a Postgres row. Never throws.

```typescript
interface IdentifyOptions {
  role?: 'device' | 'worker'
  parentId?: string
  [key: string]: unknown
}
```

### error(err, properties?)

```typescript
dotell.error(new Error('Payment failed'), { orderId: 'ord_123' })
```

- **Signature:** `error(error: Error, properties?: TrackProperties): void`
- **Behavior:** Captures exception in Sentry on client (when `sentryDsn` configured). Writes Postgres row with reserved event name `'error'`. Stores `error.message` and `error.name` in `properties` JSONB. Never throws.
- **Dev warning:** If called before identity is established: `dotell: error() called before identify(). userId will be null.`

---

## Integration pattern

### `lib/dotell.ts` — singleton

Create one module that calls `initDotell()` and exports the instance. Import `dotell` from this module everywhere — never call `initDotell()` in multiple places with different configs.

### `instrumentation.ts` — server init

Initialize Sentry in your Next.js app using `@sentry/nextjs` conventions. dotell dispatches via `addBreadcrumb` and `captureException` only — it assumes Sentry is already initialized.

```typescript
// instrumentation.ts (Next.js 14+)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs')
    init({ dsn: process.env.SENTRY_DSN })
  }
}
```

Import `@/lib/dotell` in server code (route handlers, server actions) to call `track()` or `error()`.

### `DotellProvider` — client component

dotell does not ship a React provider. Create a small `'use client'` wrapper in your app and mount it in `layout.tsx`:

```tsx
'use client'

import { dotell } from '@/lib/dotell'

// Importing lib/dotell.ts runs initDotell() at module load.

export function DotellProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

```tsx
// app/layout.tsx
import { DotellProvider } from '@/components/DotellProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <DotellProvider>{children}</DotellProvider>
      </body>
    </html>
  )
}
```

---

## Migration SQL

Locate the migration file shipped with the package at `node_modules/@joefuentes/dotell/migrations/001_create_events.sql`. Copy and run it manually against your Postgres database once during setup. dotell never auto-runs migrations.

```sql
CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event          TEXT NOT NULL,
  user_id        TEXT,
  properties     JSONB,
  context        TEXT CHECK (context IN ('client', 'server')),
  identity_model TEXT CHECK (identity_model IN ('anonymous', 'authenticated', 'hybrid')),
  created_at     TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event ON events(event);
CREATE INDEX idx_events_created_at ON events(created_at);
```

---

## Context routing

dotell detects context internally. Callers never pass `client` or `server`.

| Method | Client | Server | Edge |
|--------|--------|--------|------|
| `track()` | PostHog + Sentry breadcrumb + Postgres | Postgres only | Skipped (dev warn) |
| `identify()` | PostHog traits + in-memory state | In-memory state only | Skipped (dev warn) |
| `error()` | Sentry + Postgres | Postgres only | Skipped (dev warn) |

Unconfigured providers are skipped silently (dev warning at init). Provider failures are caught internally — `console.warn` in development, silent swallow in production. Postgres writes are fire-and-forget with no retry.

---

## PII disclaimer

**The consuming app is responsible for PII sanitization.** dotell passes `properties` and error objects through to PostHog, Sentry, and Postgres unchanged. dotell does not strip, hash, or redact personally identifiable information. Sanitize data before calling `track()`, `identify()`, or `error()` if your compliance requirements require it.

---

## Not supported in V1

- **Pages Router** — rejected, not planned. App Router only.
- **Edge Runtime instrumentation** — deferred to V2. All provider calls skipped on edge in V1.
- Retry logic on failed Postgres writes
- Event batching
- React hook (`useDotell()`)
- Server-side `identify()` with PostHog traits
- PII sanitization hooks
- Per-call provider routing (e.g., skipping PostHog on a single call)
- CJS output (ESM only)
- `npx dotell migrate` CLI
- `transpilePackages` requirement (pre-bundled ESM dist)

---

## Semver policy

`@joefuentes/dotell` follows [Semantic Versioning](https://semver.org/). **Patch** releases fix bugs without API changes. **Minor** releases add backward-compatible features (new optional config keys, new exported types). **Major** releases include breaking changes to the public API surface — method signatures, config shape, `DbClient` interface, or identity model behavior. Pin your dependency version in production apps and review release notes before upgrading across major versions.

---

## License

MIT
