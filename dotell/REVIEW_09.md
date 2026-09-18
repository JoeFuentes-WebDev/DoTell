# REVIEW_09.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 9 of the dotell package. Read through Cursor's self-audit below and confirm that every file created or modified is accounted for, that no layer violations occurred (e.g., identity logic leaking into provider modules, or Postgres writes appearing in client-only paths), and that all assumptions are clearly stated. A passing review means: the milestone deliverables are complete, the public API shape matches the TypeScript contracts defined in earlier milestones, no engineering rules were bent, and there are no silent risks that could cause unexpected behavior in a consuming Next.js app. Pay particular attention to any open questions — these require your decision before Milestone 10 begins.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- **Title:** track() Method Implementation
- **Number:** 9

---

### 2. Files Created
| File | Description |
|------|-------------|
| `src/track/track.ts` | End-to-end `track()` — identity read, context detection, provider routing, hybrid property enrichment, dev warnings |
| `src/track/index.ts` | Re-exports `track` for internal imports |
| `src/providers/index.ts` | Barrel re-export of all provider dispatch functions |

---

### 3. Files Modified
| File | What Changed | Why |
|------|--------------|-----|
| `src/instance.ts` | `track()` delegates to `track/track`; provider routing removed from instance; identify PostHog updated for new provider signatures | Instance wires methods; track logic lives in track layer |
| `src/providers/posthog.ts` | Refactored to plain-value args (`posthogKey` string); thin try/catch wrappers for track/identify | Provider leaf module per layer rules |
| `src/providers/sentry.ts` | Removed context guards (callers gate); thin try/catch wrappers | Provider leaf module per layer rules |
| `src/track.ts` | **Deleted** — replaced by `src/track/track.ts` | Milestone directory structure |

---

### 4. Assumptions Made
- Instance constructor lives in `src/instance.ts`, not `src/core/dotell.ts`.
- `EventInsert` used for Postgres writes (matches `DbClient` interface).
- `src/index.ts` left unchanged — `track()` remains on `DotellInstance`, not a top-level export.
- Provider files pre-existed from Milestones 3–5; refactored in place per milestone create list.

---

### 5. Open Questions
- None.

---

### 6. Risks
- **`buildEventProperties` duplicated** in `track/track.ts` and `instance.ts` (error path) — Milestone 10 may consolidate.
- **PostHog lazy init** remains fire-and-forget async — first track event may race (inherited from M3).
- **Edge warn message** updated to milestone-specified string; differs from prior `edge runtime detected` wording on other methods.

---

### 7. Layer Violations
- [x] Any identity logic placed outside the identity layer? **No** — track reads identity via `getResolvedUserId`; hybrid enrichment uses `getHybridDeviceId` read-only.
- [x] Any Postgres write logic appearing in a client-only path? **No** — Postgres runs on client + server, not edge.
- [x] Any provider-specific logic leaking into the core dispatch layer? **No** — SDK calls isolated in `providers/`.
- [x] Any `initDotell()` config validation logic duplicated across modules? **No**.

**Violations found:** None.

---

### 8. Engineering Rule Violations
- [x] Did any method throw at runtime? **No**
- [x] Did any Postgres write use `await` at the call site? **No**
- [x] Were any public types left anonymous or unexported? **No**
- [x] Did `initDotell()` mutate a module-level singleton instead of returning a typed instance? **No change** — idempotency guard unchanged in `init.ts`
- [x] Was any CJS output produced? **No**
- [x] Did any provider failure surface to the caller? **No** — try/catch + dev warn / prod swallow

**Violations found:** None.

---

### 9. Ready to Proceed
- **Decision:** Yes
- **Reasoning:** `track()` runs end-to-end: client → PostHog + Sentry + Postgres; server → Postgres only; edge → skip with dev warn. Null userId allowed with dev warning. Provider failures isolated. Build passes. Ready for Milestone 10 (`error()` consolidation).
