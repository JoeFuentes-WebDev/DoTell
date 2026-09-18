# MILESTONE_01.md

## SECTION 1 — HUMAN SUMMARY

This milestone sets up the complete project scaffold for `@joefuentes/dotell`: the npm package structure, TypeScript + tsup configuration, and all public-facing types. No logic is implemented yet — this is strictly the skeleton that every subsequent milestone builds on. Estimated session complexity: low. This must come first because all other milestones depend on the file structure, package metadata, and type contracts being in place.

---

## SECTION 2 — CURSOR DIRECTIVE

### Milestone 1: Project Scaffold and Public Type Definitions

---

### 1. What This Milestone Builds

A complete, buildable npm package scaffold for `@joefuentes/dotell` with:
- `package.json` configured for ESM-only output, tsup build, and public npm publishing
- `tsconfig.json` targeting ESM, strict TypeScript
- `tsup.config.ts` with correct entry point, ESM output, and `.d.ts` generation
- All public-facing TypeScript types defined and exported in a single `src/types.ts` file
- An `src/index.ts` barrel that re-exports everything (stubs only — no implementations)
- A `.gitignore` and `README.md` placeholder

The package must build successfully with `tsup` and emit a valid ESM dist with type declarations. No runtime logic is implemented in this milestone.

---

### 2. Why This Comes Next

This is Milestone 1. Nothing exists yet. The package scaffold and type definitions are the foundation that every other milestone depends on. Types define the contract that implementation milestones must satisfy. The build pipeline must be verified working before any logic is written.

---

### 3. Files to Create

| Path | Purpose |
|------|---------|
| `package.json` | Package metadata, ESM config, exports map, build scripts, dependencies |
| `tsconfig.json` | TypeScript compiler config — strict, ESM, no emit (tsup handles emit) |
| `tsup.config.ts` | tsup bundler config — ESM only, .d.ts declarations, single entry point |
| `src/types.ts` | All named public types — the full public API contract |
| `src/index.ts` | Barrel export — re-exports all public types and stub function signatures |
| `migrations/001_create_events.sql` | The events table CREATE TABLE statement plus recommended indexes |
| `.gitignore` | Ignore `dist/`, `node_modules/` |
| `README.md` | Placeholder — package name, one-line description, "documentation coming soon" |

---

### 4. Files to Modify

None. This is a greenfield milestone.

---

### 5. Files to Leave Untouched

None exist yet. Nothing to protect.

---

### 6. Layer Rules Reminder

1. **All public types must be explicitly named and exported from `src/types.ts`.** No anonymous inlined types at the public API boundary. Every type the consuming app might reference must be importable by name from `@joefuentes/dotell`.

2. **ESM only.** `package.json` must set `"type": "module"`, exports map must point to `.js` files (not `.ts`), and `tsup.config.ts` must specify `format: ['esm']` only. No CJS output in this milestone or any V1 milestone.

3. **`initDotell()` returns a typed instance — no module-level singleton mutation.** Even at stub stage, the return type must be a named exported interface (`DotellInstance`) with `track`, `identify`, and `error` as typed method signatures. The consuming app holds the reference.

---

### 7. Engineering Rules

**DO:**
- Define `DotellConfig` as a named exported interface covering all init-time fields: `model` (union of `'anonymous' | 'authenticated' | 'hybrid'`), `db` (typed as `DbClient`), `posthogKey` (optional string), `sentryDsn` (optional string)
- Define `DbClient` as a minimal structural interface with a single field: `events: { create: (args: { data: EventRow }) => Promise<unknown> }`
- Define `EventRow` as a named exported interface matching the exact Postgres schema columns: `id`, `user_id`, `event`, `properties`, `context`, `identity_model`, `created_at`
- Define `DotellInstance` as a named exported interface with `track`, `identify`, `error` — all returning `void`
- Define `IdentityModel` as a named exported type alias: `'anonymous' | 'authenticated' | 'hybrid'`
- Define `EventContext` as a named exported type alias: `'client' | 'server'`
- Define `IdentityRole` as a named exported type alias: `'device' | 'worker'` (for hybrid model)
- Define `TrackProperties` as a named exported type alias: `Record<string, unknown>`
- Define `IdentifyOptions` as a named exported interface covering optional role and parentId fields for hybrid model
- Export a stub `initDotell(config: DotellConfig): DotellInstance` function from `src/index.ts` — body throws `new Error('Not implemented')` as a temporary placeholder
- Set `"main"` and `"module"` in `package.json` to `"./dist/index.js"`
- Set `"types"` in `package.json` to `"./dist/index.d.ts"`
- Include `"exports"` map in `package.json` pointing `"."` to the dist entry
- Set `"files"` in `package.json` to `["dist", "migrations"]`
- List `posthog-js`, `@sentry/nextjs` as dependencies in `package.json`
- Set `"sideEffects": false` in `package.json`
- Define `EventInsert` as a named exported type alias: `Omit<EventRow, 'id' | 'created_at'>` — this is the insert shape passed to `DbClient.events.create()`
- Update `DbClient.events.create()` to accept `EventInsert` not `EventRow`
- Pin `posthog-js` at `^1.57.0` and `@sentry/nextjs` at `^8.0.0` in `package.json`
- Set `dts: true` and `sourcemap: true` in `tsup.config.ts`

**DON'T:**
- Do not implement any logic inside `initDotell()` beyond the stub — no context detection, no provider initialization, no singleton logic
- Do not define `track()`, `identify()`, or `error()` as standalone exported functions — they are methods on the returned `DotellInstance` only
- Do not add `"peerDependencies"` — Sentry and PostHog are direct bundled dependencies at V1
- Do not set `"type": "commonjs"` or add `"cjs"` to tsup format array
- Do not add React, Next.js, Prisma, or Drizzle as dependencies or peerDependencies — dotell does not import them
- Do not create any `src/` subdirectories beyond what's listed — no `providers/`, `adapters/`, `utils/` folders yet
- Do not export default — named exports only throughout the entire package

---

### 8. Ambiguity Protocol

If any of the following is unclear, **stop and record the question in the Open Questions section below** rather than making an assumption that affects the public API contract:

- The exact version constraints to pin for `posthog-js` and `@sentry/nextjs` in `package.json`

For anything else, apply the most conservative interpretation that does not invent scope.

---

### 9. What Is NOT in This Milestone

- No `initDotell()` implementation — stub only
- No context detection logic (`isClient`, `isServer`, `isEdge`)
- No PostHog initialization or calls
- No Sentry initialization or calls
- No Postgres write logic
- No anonymous UUID / localStorage logic
- No in-memory identity state
- No `DotellProvider` React component
- No `instrumentation.ts` example file
- No test files
- No CI/CD configuration
- No `.npmrc` or publishing workflow
- No `CHANGELOG.md`
- No version bump — package starts at `0.1.0`

---

### 10. Assumptions Made

- `EventRow` column names use snake_case to match the Postgres schema exactly (`user_id`, `identity_model`, `created_at`).
- `created_at` is typed as `Date | string` to accommodate both ORM return shapes and insert-time omission.
- `properties` is typed as `Record<string, unknown> | null` to reflect the nullable JSONB column.
- `IdentifyOptions` is used instead of ONBOARDING's `IdentifyTraits` name, per this milestone's explicit type naming.
- `identify()` second parameter is named `options` (not `traits`) to match `IdentifyOptions`.
- Migration file lives at `migrations/001_create_events.sql` (not `src/migration.sql` as referenced in ONBOARDING) per this milestone's file list.
- Removed the pre-existing placeholder root `index.js` since the package entry point is `./dist/index.js`.
- `typescript` and `tsup` are devDependencies; they are required to build but are not listed explicitly in the milestone file table.

---

### 11. Open Questions

- None. Version pins for `posthog-js` (`^1.57.0`) and `@sentry/nextjs` (`^8.0.0`) were specified explicitly in Section 7 — ambiguity protocol was not triggered.