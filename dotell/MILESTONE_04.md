# MILESTONE_04.md

## SECTION 1 — HUMAN SUMMARY

This milestone wires up the Sentry provider for `track()` and `error()` dispatch. It creates `src/providers/sentry.ts` with lazy init, client/server context guards, and failure isolation — mirroring the PostHog provider pattern established in Milestone 3. The `error()` method gets its first real implementation: forwarding to Sentry and writing to Postgres (fire-and-forget). Estimated complexity: medium. Sentry has both browser and Node SDKs; the provider must branch on context. Postgres write for `error()` follows the same fire-and-forget pattern already established for `track()`.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Milestone 4 — Sentry Provider: track() breadcrumb and error() dispatch**

---

### 2. What This Milestone Builds

Create `src/providers/sentry.ts` with two exported dispatch functions:
- `dispatchSentryBreadcrumb(event: string, properties?: Record<string, unknown>)` — called from `track()` on client context only; adds a Sentry breadcrumb
- `dispatchSentryError(err: unknown, properties?: Record<string, unknown>)` — called from `error()` on client and server contexts; captures exception via Sentry

Wire both into `src/instance.ts`:
- `track()`: call `dispatchSentryBreadcrumb()` after PostHog dispatch, guarded by `context === 'client'` and `config.sentryDsn`
- `error()`: implement the full `error()` method body — call `dispatchSentryError()` guarded by `config.sentryDsn`, then fire-and-forget Postgres write using same pattern as `track()`

The Sentry provider must:
- Use `@sentry/nextjs` (already a dependency) — import `addBreadcrumb` and `captureException` from it
- Not call `Sentry.init()` — Sentry is initialized by the consuming app via `instrumentation.ts` using `@sentry/nextjs` conventions; dotell only dispatches to an already-initialized Sentry instance
- Guard all calls with try/catch; swallow failures silently in production, `console.warn` in dev
- Never be called in edge context

---

### 3. Why This Comes Next

Milestone 3 established the provider pattern (lazy init, context guard, failure isolation) for PostHog. Sentry follows the same structural pattern and is the next provider in the fan-out chain. The `error()` method has had no implementation beyond a stub — it cannot be considered functional until Sentry dispatch and Postgres write are both wired. Postgres write for `track()` was already deferred; `error()` introduces the same pattern so both can be completed together in Milestone 5.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/providers/sentry.ts` | Sentry dispatch module — exports `dispatchSentryBreadcrumb()` and `dispatchSentryError()`; wraps `@sentry/nextjs` calls with context guards and failure isolation |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `src/instance.ts` | Add `dispatchSentryBreadcrumb()` call in `track()` after PostHog dispatch, guarded by `context === 'client'` and `config.sentryDsn`; implement full `error()` body with Sentry dispatch + fire-and-forget Postgres write + identity context resolution | Milestone 4 wiring point — `error()` gets its first real implementation here |

---

### 6. Files to Leave Untouched

- `src/providers/posthog.ts` — PostHog provider complete; no changes
- `src/track.ts` — core track impl unchanged
- `src/identify.ts` — identify impl unchanged
- `src/identity/` — all identity state machine files unchanged
- `src/context.ts` — context detection unchanged
- `src/config.ts` — config shape and validation unchanged
- `src/types.ts` — public types unchanged
- `src/index.ts` — public exports unchanged
- `migrations/` — SQL migration unchanged
- `tsup.config.ts`, `package.json`, `tsconfig.json` — build config unchanged

---

### 7. Layer Rules Reminder

1. **Provider isolation:** `@sentry/nextjs` is imported only inside `src/providers/sentry.ts`. `instance.ts` imports the dispatch functions, never the Sentry SDK directly.
2. **No Sentry.init() in dotell:** dotell does not initialize Sentry. The consuming app owns Sentry init via `instrumentation.ts`. dotell calls `addBreadcrumb` and `captureException` only — if Sentry is not initialized by the consuming app, calls will silently no-op (Sentry SDK behavior).
3. **Context routing for error():** `dispatchSentryError()` is callable from both client and server contexts (Sentry supports both via `@sentry/nextjs`). It must never be called in edge context. Postgres write for `error()` follows the same fire-and-forget pattern as `track()`.

---

### 8. Engineering Rules

**DO:**
- Wrap all Sentry dispatch calls in try/catch; `console.warn` in dev, silent swallow in production
- Return `void` from all dispatch functions — no promises exposed to callers
- Resolve `userId` in `error()` using the same `getResolvedUserId()` call pattern already used in `track()`
- Use the same `identityModel` resolution pattern from `track()` for the Postgres write in `error()`
- Guard Sentry calls with `config.sentryDsn` check — if DSN not provided, skip silently (already warned at init)
- Write the `error()` Postgres event with `event: 'error'` (the reserved event name per domain model)
- Include `properties` passed to `error()` in the Postgres write and in Sentry's extra context

**DO NOT:**
- Call `Sentry.init()` anywhere in dotell
- Add `sentryDsn` to any new config validation — it is already validated at init in `src/config.ts`
- Await the Postgres write in `error()` — fire-and-forget only
- Call `dispatchSentryBreadcrumb()` from server context — breadcrumbs are client-only in this implementation
- Call any Sentry or PostHog dispatch from edge context
- Add new public types or config keys
- Modify the `identify()` flow — Sentry has no role in identify
- Add retry logic of any kind

---

### 9. Ambiguity Protocol

If any of the following is unclear, stop and record the question in Open Questions rather than making a silent assumption:
- Whether `@sentry/nextjs` exports `addBreadcrumb` and `captureException` directly at the top level (confirm import path before writing)
- Whether `error()` in `instance.ts` currently has a stub body or is fully absent — do not overwrite existing logic without confirming the current state
- Whether `properties` passed to `error()` should be merged into Sentry's `extra` field, set as tags, or attached some other way

---

### 10. What Is NOT in This Milestone

- Postgres write for `track()` — deferred to Milestone 5
- PostHog dispatch for `error()` — PostHog does not receive error events; only Sentry + Postgres
- Sentry performance tracing or transactions — not in scope
- Sentry user context (`Sentry.setUser()`) — not wired in V1
- Any new config keys or public API surface changes
- Error retry logic
- Edge runtime handling beyond the existing skip-and-warn pattern

---

### 11. Assumptions Made

- `addBreadcrumb` and `captureException` are imported directly from `@sentry/nextjs` top level (re-exported from `@sentry/react` / `@sentry/node`).
- `properties` passed to `error()` are attached via Sentry's `extra` field on `captureException()`.
- Postgres write for `error()` lives inline in `instance.ts` (per milestone); `providers/postgres.ts` deferred to Milestone 5 for `track()`.
- `errorImpl()` in `error.ts` retains edge guard and identity resolution; Sentry + Postgres dispatch wired in `instance.ts` after impl (same pattern as `track()`).
- Hybrid event properties (`deviceId`, `role: 'worker'`) merged into Postgres `properties` JSONB when PIN user is active.

---

### 12. Open Questions

- None. Import paths confirmed; `error()` stub state verified before wiring; Sentry `extra` field chosen per ambiguity protocol safest default.