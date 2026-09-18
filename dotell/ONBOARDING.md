# ONBOARDING.md

## SECTION 1 — HUMAN SUMMARY

dotell is a standalone npm package (`@joefuentes/dotell`) that wraps Sentry, PostHog, and a Postgres events table behind three methods: `track()`, `identify()`, `error()`. It supports three identity models: anonymous (UUID in localStorage), authenticated (Clerk/Supabase), and hybrid (PIN-based role switching for kiosk/shared-device apps). The project is in active V1 build — architecture, domain model, engineering rules, and tech stack decisions are all finalized and locked. Regenerate this file when any domain status changes, a new domain is added, or V2 planning begins.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Project Name and Description
**dotell** — unified observability baseline for Next.js App Router apps. One install, one config, three methods. Never think about instrumentation again.

---

### 2. What It Does and Who It's For
Wraps Sentry, PostHog, and a Postgres events table behind `initDotell()` + `track()` + `identify()` + `error()`. Detects execution context internally (client / server / edge) and routes each call to the correct providers without caller involvement. V1 consumer: sole developer. V2 target: any developer wanting drop-in observability without wiring three tools.

---

### 3. Folder Structure and Layer Responsibilities

```
@joefuentes/dotell/
├── migrations/
│   └── 001_create_events.sql         # CREATE TABLE events + index definitions
├── src/
│   ├── index.ts              # Public API surface — re-exports only
│   ├── init.ts               # initDotell() — config validation, singleton 
│   ├── config.ts
creation
│   ├── track.ts              # track() implementation
│   ├── identify.ts           # identify() implementation
│   ├── error.ts              # error() implementation
│   ├── context.ts            # isClient / isServer / isEdge detection
│   ├── identity/
│   │   ├── anonymous.ts      # UUID read/write/generate via localStorage
│   │   ├── authenticated.ts  # Clerk/Supabase userId pass-through
│   │   ├── hybrid.ts         # In-memory session owner + PIN user state
│   │   └── state.ts          # Shared identity state (sessionOwner, pinUser slots)
│   ├── providers/
│   │   ├── posthog.ts        # PostHog browser SDK calls
│   │   ├── sentry.ts         # Sentry SDK calls
│   │   └── postgres.ts       # DbClient.events.create() fire-and-forget writes
│   └── types.ts              # All public types — named, exported, no anonymous types
├── dist/                     # tsup output — ESM + .d.ts only, never edit
├── tsup.config.ts
├── package.json
└── README.md
```

**Layer rules:**
- `index.ts` — re-exports public API and types only. No logic.
- `init.ts` — validates config eagerly, creates and returns the dotell instance. Owns idempotency enforcement.
- `context.ts` — single source of truth for environment detection. No other file runs `typeof window` or `typeof EdgeRuntime`.
- `identity/` — each model is isolated. `anonymous.ts` is the only file that touches localStorage.
- `providers/` — each provider is isolated. One provider failure must never affect other providers.
- `types.ts` — all public types live here. Every public type is named and explicitly exported.
- `migrations/001_create_events.sql` — shipped with the package, never executed by dotell itself.

---

### 4. Tech Stack

| Technology | Role | Why |
|---|---|---|
| TypeScript | Language | Fully typed public API is a hard requirement |
| tsup | Bundler | Zero-config ESM output with .d.ts declarations |
| ESM only | Module format | Next.js App Router is ESM-first; CJS deferred to V2 |
| PostHog browser SDK | Client analytics | Bundled as direct dependency; no peer dep burden |
| Sentry browser + Node SDK | Error tracking | Bundled as direct dependency; no peer dep burden |
| Postgres (via injected DbClient) | Event persistence | Duck-typed interface; consuming app injects Prisma or Drizzle |
| Duck-typed DbClient interface | ORM abstraction | Single `events.create({ data })` method; no adapter modules |
| Next.js App Router | Target framework | Only supported architecture; Pages Router explicitly excluded |
| `instrumentation.ts` | Server init point | Next.js 14+ native hook; runs once per server process |
| `localStorage` | Anonymous UUID | Internal to dotell; consuming app never touches it |
| public npm (`@joefuentes/dotell`) | Publishing target | No auth required; no private registry |

---

### 5. Layer Rules

**`init.ts`**
- Owns: config validation, singleton creation, idempotency
- Must never: execute provider calls, touch localStorage, import ORM-specific code

**`context.ts`**
- Owns: `isClient`, `isServer`, `isEdge` booleans
- Must never: be bypassed — all context-dependent branching reads from here

**`identity/anonymous.ts`**
- Owns: localStorage key name, UUID generation, UUID read/write
- Must never: be called in server or edge context

**`identity/hybrid.ts`**
- Owns: in-memory `sessionOwner` and `pinUser` state after `identify()` calls
- Must never: persist identity to Postgres or any storage; must never own PIN validation logic

**`providers/postgres.ts`**
- Owns: fire-and-forget `db.events.create()` call
- Must never: `await` the write at call site; must never manage a connection pool; must never import Prisma or Drizzle directly

**`providers/posthog.ts` / `providers/sentry.ts`**
- Owns: SDK calls for their respective provider
- Must never: throw errors to callers; must catch and swallow all failures

**`types.ts`**
- Owns: all exported public types
- Must never: contain logic, imports from provider SDKs, or anonymous inlined types

---

### 6. Engineering Rules

**DO:**
- Detect context in `context.ts` only — `isClient`, `isServer`, `isEdge` are the only references to `typeof window` or `typeof EdgeRuntime` in the codebase
- Validate config eagerly at `initDotell()` call time
- Throw at init for hard errors: missing `db` client, unrecognized `model` value
- Console warn (dev only) for soft errors: missing PostHog key, missing Sentry DSN, edge runtime detected
- Catch all provider failures internally — log in dev, swallow silently in production
- Write Postgres events fire-and-forget: `void db.events.create({ data: ... })` — no `await` at call site
- Return `void` from `track()`, `identify()`, `error()` — they are synchronous at the call site
- Name and export every public type explicitly from `types.ts`
- Return a typed instance from `initDotell()` — consuming app holds the reference
- Make `initDotell()` idempotent: second call with same config = console warn + return existing instance
- Ship `migrations/001_create_events.sql` with the package; never execute it automatically
- Emit events with `userId: null` when no identity is established — this is valid and expected
- Console warn in dev when `track()` is called before `identify()`: `"dotell: track() called before identify(). userId will be null."`
- Store `deviceId` in `properties` JSONB when a PIN user is active — not as a separate column
- Route `context: 'client'` events to PostHog + Sentry + Postgres; route `context: 'server'` events to Postgres only
- Skip any unconfigured provider silently; skip all providers on edge runtime with a console warn

**DO NOT:**
- Never throw at runtime from `track()`, `identify()`, or `error()` under any circumstance
- Never `await` Postgres writes at the call site
- Never manage a database connection pool inside dotell
- Never import Prisma or Drizzle directly — only the injected `DbClient` interface
- Never touch localStorage outside of `identity/anonymous.ts`
- Never call localStorage in server or edge context
- Never support Pages Router — it is rejected, not deferred
- Never support Edge Runtime instrumentation in V1 — skip all providers and warn
- Never auto-migrate the consuming app's database schema
- Never store PIN state — consuming app owns all PIN logic; dotell only accepts the current identity via `identify()`
- Never gate or block `track()` calls on identity being established
- Never add per-call provider routing — all configured providers always receive every event
- Never ship raw TypeScript to consumers — `dist/` only
- Never add `transpilePackages` requirement to consuming apps
- Never add retry logic to Postgres writes — fire-and-forget is a design decision, not a limitation; retry is rejected for V1
- Never export anonymous or inlined types at the public API boundary
- Never call `initDotell()` with a different config than the first call — this is a hard error (throw)
- Never write a separate record for `identify()` to Postgres — it updates in-memory state and sends PostHog traits only

---

### 7. Current Build Phase and Out-of-Scope Items

**Phase:** V1 active build. All architecture and domain decisions are finalized. Implementation only.

**Explicitly out of scope for V1 (deferred):**
- Event batching
- Retry logic on failed Postgres writes (rejected — contradicts fire-and-forget design)
- React hooks (`useDotell()`)
- Server-side `identify()`
- PII sanitization hooks
- Edge Runtime / middleware instrumentation
- Dual CJS+ESM output
- Peer dependency model for Sentry/PostHog
- Separate adapter modules for Prisma/Drizzle (`dotell/prisma`, `dotell/drizzle`)
- `npx dotell migrate` CLI
- `dotell check` pre-deploy validation command
- Dashboard, UI, SaaS layer

**Explicitly rejected (not deferred, not planned):**
- Pages Router support — contradicts App Router-only architecture
- Per-call provider routing — contradicts broadcast-to-all design
- dotell managing its own Postgres connection pool
- Auto-migration of consuming app database

---

### 8. Domain Model

#### Event
| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | `gen_random_uuid()`, primary key |
| `event` | `TEXT NOT NULL` | Event name. `'error'` is reserved. |
| `user_id` | `TEXT nullable` | `null` is valid — anonymous server calls, pre-identify calls |
| `properties` | `JSONB nullable` | Flexible payload. Hybrid model stores `role` and `deviceId` here. |
| `context` | `TEXT CHECK IN ('client', 'server')` | Set by dotell internally |
| `identity_model` | `TEXT CHECK IN ('anonymous', 'authenticated', 'hybrid')` | Set by dotell internally |
| `created_at` | `TIMESTAMP` | `DEFAULT now()` |

**Invariants:**
- `event` is never null or empty
- `user_id` may be null; this is not an error state
- `context` is always set; edge runtime calls never reach Postgres
- `identity_model` always reflects the model configured at `initDotell()`
- When PIN user is active in hybrid model: `user_id = pinUser.id`, `properties.deviceId = sessionOwner.id`, `properties.role = 'worker'`
- When no PIN user active in hybrid model: `user_id = sessionOwner.id`
- `'error'` is a reserved event name — `error()` writes to events table with `event = 'error'`

**Migration SQL (shipped as `migrations/001_create_events.sql`):**
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

CREATE INDEX idx_events_user_id   ON events(user_id);
CREATE INDEX idx_events_event     ON events(event);
CREATE INDEX idx_events_created_at ON events(created_at);
```

#### Identity Models

**Anonymous**
- UUID stored in localStorage, managed entirely by dotell
- Server-side: `userId = null`, event still written to Postgres
- Consuming app never interacts with localStorage

**Authenticated**
- `userId` sourced from Clerk or Supabase, passed into `identify(userId)`
- One user per browser session
- Server-side `identify()` not supported in V1

**Hybrid**
- Two in-memory slots: `sessionOwner` (device) and `pinUser` (active rotating user)
- `identify(deviceId, { role: 'device' })` — sets session owner
- `identify(pinUserId, { role: 'worker', parentId: deviceId })` — activates PIN user
- Re-calling `identify(deviceId, { role: 'device' })` tears down PIN user (no dedicated teardown method)
- dotell holds both in memory; consuming app owns all PIN validation logic
- `userId` resolution: `pinUser.id` if active, else `sessionOwner.id`

#### Providers

| Provider | Context | Activation Condition |
|---|---|---|
| PostHog | Client only | `posthogKey` configured |
| Sentry | Client only (browser SDK) | `sentryDsn` configured |
| Postgres | Client + Server | `db` client always required |

**Routing table:**
| Method | Client | Server | Edge |
|---|---|---|---|
| `track()` | PostHog + Sentry + Postgres | Postgres only | Skip all, warn |
| `identify()` | PostHog traits + in-memory | In-memory only | Skip all, warn |
| `error()` | Sentry + Postgres | Postgres only | Skip all, warn |

#### DbClient Interface
```typescript
interface DbClient {
  events: {
    create(args: { data: EventRow }): Promise<unknown>
  }
}
```
Duck-typed. Both Prisma and Drizzle satisfy this without adapters.

#### DotellInstance (returned by initDotell())
```typescript
interface DotellInstance {
  track(event: string, properties?: Record<string, unknown>): void
  identify(userId: string, traits?: IdentifyOptions): void
  error(error: Error, properties?: Record<string, unknown>): void
}
```

#### initDotell() Config Shape
```typescript
interface DotellConfig {
  model: 'anonymous' | 'authenticated' | 'hybrid'
  db: DbClient
  posthogKey?: string
  sentryDsn?: string
}
```

#### IdentifyOptions
```typescript
interface IdentifyOptions {
  role?: 'device' | 'worker'
  parentId?: string
  [key: string]: unknown
}
```

---

### 9. Must-Always and Must-Never List

**MUST ALWAYS:**
1. `track()`, `identify()`, and `error()` must always return `void` — synchronous at call site, async work is invisible to caller
2. All provider failures must always be caught internally — never propagate to caller
3. `initDotell()` must always validate config eagerly — hard errors throw at init, not at runtime
4. Context detection must always use `context.ts` — `isClient`, `isServer`, `isEdge` are the single source of truth
5. Postgres writes must always be fire-and-forget — `void db.events.create(...)` with no `await` at call site
6. All public types must always be named and explicitly exported from `types.ts` — no anonymous inlined types at API boundary
7. `identify()` must always update in-memory state and send PostHog traits — never write a Postgres row
8. Anonymous UUID must always be fully managed by dotell internally — consuming app has zero-touch contract
9. `migrations/001_create_events.sql` must always be shipped with the package and never executed automatically by dotell
10. Events with `userId = null` must always be written to Postgres — null userId is a valid, expected state

**MUST NEVER:**
1. Never throw from `track()`, `identify()`, or `error()` at runtime — not for any reason
2. Never import Prisma or Drizzle directly — only write through the injected `DbClient` interface
3. Never touch localStorage outside of `identity/anonymous.ts`
4. Never call localStorage in server or edge context
5. Never support Pages Router — it is rejected permanently, not deferred
6. Never add per-call provider routing — all configured providers always receive every call
7. Never gate or delay `track()` events because `identify()` has not been called — emit with `null userId`, warn in dev
8. Never retry failed Postgres writes — fire-and-forget is a deliberate design decision
9. Never store or own PIN state — consuming app owns all PIN validation and switching logic
10. Never auto-migrate the consuming app's database schema — `migrations/001_create_events.sql` is always applied manually by the developer

### 10. Action Required Before Next Milestone
> Items the developer must resolve before uploading this review to Scaffold.
> If none, write "None."

- [ ] ___