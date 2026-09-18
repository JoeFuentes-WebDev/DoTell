# MILESTONE_11.md

## SECTION 1 — HUMAN SUMMARY

This milestone builds the public API surface: the `index.ts` barrel export that is the single entry point consumers import from `@joefuentes/dotell`. All three methods, the init function, and every named public type must be explicitly exported from one file. This comes next because all implementation modules are complete and the package cannot be published without a clean public entry point. Estimated complexity: low. No logic, no new files beyond the barrel, only wiring.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Title:** Public API Barrel Export
**Number:** 11

---

### 2. What This Milestone Builds

A single `src/index.ts` file that is the public entry point for the `@joefuentes/dotell` package. It must:

- Export `initDotell` (the factory function consumers call)
- Export the `DotellInstance` type (the typed return value of `initDotell`)
- Export the `DotellConfig` type (the config shape passed to `initDotell`)
- Export the `DbClient` interface (the structural interface for injected db clients)
- Export the `EventProperties` type (if it is a named public type used in `track()` or `error()`)
- Export the `IdentityModel` type (the `'anonymous' | 'authenticated' | 'hybrid'` union)
- Export any other named types that appear on the public method signatures

Do NOT export internal implementation types, provider-level symbols, or anything only used inside the package.

---

### 3. Why This Comes Next

All three method implementations (`track`, `identify`, `error`) are complete. `initDotell` exists and returns a typed instance. The package has no public entry point yet — `src/index.ts` either does not exist or is incomplete. This is the last structural step before the build pipeline (`tsup`) can produce a valid publishable dist. No new logic is introduced here.

---

### 4. Files to Create

| File | Purpose | Description |
|------|---------|-------------|
| `src/index.ts` | Public package entry point | Barrel that re-exports `initDotell`, `DotellInstance`, `DotellConfig`, `DbClient`, and all other named public types from their respective internal modules |

---

### 5. Files to Modify

| File | What changes | Why |
|------|-------------|-----|
| `package.json` | Confirm `"main"`, `"module"`, `"exports"`, and `"types"` fields point to the correct `dist/` output paths | `src/index.ts` becomes the tsup entry; `package.json` must reflect the compiled output location for npm consumers |
| `tsup.config.ts` (or `tsup.config.js`) | Confirm `entry` points to `src/index.ts` | Ensures the bundler uses the new barrel as the single entry point |

If either `package.json` or `tsup.config.ts` already correctly references `src/index.ts`, make no change to that file.

---

### 6. Files to Leave Untouched

- `src/instance.ts`
- `src/init.ts`
- `src/track/track.ts`
- `src/track/index.ts`
- `src/identify/identify.ts`
- `src/identify/index.ts`
- `src/error/error.ts`
- `src/error/index.ts`
- `src/providers/sentry.ts`
- `src/providers/posthog.ts`
- `src/providers/postgres.ts`
- `src/providers/index.ts`
- `src/context.js` (or equivalent context detection utility)
- `src/types.ts` (or wherever shared types live — read only, do not restructure)
- `migrations/` directory
- `README.md`
- `tsconfig.json`

---

### 7. Layer Rules Reminder

1. **Public API surface is additive, never leaking.** `src/index.ts` re-exports only what a consuming app needs. Internal types, provider symbols, and implementation details must not appear in the public barrel.
2. **No logic in the barrel.** `src/index.ts` contains only `export` statements. No functions, no conditionals, no side effects.
3. **All public types must be named and explicitly exported.** No anonymous inlined types at the boundary. If a type is on a public method signature, it must be in `src/index.ts`.

---

### 8. Engineering Rules

**Do:**
- Export only types that appear on the public method signatures or `initDotell`'s return/parameter surface
- Use named re-exports (`export { X } from './path'`), not wildcard re-exports (`export * from './path'`)
- Verify every exported name compiles cleanly by running `tsc --noEmit` after writing the barrel
- Keep the exports alphabetically ordered or grouped by category (types vs functions) — pick one and stay consistent

**Don't:**
- Do not create a new types file — use whatever type definitions already exist in the codebase
- Do not rename any existing types to fit the barrel — import them as-is
- Do not add `export default` — named exports only per the project convention
- Do not modify any implementation file to make it easier to export — if a type is unexported internally, add the `export` keyword to its declaration in place, do not move it
- Do not introduce any runtime code into `src/index.ts`

---

### 9. Ambiguity Protocol

If any of the following is true, stop and record it in Open Questions rather than guessing:

- A type that should be public does not exist as a named export anywhere in the codebase
- `DotellInstance` or `DotellConfig` is inlined anonymously and cannot be re-exported without restructuring
- `package.json` has conflicting `exports` field entries that would require understanding of the consuming app's module resolution to resolve safely
- `tsup.config.ts` does not exist and there is no bundler config file at the project root

Do not invent types. Do not restructure files. Surface the gap.

---

### 10. What Is NOT in This Milestone

- No changes to any implementation module
- No new types, interfaces, or type aliases
- No changes to the migration SQL file
- No README updates
- No test files
- No version bump to `package.json`
- No publishing step (`npm publish`)
- No tsup build execution — only config verification
- No changes to provider files
- No changes to `tsconfig.json`

---

### 11. Assumptions Made

- `src/index.ts` already existed from Milestone 1 with complete exports; this milestone verified compliance with M11 spec (no substantive changes required).
- Milestone references `EventProperties`; codebase uses `TrackProperties` on `track()`/`error()` signatures — exported as-is, no rename.
- `package.json` and `tsup.config.ts` already correctly point to `src/index.ts` / `dist/` — no changes required.
- `IdentifyOptions`, `IdentityRole`, `EventInsert`, `EventRow`, and `EventContext` exported because they appear on public config/method surfaces or `DbClient` contract.

---

### 12. Open Questions

- **`tsc --noEmit` fails** on `EdgeRuntime` in `context.ts` (TS2304) — `tsconfig.json` lacks Edge global; `tsup` build succeeds. Out of scope for M11 (no tsconfig changes). Fix in a future milestone?
- **`EventProperties` vs `TrackProperties`:** Milestone prose uses `EventProperties`; implementation uses `TrackProperties`. Confirm canonical public name for docs.