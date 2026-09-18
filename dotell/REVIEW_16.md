# REVIEW_16.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 16 of the dotell package. Read through Cursor's self-audit below and verify that every file created or modified aligns with the architecture decisions locked in across all completed domains. Pay particular attention to layer violations (no mixing of context detection, provider logic, and identity resolution in a single module), TypeScript boundary compliance (all public types named and exported), and runtime safety (no throws outside of initDotell()). A passing review means: no silent assumptions about identity state, no provider code leaking into the wrong context, fire-and-forget Postgres writes confirmed, and Cursor has flagged any open questions it couldn't resolve from the spec rather than guessing silently.

---

## SECTION 2 — CURSOR DIRECTIVE

You have just completed a milestone. Fill in every field below honestly. Do not skip sections. Do not hedge. If something is uncertain, say so in Open Questions or Risks.

---

### 1. Milestone Completed

**Title:** Integration Test Suite
**Number:** 16

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/__tests__/integration.test.ts` | 26 integration tests covering `initDotell()`, `track()`, `identify()`, and `error()` across client/server/edge contexts, all three identity models, provider failure isolation, hybrid PIN/device behavior, and dev warnings |
| `vitest.config.ts` | Vitest config — ESM mode, `node` environment, test glob `src/__tests__/**/*.test.ts` |

---

### 3. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `package.json` | Added `vitest` to `devDependencies`; added `"test": "vitest run"` script | Test runner install and invocation per M16 spec |

---

### 4. Assumptions Made

List every decision made where the milestone instructions were ambiguous or silent. For each, state what you assumed and why.

- **PostHog mocking uses `vi.doMock()` inside `loadDotell()`** after `vi.resetModules()`, not top-level `vi.mock()` alone. The provider dynamically imports `posthog-js`; top-level mocks do not reliably intercept after module reset.
- **Context simulation requires module reload** because `isClient` / `isServer` / `isEdge` in `context.ts` are module-level constants evaluated at import time. Tests set `globalThis.window` or `globalThis.EdgeRuntime` before each dynamic import of `initDotell`.
- **Client tests await PostHog identify before asserting capture** when both are called in sequence, due to async dynamic import and shared `initialized` flag in `providers/posthog.ts`.
- **`NODE_ENV=development`** is set in `beforeEach` to verify `warnIfDev()` console warnings; restored to `test` in `afterEach`.
- **Sentry mock stubs `addBreadcrumb` and `captureException` only** — milestone mentions `setUser()` but source does not call it.
- **No separate mock module files** — all mocks inline via `vi.hoisted()` + `vi.doMock()` as required.

---

### 5. Open Questions

List anything unresolved that the developer must decide before proceeding to the next milestone.

None.

---

### 6. Risks

List anything that could break silently, requires manual verification, or depends on consuming-app behavior that dotell cannot control.

- **PostHog tests depend on async timing** — flakiness possible if dynamic import latency increases; mitigated with `vi.waitFor()` but worth watching in CI.
- **Context simulation is not identical to real browser/Edge Runtime** — tests manipulate `globalThis.window` and `EdgeRuntime`; real Next.js bundler behavior may differ at margins.
- **Anonymous client tests use a minimal `localStorage` shim** — not a full browser Storage implementation.
- **`vi.resetModules()` per test adds ~20–50ms overhead** — acceptable at 26 tests but may need pooling strategy if suite grows.

---

### 7. Layer Violations

List any place where two architectural layers were handled in the same module (e.g., context detection mixed with provider calls, identity resolution mixed with Postgres writes). There should be none. If there are, explain why it was unavoidable.

**None** — test file only; no source code modified.

---

### 8. Engineering Rule Violations

List any engineering rule from the spec that was bent or broken (e.g., a runtime throw, an anonymous exported type, a CJS output, a module-level singleton mutation, a non-void return on track/identify/error). There should be none. If there are, explain why.

**None**

---

### 9. Ready to Proceed

**Decision:** Yes

**Reasoning:** All 26 integration tests pass (`npm test`). Coverage includes init validation/idempotency, client/server/edge routing, all three identity models, hybrid PIN/device behavior, identify-without-Postgres-write, provider failure isolation (no throws after init), and dev warnings. No source files were modified. Test runner configured with plain `vitest run` only.
