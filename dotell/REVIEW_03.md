# REVIEW_03.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 3 of the dotell package. Read through Cursor's self-audit below and verify that every file created matches its stated purpose, that no layer boundaries were crossed, and that all engineering rules from the domain model remain intact. Pay particular attention to the identity state machine, the fire-and-forget Postgres write pattern, context detection logic, and the public API shape — these are the highest-risk areas in this milestone. A passing review means: no runtime throws, no awaited Postgres writes at the call site, all public types named and exported, and no assumptions made that contradict decisions already locked in the domain model.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- **Title:** PostHog Provider — Client-Side track() and identify() Dispatch
- **Number:** 3

---

### 2. Files Created
| File | Description |
|------|-------------|
| `src/providers/posthog.ts` | Lazy PostHog init via dynamic import; `dispatchPostHogTrack()` and `dispatchPostHogIdentify()` with client-context guards, missing-key dev warnings, and try/catch failure swallow |

---

### 3. Files Modified
| File | What changed | Why |
|------|-------------|-----|
| `src/instance.ts` | Added PostHog dispatch calls in `track()` and `identify()` after core impl, guarded by `context === 'client'` and `config.posthogKey` | Milestone 3 wiring point per spec |
| `src/track.ts` | PostHog TODO replaced with Sentry + Postgres TODO only | PostHog moved to `instance.ts`; remaining providers deferred |
| `src/identify.ts` | PostHog TODO removed | PostHog dispatch handled in `instance.ts` after state update |

---

### 4. Assumptions Made
- `posthog.identify()` traits passed as flat map from `IdentifyOptions` spread plus `identityModel`.
- `posthog.init(posthogKey)` with SDK defaults — no custom Next.js-specific options.
- Dynamic `import('posthog-js')` for lazy, client-safe loading; dispatch is fire-and-forget async internally, void at call site.
- `initialized` flag persists for process lifetime — not reset for tests.
- `userId` passed to `dispatchPostHogTrack()` is available for future use; PostHog event association relies on prior `posthog.identify()` call.

---

### 5. Open Questions
None.

---

### 6. Risks
- **First-event race:** Fire-and-forget dynamic import means the first `track()` call may complete its void return before PostHog init/capture finishes — acceptable per design but first event could be dropped on slow networks.
- **Double context check:** `trackImpl`/`identifyImpl` and `instance.ts` both call `detectContext()` — minor overhead, defense in depth per milestone.
- **Server bundle still references provider:** `instance.ts` imports `providers/posthog.ts` which dynamically imports `posthog-js` — should not execute SDK code on server, but bundle size includes provider module.
- **Anonymous model:** `getResolvedUserId()` returns null until localStorage milestone — PostHog identify skipped with dev warning; captures still fire anonymously.

---

### 7. Layer Violations
- None. PostHog SDK imported only in `providers/posthog.ts`. `instance.ts` imports dispatch functions, not `posthog-js` directly. Context detection remains in `context.ts`. Identity state unchanged in `identity/`.

---

### 8. Engineering Rule Violations
- None for this milestone's scope:
  - PostHog never called outside client context (guarded at call site + provider).
  - Lazy init — no init at module load or `initDotell()` time.
  - Provider failures caught internally; dev warn, production swallow.
  - `track()`, `identify()`, `error()` return void; no await at call sites.
  - `error()` PostHog dispatch not added (correct — not in scope).
  - No new public types or config keys.
  - Postgres and Sentry not touched.

---

### 9. Ready to Proceed
- **Decision:** Yes
- **Reasoning:** PostHog provider module created with lazy init, dual client guards, and failure isolation. `instance.ts` wires `track()` and `identify()` dispatch per milestone spec. Build passes. No layer or engineering rule violations. Ready for Milestone 4 (Sentry) and Milestone 5 (Postgres).
