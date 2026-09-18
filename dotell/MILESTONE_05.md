# MILESTONE_05.md

## SECTION 1 — HUMAN SUMMARY

Milestone 5 extracts all Postgres write logic into a dedicated `providers/postgres.ts` module and consolidates the fire-and-forget write helper shared by both `track()` and `error()`. The inline Postgres write currently living in `instance.ts` for `error()` is moved into this provider, and `track()`'s Postgres path is wired through the same helper. This is a refactor milestone only — no new methods, no new public API surface, no behavior changes. Estimated session complexity: low.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone title and number
**Milestone 5 — Postgres Provider Extraction**

---

### 2. What this milestone builds

A dedicated `src/providers/postgres.ts` module that owns all Postgres write logic. It exports a single internal function `dispatchPostgresEvent()` that accepts a fully-resolved event row and performs a fire-and-forget write using the injected `DbClient`. The inline Postgres write currently embedded in `instance.ts` (for `error()`) and any equivalent logic in `track()` are removed from `instance.ts` and replaced with calls to `dispatchPostgresEvent()`. No behavior changes. No new public exports. No schema changes.

---

### 3. Why this comes next

Milestone 4 review explicitly flagged that the Postgres write for `error()` was left inline in `instance.ts` with a note to consolidate in Milestone 5. `track()` also routes to Postgres on both client and server contexts. Both paths need to share the same write helper to avoid duplication and to isolate provider logic per the architecture layer rules. This is the prerequisite cleanup before any further provider work or testing infrastructure.

---

### 4. Files to create

| File | Purpose | Description |
|------|---------|-------------|
| `src/providers/postgres.ts` | Postgres provider module | Exports `dispatchPostgresEvent(db, eventRow)` — accepts a `DbClient` and a fully-resolved `EventRow`; performs fire-and-forget `db.events.create({ data: eventRow })`; wraps in `.catch()` with dev-only console warn; never throws |

---

### 5. Files to modify

| File | What changes | Why |
|------|-------------|-----|
| `src/instance.ts` | Remove inline Postgres write logic from both `track()` and `error()` call paths; replace with `dispatchPostgresEvent(config.db, eventRow)` calls; add import of `dispatchPostgresEvent` from `./providers/postgres` | Delegates write responsibility to the provider layer; eliminates duplication |

---

### 6. Files to leave untouched

- `src/init.ts` — singleton guard and config validation unchanged
- `src/types.ts` — no new types; `EventRow` and `DbClient` already defined
- `src/providers/posthog.ts` — PostHog provider unchanged
- `src/providers/sentry.ts` — Sentry provider unchanged
- `src/error.ts` — edge guard and delegation unchanged
- `src/track.ts` — if it exists as a thin entry; delegation unchanged
- `src/identify.ts` — identify unchanged
- `src/index.ts` — public exports unchanged
- `migrations/` — SQL file unchanged
- `tsup.config.ts` — build config unchanged
- `package.json` — no dependency changes

---

### 7. Layer rules reminder

1. **Provider modules own all provider-specific logic.** Postgres write logic must live entirely in `src/providers/postgres.ts`. `instance.ts` calls the provider function; it does not construct raw db calls.
2. **Fire-and-forget is non-negotiable.** `dispatchPostgresEvent()` must not be awaited at the call site in `instance.ts`. The `.catch()` handler lives inside the provider function, not at the call site.
3. **No layer bleeding.** `src/providers/postgres.ts` receives a fully-resolved `EventRow` — it does not perform identity resolution, context detection, or property enrichment. Those remain in `instance.ts`.

---

### 8. Engineering rules

**DO:**
- Accept `DbClient` and `EventRow` as parameters to `dispatchPostgresEvent()` — no module-level state in the provider
- Use `.catch()` inside `dispatchPostgresEvent()` to swallow failures; log with `console.warn` in dev (`process.env.NODE_ENV !== 'production'`) only
- Keep `dispatchPostgresEvent()` as an internal export only — not re-exported from `src/index.ts`
- Preserve the exact same fire-and-forget pattern that was passing the Milestone 4 engineering rule audit
- Ensure `EventRow` used as the parameter type is the same named type already exported from `src/types.ts` — do not define a new inline type

**DON'T:**
- Do not add `async`/`await` anywhere in the call chain from `instance.ts` through to `dispatchPostgresEvent()`
- Do not add retry logic — fire-and-forget with `.catch()` is the complete contract
- Do not add batching — one write per call, always
- Do not add a new public export to `src/index.ts`
- Do not change the `EventRow` schema or `DbClient` interface
- Do not alter identity resolution logic in `instance.ts` — only the write call changes
- Do not import `dispatchPostgresEvent` in any file other than `instance.ts`

---

### 9. Ambiguity protocol

If the existing `track()` Postgres path in `instance.ts` is structured differently than the `error()` path (e.g., different property shapes, different identity fields), **stop and record the discrepancy** rather than silently normalizing it. Do not assume both paths are identical without inspecting the current implementation. Record any structural differences in the Open Questions section below before proceeding.

If `EventRow` in `src/types.ts` does not exactly match what is being passed to `db.events.create()` in the current inline calls, **stop and record** rather than silently adjusting the type.

---

### 10. What is NOT in this milestone

- No new public API methods
- No changes to `track()`, `identify()`, or `error()` behavior — only the internal write path changes
- No changes to the `EventRow` schema or `DbClient` interface
- No new exports from `src/index.ts`
- No test files — testing infrastructure is a separate milestone
- No retry logic or batching
- No changes to PostHog or Sentry providers
- No changes to `init.ts` singleton or config validation
- No README updates
- No migration SQL changes

---

### 11. Assumptions Made

- Milestone prose references `EventRow` as the dispatch parameter type, but `DbClient.events.create()` accepts `EventInsert` (`Omit<EventRow, 'id' | 'created_at'>`). `dispatchPostgresEvent()` uses `EventInsert` — the correct insert shape.
- `track()` had no Postgres write before this milestone; wiring it through `dispatchPostgresEvent()` is new internal path but matches ONBOARDING routing (Postgres on client + server, not edge).
- `track()` and `error()` Postgres paths share identical row shape via `buildEventProperties()`; only the `event` field differs (dynamic vs reserved `'error'`).
- Generic failure message `Postgres write failed` replaces path-specific `Postgres error write failed` — same dev-only warn contract.

---

### 12. Open Questions

- **EventRow vs EventInsert naming:** Milestone Section 4/8 specifies `EventRow` parameter type; implementation uses `EventInsert` to match `DbClient` interface. Confirm whether milestone doc should be updated to say `EventInsert`.
- **track() Postgres was absent pre-milestone:** Not a structural discrepancy between two existing paths — `error()` had inline write, `track()` had none. Both now unified.