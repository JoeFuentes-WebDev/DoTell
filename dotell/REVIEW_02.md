# REVIEW_02.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 2 of the dotell package. Cursor has completed the milestone and is self-auditing its work before you read it. You are looking for: working `initDotell()` with config validation and idempotency, context detection isolated to `context.ts`, in-memory identity state machine for all three models, method skeletons that return void without calling providers, and no layer violations. A passing review means the runtime host is stable and ready for provider milestones to attach dispatch calls.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- Title: Core Runtime — Config Validation, Identity State Machine, and Method Skeletons
- Number: 2

---

### 2. Files Created
| File | Description |
|------|-------------|
| `src/config.ts` | `validateConfig()` with hard throws (missing `db`, unrecognized `model`) and soft `console.warn` (missing `posthogKey`, `sentryDsn`); `configsEqual()` for idempotency |
| `src/context.ts` | `detectContext()` — pure function returning `'client' \| 'server' \| 'edge'` via `typeof EdgeRuntime` and `typeof window` |
| `src/identity.ts` | `IdentityState` interface, `createIdentityState()`, `setIdentity()`, `getResolvedUserId()` — hybrid role resolution included |
| `src/instance.ts` | `createInstance()` factory returning `DotellInstance` with `track`, `identify`, `error` method skeletons and TODO markers for provider dispatch |

---

### 3. Files Modified
| File | What Changed | Why |
|------|--------------|-----|
| `src/index.ts` | Replaced stub with real `initDotell()` — validates config, manages module-level idempotency guard, creates identity state and instance | Milestone 2 core entry point |
| `src/types.ts` | No changes required | All required types (`IdentityRole`, `IdentifyOptions`, etc.) were already present from Milestone 1 |

---

### 4. Assumptions Made
- Config field is `model` (not `identityModel` referenced in milestone prose); required, no default.
- Idempotency uses value equality for scalar fields and reference equality for `db`.
- `IdentityState` is internal to `src/identity.ts`, not part of the public API.
- Hybrid `identify()` without `role: 'device' \| 'worker'` is a no-op for state mutation.
- Edge warnings emit at method-call time in dev only, not at init.
- `void` expressions in method bodies hold resolved values until provider milestones wire dispatch.

---

### 5. Open Questions
- None.

---

### 6. Risks
- **Hybrid identify without role:** Callers who omit `role` on hybrid model get silent no-ops — may need clearer dev warnings in a future milestone.
- **Module-level singleton persists across tests:** Idempotency guard in `index.ts` prevents re-init with different config in the same process without module reload — expected for production, may complicate testing later.
- **Anonymous UUID deferred:** `track()` on anonymous model always resolves `userId` as null until localStorage milestone — dev warning will fire on every track call until `identify()` or anonymous UUID logic is added.
- **Milestone prose vs types naming:** Milestone references `identityModel`; public API uses `model`. ONBOARDING uses `IdentifyTraits`; types use `IdentifyOptions`. Reconcile in docs when convenient.

---

### 7. Layer Violations
> Any place where client-only providers (PostHog, Sentry) were invoked in a server context, or server-only logic (Postgres writes) was placed in a client context. Should be none.

- None. No provider imports or I/O calls exist. Context detection is isolated to `context.ts`.

---

### 8. Engineering Rule Violations
> Any rule from the engineering_rules domain that was bent or broken. Should be none.

- None for this milestone's scope. Deliberate milestone-compliant behavior:
  - `initDotell()` throws on hard config errors and on second call with different config — required.
  - `track()`, `identify()`, `error()` never throw at runtime — confirmed.
  - No `await` at call sites — confirmed.
  - No localStorage, PostHog, Sentry, or Postgres calls — confirmed.
  - Singleton ref lives only in `src/index.ts` — confirmed.

---

### 9. Ready to Proceed
- **Decision:** yes
- **Reasoning:** All four new runtime files created, `index.ts` stub replaced, build passes (`npm run build` succeeds). Smoke test confirms: missing `db` throws, soft warnings emit for missing keys, idempotent re-init returns same instance, `identify()` + `track()` run without error. Method bodies contain TODO markers for provider dispatch. Identity state machine handles anonymous, authenticated, and hybrid role switching. Ready for Milestone 3 (PostHog) and subsequent provider milestones.
