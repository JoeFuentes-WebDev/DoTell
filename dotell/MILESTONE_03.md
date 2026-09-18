# MILESTONE_03.md

## SECTION 1 — HUMAN SUMMARY

Milestone 3 wires in the PostHog provider on the client side. It builds the PostHog dispatch module, connects `track()` and `identify()` to it inside the existing `instance.ts` method stubs, and guards all calls behind context detection so PostHog never runs on the server. This milestone is the first real I/O — no Sentry, no Postgres yet. Medium complexity: new provider file, two method bodies updated, no schema changes.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Milestone 3 — PostHog Provider: Client-Side track() and identify() Dispatch**

---

### 2. What This Milestone Builds

A single PostHog provider module (`src/providers/posthog.ts`) that initializes the PostHog browser SDK and exposes two dispatch functions: `dispatchPostHogTrack()` and `dispatchPostHogIdentify()`. The `track()` and `identify()` method bodies in `src/instance.ts` are updated to call these dispatch functions when the execution context is `'client'` and a PostHog key was provided at init. The `error()` method body is **not** updated in this milestone.

PostHog is initialized lazily — on first dispatch call, not at `initDotell()` time — so server-side init paths never touch the PostHog SDK.

---

### 3. Why This Milestone Comes Next

Milestone 2 established the runtime host: config validation, identity state machine, and method stubs returning void. The method bodies contain TODO markers explicitly waiting for provider dispatch. PostHog is the first provider to wire in because it is client-side only, has no Postgres dependency, and has no cross-provider coordination requirement. It is the simplest isolated path to real I/O.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/providers/posthog.ts` | PostHog provider module — lazy init, `dispatchPostHogTrack()`, `dispatchPostHogIdentify()`, internal guard for missing key or non-client context |

---

### 5. Files to Modify

| Path | What Changes and Why |
|------|----------------------|
| `src/instance.ts` | Replace TODO markers in `track()` and `identify()` with calls to `dispatchPostHogTrack()` and `dispatchPostHogIdentify()` — guarded by `context === 'client'` and `posthogKey` presence. `error()` TODO remains untouched. |

---

### 6. Files to Leave Untouched

- `src/index.ts` — entry point and init logic are complete; no changes needed
- `src/config.ts` — validation is complete; no new PostHog-specific validation needed here
- `src/context.ts` — context detection is complete and correct
- `src/identity.ts` — identity state machine is complete
- `src/types.ts` — all required public types are already present
- `migrations/` — no schema changes in this milestone
- `package.json`, `tsconfig.json`, `tsup.config.ts` — build config unchanged
- Any test files present — do not modify existing tests

---

### 7. Layer Rules Reminder

1. **PostHog must never be called outside a `'client'` context.** `dispatchPostHogTrack()` and `dispatchPostHogIdentify()` must check `detectContext() === 'client'` internally and return immediately if not. The call site in `instance.ts` also guards on context — defense in depth.
2. **Lazy init only.** PostHog SDK initialization (`posthog.init()`) must not occur at module load time or at `initDotell()` call time. It must occur inside the dispatch functions, on first call, after confirming client context. This prevents server-side module evaluation from triggering PostHog SDK code.
3. **Provider failures must be caught and not rethrow.** All PostHog calls must be wrapped in try/catch. On failure: `console.warn` in dev (check `process.env.NODE_ENV === 'development'`), silent swallow in production. The `track()` and `identify()` methods must never throw as a result of a PostHog failure.

---

### 8. Engineering Rules

**DO:**
- Return `void` from `dispatchPostHogTrack()` and `dispatchPostHogIdentify()` — non-async at call site
- Use `posthog.capture()` for track dispatch and `posthog.identify()` for identify dispatch
- Pass `getResolvedUserId()` result from the identity state into `posthog.identify()` as the distinct ID
- Pass the full `properties` object from `track()` arguments through to `posthog.capture()` unchanged
- Guard the PostHog init with a module-level `let initialized = false` flag inside `src/providers/posthog.ts` — init once, dispatch many
- Log `console.warn('dotell: PostHog key not provided, skipping PostHog.')` in dev when `posthogKey` is absent (matches existing soft-warning pattern from config validation)
- Pass `identityModel` as a PostHog trait/property so events carry model context

**DON'T:**
- Don't call `posthog.init()` in `src/index.ts` or `src/instance.ts` — init belongs inside the provider module
- Don't import PostHog at the top of `src/instance.ts` — provider module is the isolation boundary
- Don't `await` any PostHog call at the call site — fire-and-forget
- Don't pass the raw `IdentityState` object to PostHog — extract only what PostHog needs (userId, traits)
- Don't add new public types to `src/types.ts` in this milestone unless an existing type is genuinely missing
- Don't add PostHog-specific config keys to `DotellConfig` — `posthogKey` already exists
- Don't call `error()` dispatch in this milestone — that TODO stays

---

### 9. Ambiguity Protocol

If any of the following are unclear, **stop and record the question in Open Questions** rather than assuming:

- Whether `posthog.identify()` should be called with a traits object shaped from `IdentifyOptions` or a flat properties map
- Whether the PostHog `init()` call needs any specific Next.js-safe options (e.g., `autocapture: false`, `persistence` setting)
- Whether the module-level `initialized` flag in `src/providers/posthog.ts` should be reset between test calls

Do not invent behavior not specified here. Record the ambiguity and make the safest no-op choice (skip the call, warn in dev).

---

### 10. What Is NOT in This Milestone

- Sentry provider — not started here
- Postgres provider — not started here
- `error()` method dispatch — not wired to PostHog or Sentry yet
- PostHog session recording, feature flags, or group analytics — not in V1 scope
- PostHog `autocapture` configuration — not specified, use SDK defaults unless a safe default is documented
- Anonymous UUID localStorage read/write — deferred; `getResolvedUserId()` returning null is acceptable for this milestone
- Any new public API surface — no new exports, no new config keys
- React context or hooks (`useDotell()`) — deferred to V2
- Tests — not written in this milestone (test milestone is separate)

---

### 11. Assumptions Made

- `posthog.identify()` receives `IdentifyOptions` spread as a flat traits map (`{ ...traits, identityModel }`) — standard PostHog API shape.
- `posthog.init()` uses SDK defaults (single-argument call, no custom `autocapture` or `persistence` options) — milestone defers autocapture config.
- Dynamic `import('posthog-js')` inside the provider keeps server-side bundles from eagerly loading browser SDK code; init runs fire-and-forget async on first client dispatch.
- Module-level `initialized` flag is not reset between calls — acceptable for V1; test isolation deferred to test milestone.
- PostHog dispatch lives in `instance.ts` (per milestone); core identity/context logic remains in `track.ts` / `identify.ts`.

---

### 12. Open Questions

- None. Ambiguities resolved with safest defaults per ambiguity protocol.