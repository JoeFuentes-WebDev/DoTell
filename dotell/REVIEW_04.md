# REVIEW_04.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 4 of the dotell package. Before reading Cursor's self-audit below, confirm that every file listed under "Files created" and "Files modified" exists on disk and matches its described purpose. A passing review means: all three methods (track, identify, error) are implemented and routed correctly by context, the hybrid identity state machine works as specified, the fire-and-forget Postgres write pattern is in place with no awaited db calls at the call site, and no provider failure can propagate as a thrown exception. Pay special attention to layer violations — routing logic, identity resolution, and provider calls must not bleed into each other — and verify that the TypeScript public API exports only named types with no anonymous inlined types at the boundary.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone completed
- Title: Sentry Provider — track() breadcrumb and error() dispatch
- Number: 4

---

### 2. Files created
| File | Description |
|------|-------------|
| `src/providers/sentry.ts` | `dispatchSentryBreadcrumb()` (client-only) and `dispatchSentryError()` (client + server); imports `addBreadcrumb` and `captureException` from `@sentry/nextjs`; try/catch with dev warn / prod swallow; no `Sentry.init()` |

---

### 3. Files modified
| File | What changed | Why |
|------|-------------|-----|
| `src/instance.ts` | Added `dispatchSentryBreadcrumb()` after PostHog in `track()`; implemented full `error()` with Sentry dispatch + fire-and-forget Postgres write, identity resolution, and hybrid property enrichment | Milestone 4 wiring point |
| `src/error.ts` | Updated TODO comment — core edge guard retained; dispatch delegated to `instance.ts` | Aligns with track/identify split pattern |

---

### 4. Assumptions made
- `addBreadcrumb` / `captureException` available at `@sentry/nextjs` top level — confirmed via package type re-exports.
- Sentry `properties` attached as `extra` on `captureException()`.
- Postgres error write inline in `instance.ts` per milestone (not yet extracted to `providers/postgres.ts`).
- Consuming app owns `Sentry.init()` via `instrumentation.ts`; dotell dispatches only.

---

### 5. Open questions
None.

---

### 6. Risks
- **Uninitialized Sentry:** If consuming app skips `Sentry.init()`, breadcrumb/capture calls no-op silently — expected SDK behavior.
- **Postgres write in instance.ts:** Error Postgres logic not yet in `providers/postgres.ts` — Milestone 5 should extract shared write helper for `track()` + `error()`.
- **Bundle size:** Static `@sentry/nextjs` import in provider increases dist size; acceptable for V1 bundled dependency model.
- **Async Postgres failures:** `.catch()` logs in dev only; failed writes dropped with no retry — by design.

---

### 7. Layer violations
- None critical. Postgres write for `error()` is inline in `instance.ts` rather than `providers/postgres.ts` — intentional per Milestone 4 spec; to be consolidated in Milestone 5.
- `@sentry/nextjs` imported only in `providers/sentry.ts`; `instance.ts` imports dispatch functions only.

---

### 8. Engineering rule violations

| Rule | Status | Notes |
|------|--------|-------|
| Must never throw at runtime | Pass | Sentry dispatch wrapped in try/catch; Postgres uses `.catch()` |
| All provider failures caught internally | Pass | Dev warn, prod swallow |
| Postgres writes are fire-and-forget (no await at call site) | Pass | `void config.db.events.create({ data }).catch(...)` |
| track/identify/error return void synchronously | Pass | No promises exposed to callers |
| All public types named and explicitly exported | Pass | No new types added |
| initDotell() returns typed instance, no module-level singleton mutation | Pass | Singleton guard unchanged in `init.ts` |
| No per-call provider routing | Pass | All configured providers receive calls per context rules |
| identify() does not write a Postgres row | Pass | Unchanged |
| ESM only output | Pass | Build succeeds, ESM dist only |

---

### 9. Ready to proceed
- Decision: yes
- Reasoning: Sentry provider created with client breadcrumb and client/server error capture. `track()` fans out to PostHog + Sentry on client. `error()` dispatches to Sentry (when DSN configured) and Postgres (always, fire-and-forget) with reserved event name `'error'`, resolved userId, and hybrid property enrichment. Edge context skipped. Build passes. Ready for Milestone 5 (Postgres for `track()` + provider extraction).
