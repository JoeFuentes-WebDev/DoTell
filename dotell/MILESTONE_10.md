# MILESTONE_10.md

## SECTION 1 — HUMAN SUMMARY

Milestone 10 implements the `error()` method end-to-end. This is the final of the three public methods (`track`, `identify`, `error`). It follows the same routing pattern as `track()` — client context sends to Sentry + Postgres, server context sends to Postgres only, edge skips all providers — with the key difference that the event name is the reserved string `"error"` and Sentry receives the error object directly. Estimated complexity: low-medium. Pattern is established from Milestone 9; this is a parallel implementation with one provider difference.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Milestone 10 — `error()` Method Implementation**

---

### 2. What This Milestone Builds

Implement the `error()` method end-to-end, wiring it through the same identity, context detection, provider routing, and Postgres write pipeline established by `track()`.

Specific deliverables:
- `src/error/error.ts` — core `error()` logic: identity read, context detection, Sentry dispatch (client only), Postgres write (client + server), edge warn
- `src/error/index.ts` — re-export barrel
- Update `src/providers/sentry.ts` — add or update `captureError(error, userId, properties)` function for error-specific Sentry dispatch
- Update `src/instance.ts` — wire `error()` method to delegate to `src/error/error.ts`

The `error()` method signature (already defined in the public API from earlier milestones):
```ts
error(error: Error, properties?: Record<string, unknown>): void
```

Routing rules:
- **Client:** Sentry (`captureException`) + Postgres write (`event = 'error'`)
- **Server:** Postgres write only (`event = 'error'`)
- **Edge:** skip all, `console.warn` in dev

Identity resolution:
- Same as `track()` — reads `getResolvedUserId()` from identity layer
- Hybrid enrichment same as `track()` — if active role is `worker`, inject `deviceId` and `role` into properties
- If `userId` is null, emit dev warning: `"dotell: error() called before identify(). userId will be null."`

Postgres write:
- `event` field value: `"error"`
- `properties` field: merged consumer properties + hybrid enrichment fields (if applicable) + `error.message` stored as `properties.message`, `error.name` stored as `properties.name`
- `context`, `identity_model`, `user_id` populated same as `track()`
- Fire-and-forget: `void db.events.create({ data: ... })` — no `await`

Sentry dispatch:
- Client context only
- Call `Sentry.captureException(error)` — pass the raw `Error` object
- Wrap in try/catch — provider failure must not surface to caller

---

### 3. Why This Comes Next

`track()` (Milestone 9) established the full routing pipeline: identity read → context detection → provider dispatch → Postgres write. `error()` follows the identical pattern with one difference: Sentry receives `captureException(error)` instead of `captureMessage`, and the reserved event name `"error"` is hardcoded. All dependencies (identity layer, context utils, provider modules, `DbClient` interface) are already in place. This is the last public method to implement before the package is feature-complete for V1.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/error/error.ts` | Core `error()` implementation — identity read, context detection, provider routing, Postgres write, hybrid enrichment |
| `src/error/index.ts` | Barrel re-export of `error` for internal imports |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `src/providers/sentry.ts` | Add `captureError(error: Error): void` function (or update existing error dispatch) that calls `Sentry.captureException(error)` wrapped in try/catch | Provider leaf module needs error-specific capture method |
| `src/instance.ts` | Wire `error()` instance method to delegate to `src/error/error.ts`; pass `db`, `config`, and in-memory identity state as arguments | Instance is the integration point for all three methods |
| `src/providers/index.ts` | Re-export `captureError` alongside existing exports if not already exported | Barrel must expose all provider functions |

---

### 6. Files to Leave Untouched

- `src/track/track.ts` — do not modify; error() is a parallel implementation, not a consolidation
- `src/track/index.ts` — untouched
- `src/identify/` — untouched
- `src/identity/` — untouched; read only via existing exports
- `src/init.ts` — untouched
- `src/index.ts` — untouched; `error()` is already on `DotellInstance`, not a top-level export
- `src/types.ts` — untouched unless a type is genuinely missing and has no safe assumption (see ambiguity protocol)
- `src/utils/context.ts` — untouched; use existing context detection exports
- `src/db/` — untouched; use existing `EventInsert` type and `DbClient` interface
- `migrations/` — untouched; schema already supports `event = 'error'`
- `tsup.config.ts`, `package.json`, `tsconfig.json` — untouched

---

### 7. Layer Rules (Most Relevant)

1. **Provider leaf rule:** `src/providers/sentry.ts` must contain only the Sentry SDK call wrapped in try/catch. No identity logic, no context detection, no Postgres writes inside the provider module.
2. **Identity read-only in error layer:** `src/error/error.ts` reads identity state via `getResolvedUserId()` and hybrid state accessors. It does not write or mutate identity state.
3. **Instance is wiring only:** `src/instance.ts` delegates to `src/error/error.ts` — it does not contain routing logic, provider calls, or Postgres writes inline.

---

### 8. Engineering Rules

**DO:**
- Return `void` from `error()` — not async, not a promise
- Use fire-and-forget for Postgres: `void db.events.create({ data: ... })` — no `await` at call site
- Wrap all Sentry calls in try/catch — provider failures must never surface
- Emit `console.warn` in dev for: null userId, edge runtime detection
- Store `error.message` and `error.name` in the `properties` JSONB field
- Use `"error"` as the hardcoded `event` field value in Postgres — it is a reserved event name
- Apply hybrid enrichment (inject `deviceId`, `role` into properties) using the same pattern as `track()`
- Export all new types explicitly and name them — no anonymous inlined types

**DON'T:**
- Do not `await` Postgres writes
- Do not throw at runtime under any circumstances
- Do not call `captureException` on the server — Sentry dispatch is client-only in this method
- Do not duplicate context detection logic — import from existing `src/utils/context.ts`
- Do not duplicate identity resolution logic — import from existing identity layer
- Do not add a new column or modify the events schema — `error.message` and `error.name` go in `properties` JSONB
- Do not modify `track()` to consolidate shared logic — that is out of scope for this milestone
- Do not gate the Postgres write on a non-null userId — null userId is a valid event state

---

### 9. Ambiguity Protocol

If any of the following are true, **stop and record the ambiguity in Open Questions rather than guessing:**
- The existing `src/providers/sentry.ts` already has a function named `captureError` with a different signature — do not silently overwrite it; document the conflict
- The `getResolvedUserId()` import path has changed from what was established in Milestone 9 — do not guess the path
- The hybrid state accessors used in `track()` for injecting `deviceId` and `role` into properties do not exist as importable functions — document what is missing
- `EventInsert` type is missing a field required by the `error()` write — document rather than extend silently

If a safe assumption exists based on the Milestone 9 implementation (e.g., identical import paths, same hybrid enrichment pattern), state the assumption explicitly in Assumptions Made.

---

### 10. What Is NOT in This Milestone

- Consolidating shared logic between `track()` and `error()` into a shared utility — deferred, not in scope
- Adding `error.stack` to the Postgres properties write — not specified, do not add
- Server-side Sentry capture — explicitly excluded; server context routes to Postgres only
- Any change to the events table schema
- Any change to `initDotell()` config shape
- Publishing, versioning, or README updates
- React error boundary integration
- Any new public exports from `src/index.ts`
- PII sanitization of the error object before Sentry dispatch

---

### 11. Assumptions Made

- Context detection import path is `src/context.js` (milestone references `src/utils/context.ts`; not present in codebase).
- `getResolvedUserId()` and `getHybridDeviceId()` import paths match Milestone 9 implementation.
- `dispatchSentryError()` retained alongside new `captureError()` — error path uses `captureError(err)` per milestone spec (raw Error, no extra properties to Sentry).
- `src/error.ts` removed; replaced by `src/error/error.ts` + `src/error/index.ts` (parallel to track structure).
- Postgres `properties` always includes `message` and `name` from the Error object; `stack` intentionally omitted per milestone scope.

---

### 12. Open Questions

- **`dispatchSentryError` vs `captureError`:** Pre-existing `dispatchSentryError(err, properties)` passes properties as Sentry `extra`. Milestone adds `captureError(error: Error)` with raw `captureException(error)` only. Both exported; consider removing `dispatchSentryError` if unused.