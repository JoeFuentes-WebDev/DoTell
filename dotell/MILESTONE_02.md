# MILESTONE_02.md

## SECTION 1 — HUMAN SUMMARY

This milestone implements the core runtime of `initDotell()` — config validation, context detection, in-memory identity state, and the three public methods: `track()`, `identify()`, and `error()`. It replaces the stub from Milestone 1 with real logic. No provider integrations yet (PostHog, Sentry, Postgres writes come in Milestone 3+); this milestone wires the routing skeleton, identity state machine, and method contracts so every subsequent provider milestone has a stable host to attach to. Medium-high complexity session.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
- **Title:** Core Runtime — Config Validation, Identity State Machine, and Method Skeletons
- **Number:** 2

---

### 2. What This Milestone Builds

Replace the `initDotell()` stub in `src/index.ts` with a fully working runtime that:

1. **Validates config at call time** — hard errors for missing `db` client and unrecognized `identityModel`; soft console warns for missing `posthogKey` and missing `sentryDsn`; does not throw for soft errors
2. **Is idempotent** — second call with identical config returns the existing instance with a console warning; second call with a different config throws a hard error
3. **Detects execution context** — internal utility determines `client`, `server`, or `edge` at runtime using `typeof window` and `typeof EdgeRuntime`; edge context logs a console warning and all method calls become no-ops
4. **Manages in-memory identity state** — internal state tracks `userId`, `identityModel`, `deviceId`, `pinUserId`, and `activeRole` for the hybrid model; state is mutated by `identify()` calls only
5. **Implements `identify()`** — updates in-memory identity state; resolves hybrid role switching (device vs worker roles); does NOT write to Postgres; does NOT call PostHog yet (that's a provider milestone)
6. **Implements `track()`** — reads current identity state; determines context; does NOT call any provider yet; logs a dev warning if `userId` is null due to no prior `identify()` call; method returns void
7. **Implements `error()`** — same routing skeleton as `track()` but uses the reserved event name `"error"`; does NOT call any provider yet; method returns void
8. **Returns a typed `DotellInstance`** — the return value matches the `DotellInstance` type defined in `src/types.ts`; no module-level singleton mutation

All provider dispatch (PostHog, Sentry, Postgres) is deferred to later milestones. The methods exist, accept correct arguments, run the identity/context resolution logic, and are ready to receive provider calls inserted later.

---

### 3. Why This Comes Next

Milestone 1 delivered types and a non-functional stub. Before any provider can be wired in, the runtime host must exist: config validation, idempotency guard, context detection, and the identity state machine must all be stable. Provider milestones (3, 4, 5) will insert dispatch calls into the method bodies built here. Building providers without this foundation would require rewriting call sites.

---

### 4. Files to Create

| Path | Purpose | Description |
|------|---------|-------------|
| `src/config.ts` | Config validation | `validateConfig(config: DotellConfig): void` — runs hard-error checks (throws) and soft-warning checks (console.warn); exported for testability |
| `src/context.ts` | Execution context detection | Exports `detectContext(): 'client' \| 'server' \| 'edge'` using `typeof window` and `typeof EdgeRuntime` checks; pure function, no side effects |
| `src/identity.ts` | In-memory identity state machine | Exports `IdentityState` interface and `createIdentityState()` factory; handles `setIdentity()` for all three models including hybrid role resolution; does not import any provider |
| `src/instance.ts` | `DotellInstance` factory | Exports `createInstance(config, identityState)` — builds and returns the `track`, `identify`, `error` method object; wires context detection and identity reads into each method |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `src/index.ts` | Replace the `initDotell()` stub with real implementation — import and call `validateConfig`, manage the module-level idempotency guard (one stored instance ref and config snapshot), call `createIdentityState()` and `createInstance()`, return the typed instance | Milestone 1 stub must be replaced; `index.ts` is the public entry point and the only place the idempotency guard and singleton ref live |
| `src/types.ts` | Add `IdentityRole` values `'device'` and `'worker'` if not already present; confirm `IdentifyOptions` includes `role?: IdentityRole` and `parentId?: string`; add `InternalIdentityState` interface if needed for `createIdentityState()` return type — only additive changes, no removals | Runtime implementation may need tighter types than the Milestone 1 stubs; must not break any existing exported type names |

---

### 6. Files to Leave Untouched

- `migrations/001_create_events.sql` — schema is complete from Milestone 1
- `tsconfig.json` — build config is correct, no changes needed
- `tsup.config.ts` — bundler config is correct, no changes needed
- `package.json` — dependencies are correct, no new runtime deps in this milestone
- `.gitignore` — no changes
- `README.md` — no changes until public API is complete

---

### 7. Layer Rules Reminder

1. **Context detection is internal** — `detectContext()` is called inside `track()`, `identify()`, and `error()` at runtime. Callers never specify context. No `context` parameter on any public method.
2. **Providers are not called in this milestone** — `src/instance.ts` builds method bodies that run identity resolution and context detection but contain no PostHog, Sentry, or Postgres calls. Leave clearly marked `// TODO: provider dispatch — Milestone 3` comments where those calls will go.
3. **`identify()` does not write to Postgres** — it updates in-memory state only. It will call PostHog traits in a later milestone. For now: state update only, no I/O.

---

### 8. Engineering Rules

**DO:**
- Throw at `initDotell()` call time for hard errors: missing `db`, unrecognized `identityModel`
- `console.warn` at `initDotell()` call time for soft errors: missing `posthogKey`, missing `sentryDsn`
- Return void from `track()`, `identify()`, `error()` — never async at call site
- Use fire-and-forget pattern for any future async work (placeholder pattern now)
- Emit `console.warn` in dev only when `track()` is called before `identify()` and `userId` is null (`process.env.NODE_ENV === 'development'`)
- Emit `console.warn` in dev only when edge runtime is detected and methods are no-ops
- Make `initDotell()` idempotent: same config → existing instance + console.warn; different config → throw
- Keep all exported types named — no anonymous inlined types at any public boundary
- Export `IdentityState` or its interface from `src/identity.ts` for use in `src/instance.ts` and `src/index.ts`

**DON'T:**
- Don't import `posthog-js`, `@sentry/nextjs`, or any db client in this milestone
- Don't call `await` at the call site of `track()` or `error()` — even for placeholder async logic
- Don't add a `resetIdentity()` method — teardown is a re-identify with device role
- Don't add a `context` parameter to any public method
- Don't store the singleton at module level in any file other than `src/index.ts`
- Don't gate or block events when `userId` is null — emit with null, warn in dev
- Don't modify the events table schema or migration file
- Don't add new npm dependencies

---

### 9. Ambiguity Protocol

If any of the following are unclear, stop and record the question before writing code — do not guess:

- Whether `DotellConfig` requires `identityModel` to be a required field or optional with a default
- Whether the idempotency check compares configs by reference or by value (deep equality)
- Whether `InternalIdentityState` should be exported from `src/types.ts` or kept internal to `src/identity.ts`

If none of the above apply and a safe assumption exists based on the domain model and engineering rules already specified, record the assumption in Section 11 and proceed.

---

### 10. What Is NOT in This Milestone

- PostHog `posthog.capture()` calls — Milestone 3
- PostHog `posthog.identify()` trait calls — Milestone 3
- Sentry `Sentry.captureException()` calls — Milestone 4
- Postgres `db.events.create()` calls — Milestone 5
- `DotellProvider` React component — later milestone
- Anonymous UUID localStorage read/write/generate — later milestone (will be inserted into `track()` dispatch path)
- Any unit tests or test harness setup
- Any changes to `README.md`
- Any new npm dependencies
- CJS output or dual-format build config

---

### 11. Assumptions Made

- `DotellConfig.model` is the canonical field name (not `identityModel` as referenced in some milestone prose); it is required with no default.
- Idempotency compares configs by value for `model`, `posthogKey`, and `sentryDsn`, and by reference for `db`.
- `IdentityState` lives in `src/identity.ts` only — not exported from `src/types.ts` or the public barrel; it is an internal runtime type.
- Hybrid model requires `options.role` of `'device'` or `'worker'` on `identify()` calls; calls without a recognized role are no-ops for hybrid state.
- Edge runtime warnings fire at method-call time (not at init), per milestone Section 8.
- `RuntimeContext` includes `'edge'` as an internal type in `context.ts`; public `EventContext` remains `'client' | 'server'` only.

---

### 12. Open Questions

- None. All ambiguity-protocol items were resolved from existing domain model and type contracts.