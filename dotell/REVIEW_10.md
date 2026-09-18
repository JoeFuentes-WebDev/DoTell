# REVIEW_10.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 10 of the dotell package. Read through Cursor's self-audit below and verify that every file listed exists, every assumption is acceptable, and no layer violations or engineering rule violations are present. A passing review means: all files are accounted for, the public API matches the spec, no runtime throws were introduced, the fire-and-forget Postgres write pattern was followed, and no layer was collapsed (e.g., routing logic mixed into identity logic, or provider code leaking into the public API surface). If any open questions exist, resolve them before proceeding to the next milestone.

---

## SECTION 2 — CURSOR DIRECTIVE

You have just completed a milestone on the dotell project. Fill in every field below honestly. Do not skip sections. Do not hedge. If something is wrong, say so.

---

### 1. Milestone Completed

**Title:** error() Method Implementation
**Number:** 10

---

### 2. Files Created

List every file created in this milestone. One line per file describing what it does.

| File | Description |
|------|-------------|
| `src/error/error.ts` | End-to-end `error()` — identity read, context detection, Sentry capture (client), Postgres write with reserved event name, hybrid + error metadata in properties |
| `src/error/index.ts` | Barrel re-export of `error` for internal imports |

---

### 3. Files Modified

List every file modified in this milestone. For each, state what changed and why.

| File | What changed | Why |
|------|--------------|-----|
| `src/providers/sentry.ts` | Added `captureError(error: Error)` calling `captureException(error)`; kept `dispatchSentryError` for backward compatibility | Milestone error-specific Sentry dispatch |
| `src/providers/index.ts` | Re-exports `captureError` | Barrel exposure |
| `src/instance.ts` | `error()` delegates to `error/error`; removed inline routing and `buildEventProperties` | Instance wiring only per layer rules |
| `src/error.ts` | **Deleted** — replaced by `src/error/` directory | Parallel structure to `track/` |

---

### 4. Assumptions Made

List every decision made where the instructions were ambiguous or silent. If none, write **None**.

- Context utils live at `src/context.js`, not `src/utils/context.ts` referenced in milestone prose.
- `captureError` used instead of `dispatchSentryError` for error path — milestone specifies raw Error to Sentry without properties extra.
- `error.stack` not included in Postgres properties — explicitly out of scope.

---

### 5. Open Questions

List anything unresolved that the developer must decide before the next milestone. If none, write **None**.

- Remove unused `dispatchSentryError` export, or keep for external/test use?

---

### 6. Risks

List anything that could break silently, requires manual verification, or depends on external behavior not tested in this milestone. If none, write **None**.

- **`buildErrorProperties` / `buildEventProperties` duplication** between `error/error.ts` and `track/track.ts` — deferred consolidation per milestone scope.
- **Sentry on server:** `captureError` only called when `context === 'client'` — server Postgres-only path verified in code, not integration-tested.

---

### 7. Layer Violations

List any place where two architectural layers were collapsed into one. There should be none.

None. Provider (`captureError`), error routing (`error/error.ts`), and instance wiring (`instance.ts`) remain separated.

---

### 8. Engineering Rule Violations

List any engineering rule from the project spec that was bent or broken. If none, write **None**.

None:
- Returns void, never throws
- Postgres fire-and-forget via `dispatchPostgresEvent`
- Sentry client-only for `error()`
- Null userId allowed with dev warning
- `event: 'error'` hardcoded; `message`/`name` in properties JSONB
- No schema changes, no new public exports

---

### 9. Ready to Proceed

**Decision:** Yes

**Reasoning:** All three public methods (`track`, `identify`, `error`) now have dedicated implementation modules. `error()` routes client → Sentry + Postgres, server → Postgres only, edge → skip with dev warn. Build passes. V1 method surface is feature-complete.
