# MILESTONE_09.md

## SECTION 1 — HUMAN SUMMARY

This milestone wires up the `track()` method — the core event emission path. It reads the current identity state from memory, detects execution context (client/server/edge), routes to the appropriate providers (PostHog + Sentry + Postgres on client; Postgres only on server; skip all on edge), and writes fire-and-forget. This is the first milestone where provider routing logic runs end-to-end. Estimated complexity: medium-high — multiple code paths, context branching, and integration with identity state established in prior milestones.

---

## SECTION 2 — CURSOR DIRECTIVE

# Milestone 9 — track() Method Implementation

## 1. What This Milestone Builds

The `track()` method, end-to-end. This includes:

- Reading current identity state (userId, identityModel, role, deviceId) from the in-memory state established by `identify()`
- Detecting execution context: client, server, or edge
- Routing to providers based on context:
  - **Client**: PostHog + Sentry + Postgres
  - **Server**: Postgres only
  - **Edge**: skip all providers, `console.warn` once
- Writing the Postgres event row as fire-and-forget (`void db.events.create(...)`)
- Capturing `console.warn` in dev for track-before-identify (null userId)
- Isolating provider failures — one provider failing must not affect others

`track()` must return `void` synchronously. It must never throw. All async work is internal.

## 2. Why This Comes Next

`initDotell()`, the `DbClient` interface, identity state management (`identify()`), context detection, and the anonymous UUID module are all complete. `track()` is the first method that exercises every prior piece together. It is the core observable behaviour of the package. `error()` shares its routing logic and comes after.

## 3. Files to Create

- `src/track/track.ts` — Core `track()` implementation. Reads identity state, detects context, routes to providers, returns void.
- `src/track/index.ts` — Re-exports `track` from `track.ts` for clean internal import paths.
- `src/providers/posthog.ts` — Thin wrapper around PostHog `capture()`. Accepts event name + properties. No throw on failure. Console warn in dev.
- `src/providers/sentry.ts` — Thin wrapper around Sentry breadcrumb or event capture for track calls. No throw on failure. Console warn in dev.
- `src/providers/postgres.ts` — Thin wrapper that calls `db.events.create({ data: EventRow })` as fire-and-forget. No throw. Console warn in dev.
- `src/providers/index.ts` — Re-exports all three provider wrappers.

## 4. Files to Modify

- `src/index.ts` — Export `track` as part of the public API if not already wired. Ensure the method is accessible from the dotell instance returned by `initDotell()`. Do not break existing exports.
- `src/core/dotell.ts` (or equivalent dotell instance file) — Attach `track()` to the returned instance. Wire it to read from the shared identity state and the injected `db` client.

> **Note:** If the instance file has a different name (e.g., `src/dotell.ts`, `src/core/instance.ts`), locate it by finding where `initDotell()` constructs and returns the typed instance. Modify that file. Do not create a duplicate.

## 5. Files to Leave Untouched

- `src/identity/anonymous.ts`
- `src/identity/state.ts`
- `src/identity/index.ts` (if it exists)
- `src/context/index.ts` (or wherever context detection lives — read only, do not modify)
- `src/types/index.ts` (or wherever `DbClient`, `EventRow`, and public types are defined — read only, do not modify unless a type is genuinely missing and cannot be found elsewhere)
- `src/migrations/` — untouched
- `tsup.config.ts`, `tsconfig.json`, `package.json` — untouched unless a new entry point requires explicit registration (it should not)

## 6. Layer Rules Reminder

1. **Provider wrappers are leaf modules.** `src/providers/*.ts` must not import from `src/identity/`, `src/track/`, or `src/core/`. They accept only plain values (strings, objects) as arguments.
2. **Context detection is read-only from track().** `track.ts` calls the existing context detection utility. It does not reimplement detection logic.
3. **Identity state is read-only from track().** `track.ts` reads the current identity snapshot from `src/identity/state.ts`. It does not write to identity state.

## 7. Engineering Rules

**DO:**
- Return `void` from `track()` — synchronously, always
- Wrap every provider call in `try/catch` — log `console.warn` in dev, swallow in production
- Use `void db.events.create(...)` — no `await` at the call site
- Emit the event even when `userId` is `null` (track-before-identify case)
- Log `console.warn('dotell: track() called before identify(). userId will be null.')` in dev only (check `process.env.NODE_ENV === 'development'`)
- On edge context: `console.warn('dotell: Edge Runtime detected. track() skipped.')` — then return immediately
- Include `context` (`'client'` | `'server'`) and `identity_model` in the Postgres event row
- For hybrid model with active PIN user: include `deviceId` and `role` in `properties` JSONB alongside consumer-supplied properties

**DON'T:**
- Do not `await` any provider call at the `track()` call site
- Do not throw under any circumstances — not for missing userId, not for provider failures, not for unrecognised context
- Do not add per-call provider routing (e.g., `track('event', props, { skip: ['posthog'] })`) — all providers always
- Do not re-implement context detection — use the existing utility
- Do not import PostHog or Sentry SDKs directly in `track.ts` — use the provider wrapper layer
- Do not add retry logic
- Do not create anonymous inlined types at the public boundary — all types must be named and exported

## 8. Ambiguity Protocol

If any of the following cannot be determined by reading existing source files, **stop and record the uncertainty in Open Questions** rather than guessing:

- The exact name and path of the file where `initDotell()` constructs and returns the dotell instance
- The exact shape of the in-memory identity state (what fields exist, what their types are)
- Whether `EventRow` is already defined as a named exported type or needs to be created
- Whether PostHog and Sentry client instances are currently held in module scope, on the dotell instance, or initialised elsewhere

Do not assume. Read the existing files first.

## 9. What Is NOT in This Milestone

- `error()` method — comes after `track()` in Milestone 10
- `identify()` changes — already complete, touch only to wire `track()` if necessary
- PostHog `identify` trait sending — belongs to the `identify()` method, not `track()`
- React hooks (`useDotell()`) — deferred to V2
- Event batching — deferred to V2
- Retry logic — rejected by architecture
- Edge Runtime provider support — out of scope V1
- PII sanitization — deferred to V2
- Any new public types not directly required by `track()`

## 10. Assumptions Made

- Dotell instance file is `src/instance.ts` (not `src/core/dotell.ts` referenced in milestone prose).
- `EventInsert` / `EventRow` already defined in `src/types.ts`; Postgres provider uses `EventInsert`.
- Existing `src/providers/*.ts` files refactored to thin plain-value wrappers rather than duplicated.
- `src/track.ts` removed and replaced by `src/track/track.ts` + `src/track/index.ts`.
- `src/index.ts` unchanged — `track()` exposed via `DotellInstance` from `initDotell()`, not as standalone export.
- PostHog/Sentry client init remains lazy inside `providers/posthog.ts`; not held on dotell instance.

## 11. Open Questions

- None. Ambiguity protocol items resolved by reading existing source files before implementation.