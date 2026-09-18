# REVIEW_05.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 5 of the dotell package. Before reading Cursor's self-audit below, confirm the following: all public types are named and exported (no anonymous inlined types), track/identify/error all return void synchronously, and no layer violations exist between context detection, provider routing, and public API surface. A passing review means zero runtime throws, fire-and-forget Postgres writes verified, provider failures isolated, and the package builds cleanly with tsup producing ESM + .d.ts output. Pay particular attention to the DbClient interface shape and whether the idempotency rule on initDotell() is correctly implemented.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- **Title:** Postgres Provider Extraction
- **Number:** 5

---

### 2. Files Created
| File | Description |
|------|-------------|
| `src/providers/postgres.ts` | `dispatchPostgresEvent(db, eventRow)` — fire-and-forget `db.events.create({ data })` with internal `.catch()` and dev-only warn |

---

### 3. Files Modified
| File | What Changed | Why |
|------|-------------|-----|
| `src/instance.ts` | Removed inline `writeErrorToPostgres()`; both `track()` and `error()` call `dispatchPostgresEvent()`; added Postgres write to `track()` on client + server (non-edge) | Consolidates all Postgres writes through provider layer |

---

### 4. Assumptions Made
- Parameter type is `EventInsert` (not `EventRow`) because `DbClient.events.create()` requires the insert shape without `id`/`created_at`.
- `track()` Postgres path was net-new (not a refactor of existing inline code); `error()` path was moved from inline helper.
- Shared `buildEventProperties()` enrichment unchanged — identity resolution stays in `instance.ts`.

---

### 5. Open Questions
- Milestone doc says `EventRow` parameter type; implementation correctly uses `EventInsert`. Consider updating milestone/ONBOARDING prose for consistency.

---

### 6. Risks
- **track() behavior change:** Postgres writes now occur for `track()` on client + server — aligns with ONBOARDING but was not active before Milestone 5. Verify in consuming app if early integration assumed no DB writes on track.
- **No test coverage:** Fire-and-forget failure path only warns in dev — silent data loss in production on DB failure is by design.
- **Shared helper, two call sites:** Any future schema change must update `instance.ts` row construction in both `track()` and `error()`.

---

### 7. Layer Violations
- None. `providers/postgres.ts` receives fully-resolved insert rows only. Identity resolution, context detection, and property enrichment remain in `instance.ts`. `dispatchPostgresEvent` imported only from `instance.ts`, not exported from public API.

---

### 8. Engineering Rule Violations
- None:
  - No `await` at call sites — `void db.events.create(...).catch(...)` inside provider
  - No retry or batching
  - Provider failures caught internally (dev warn, prod swallow)
  - Methods return void synchronously
  - No new public exports
  - `EventRow` / `DbClient` interfaces unchanged
  - `identify()` still writes no Postgres row

---

### 9. Ready to Proceed
- **Decision:** yes
- **Reasoning:** Postgres write logic extracted to `providers/postgres.ts`. Both `track()` and `error()` use shared `dispatchPostgresEvent()` with identical row shape. Inline write removed from `instance.ts`. Build passes. All three providers (PostHog, Sentry, Postgres) now isolated in `providers/`. Package ready for testing/integration milestones.
