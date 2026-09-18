# MILESTONE_16.md

## SECTION 1 — HUMAN SUMMARY

Milestone 16 is the final integration test pass for the dotell package. This milestone writes a lightweight integration test suite that exercises the three public methods (track, identify, error) across all three identity models and both execution contexts (client, server), using a mock db client and stubbed PostHog/Sentry. It comes next because all source code, types, and documentation are complete — the package needs a verified test pass before publish. Estimated session complexity: medium.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Title:** Integration Test Suite
**Number:** 16

---

### 2. What This Milestone Builds

A focused integration test suite that exercises dotell's public API end-to-end using mocked external dependencies. Tests confirm:

- `initDotell()` initializes correctly, is idempotent (second call warns, returns existing instance), and throws on hard errors (missing db client, unrecognized identity model)
- `track()` routes correctly by context (client → PostHog + Sentry + Postgres; server → Postgres only)
- `identify()` sets in-memory identity state correctly for all three models (anonymous, authenticated, hybrid); sends traits to PostHog; does NOT write a Postgres row
- `error()` writes to Postgres events table with reserved event name `'error'` and forwards to Sentry; carries correct identity context
- `track()` called before `identify()` emits event with `null` userId and issues a console warning in dev (no throw)
- Edge Runtime detection skips all providers and warns in console
- Hybrid identity: PIN user id appears as `userId`, device id appears in `properties.deviceId`; restoring device role clears PIN user
- Provider failures (db write throws, PostHog throws, Sentry throws) are caught internally — no throw propagates to caller

**Test runner:** Vitest (matches ESM-only, TypeScript project; no Jest CJS compatibility overhead).

**Mocking strategy:**
- `db` client: inline mock object satisfying `DbClient` interface — `events.create()` is a `vi.fn()` that resolves immediately
- PostHog: `vi.mock('posthog-js')` — stub `capture()` and `identify()` calls
- Sentry: `vi.mock('@sentry/nextjs')` — stub `captureException()` and `setUser()` calls
- `typeof window`: manipulated per test to simulate client vs server context
- `typeof EdgeRuntime`: set on `globalThis` to simulate edge context

**Test file location:** `src/__tests__/integration.test.ts`

**No new source files are created.** Only the test file and test runner config are added.

---

### 3. Why This Comes Next

All source code milestones (M1–M12), publish manifest (M14), and README (M13/M15) are complete. The package compiles. Integration tests are the final verification gate before `npm publish`. No further source changes are expected. This milestone proves the assembled package behaves correctly as a unit before it leaves the repository.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/__tests__/integration.test.ts` | Full integration test suite covering all public API methods, all identity models, both execution contexts, provider failure isolation, and edge runtime detection |
| `vitest.config.ts` | Vitest configuration — ESM mode, TypeScript, test file glob, environment set to `node` |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `package.json` | Add `vitest` to `devDependencies`; add `"test": "vitest run"` script | Test runner must be installed and invokable |

---

### 6. Files to Leave Untouched

- `src/index.ts`
- `src/init.ts`
- `src/track.ts`
- `src/identify.ts`
- `src/error.ts`
- `src/context.ts`
- `src/types.ts`
- `src/db.ts`
- `src/migration.sql`
- `tsconfig.json`
- `tsup.config.ts`
- `README.md`
- `.npmignore` (or `files` field in `package.json` — do not alter publish manifest)

---

### 7. Layer Rules Reminder

1. **Context detection is internal.** Tests simulate client/server/edge by manipulating `typeof window` and `typeof EdgeRuntime` on `globalThis` — they do not import or invoke context-switching utilities directly. dotell's own routing logic must handle context based on environment state.
2. **Never throw at runtime.** Tests must assert that all provider failures (db throws, PostHog throws, Sentry throws) are caught internally and do not propagate. A test that expects a throw from `track()`, `identify()`, or `error()` after init is a failing test by design.
3. **identify() does not write Postgres.** Any test asserting `db.events.create` was called from `identify()` is incorrect. `identify()` only mutates in-memory state and calls PostHog traits. Tests must assert `db.events.create` was NOT called on `identify()`.

---

### 8. Engineering Rules

**DO:**
- Use `vi.fn()` for all external provider mocks — verify call counts and arguments, not implementation
- Reset all mocks and module state between tests using `beforeEach` — prevent identity state from leaking across tests
- Assert `void` return from `track()`, `identify()`, `error()` — these must never return a promise to the test
- Test the `null` userId path explicitly: anonymous server context, authenticated model before `identify()`, and hybrid with no PIN user active
- Test idempotency: second `initDotell()` call with same config returns same instance and emits a console warning
- Test hard-error init cases: missing `db` throws, unrecognized `model` throws
- Test soft-warning init cases: missing PostHog key warns but does not throw; missing Sentry DSN warns but does not throw

**DON'T:**
- Do not import Sentry or PostHog directly in test file — only mock them
- Do not write tests that `await` the return value of `track()`, `identify()`, or `error()` — they are synchronous void
- Do not add tests for Pages Router, Edge Runtime instrumentation, or server-side `identify()` — these are V1 out-of-scope
- Do not create fixture files, snapshot files, or separate mock modules — keep all mocks inline in the test file
- Do not modify any source files to make tests pass — if a test cannot be written against the existing source API, record it as an Open Question
- Do not add `@vitest/ui`, coverage reporters, or CI config — plain `vitest run` only at V1

---

### 9. Ambiguity Protocol

If any of the following arise, stop and record in Open Questions rather than assuming:

- The existing source API shape differs from what is documented in the domain model (e.g., `initDotell()` returns a different interface than expected)
- Context detection cannot be simulated via `globalThis` manipulation without modifying source
- PostHog or Sentry mock paths differ from the actual import paths used in source
- `db.events.create` call signature in source does not match the `DbClient` interface documented in `tech_stack` domain
- Vitest and tsup share a `tsconfig.json` and there is a conflict between test and build compilation targets

---

### 10. What Is NOT in This Milestone

- Unit tests for individual internal modules (context.ts, db.ts in isolation)
- End-to-end tests against a real Postgres database
- Coverage thresholds or coverage reporting configuration
- CI/CD pipeline configuration (GitHub Actions, etc.)
- Any source code changes
- Any README changes
- Publishing to npm
- Snapshot testing
- Performance or load testing
- Linting or formatting configuration

---

### 11. Assumptions Made

- **`vi.doMock()` after `vi.resetModules()`** is required for PostHog because the provider uses dynamic `import('posthog-js')`. Top-level `vi.mock()` alone does not reliably intercept dynamic imports after module reset.
- **`context.ts` constants are evaluated at module load time**, so each test that needs a different runtime context must call `vi.resetModules()` and set `globalThis.window` / `globalThis.EdgeRuntime` before importing `initDotell`.
- **PostHog dispatch is async** (dynamic import + fire-and-forget IIFE). Client tests that call both `identify()` and `track()` must `await vi.waitFor()` for the identify dispatch to settle before asserting on capture, due to shared `initialized` state in the PostHog provider module.
- **`NODE_ENV=development`** is set in `beforeEach` so dev-only `warnIfDev()` assertions can be verified.
- **Milestone mentions `setUser()` for Sentry mock**, but source only uses `addBreadcrumb` and `captureException` — Sentry mock stubs those two only.
- **Milestone file list references `src/track.ts` / `src/error.ts`** as untouched; actual paths are `src/track/track.ts` and `src/error/error.ts`. Tests import via `../init.js` without touching those files.

---

### 12. Open Questions

None.