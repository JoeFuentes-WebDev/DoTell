# REVIEW_01.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 1 of the dotell package. Cursor has completed the milestone and is self-auditing its work before you read it. You are looking for: correct file structure for an ESM-only npm package, all public types named and exported, no runtime throws, and no layer violations (providers not mixed across contexts). A passing review means the package scaffolding, TypeScript types, and public API surface match the architecture decisions locked in during planning — nothing more, nothing less.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- Title: Project Scaffold and Public Type Definitions
- Number: 1

---

### 2. Files Created
| File | Description |
|------|-------------|
| `package.json` | ESM-only package metadata, exports map, build scripts, direct deps on `posthog-js` and `@sentry/nextjs`, version `0.1.0` |
| `tsconfig.json` | Strict TypeScript config targeting ESM with `noEmit` (tsup handles emit) |
| `tsup.config.ts` | Single-entry ESM bundler config with `dts: true` and `sourcemap: true` |
| `src/types.ts` | All named public types: `IdentityModel`, `EventContext`, `IdentityRole`, `TrackProperties`, `IdentifyOptions`, `EventRow`, `EventInsert`, `DbClient`, `DotellConfig`, `DotellInstance` |
| `src/index.ts` | Barrel re-export of all public types plus stub `initDotell()` |
| `migrations/001_create_events.sql` | `CREATE TABLE events` with three recommended indexes |
| `.gitignore` | Ignores `dist/` and `node_modules/` |
| `README.md` | Placeholder with package name, one-line description, and "documentation coming soon" |

---

### 3. Files Modified
| File | What Changed | Why |
|------|--------------|-----|
| _(none)_ | Greenfield milestone — no pre-existing scaffold files were modified | N/A |

**Note:** The pre-existing placeholder `package.json` (v0.0.1, self-referential dep) and root `index.js` were replaced/removed as part of creating the proper scaffold.

---

### 4. Assumptions Made
- `EventRow` uses snake_case field names to mirror the Postgres schema columns exactly.
- `created_at` accepts `Date | string` to stay ORM-agnostic at the type level.
- Milestone naming (`IdentifyOptions`, `options` param) takes precedence over ONBOARDING naming (`IdentifyTraits`, `traits` param) for this milestone's public API.
- Migration path is `migrations/001_create_events.sql` per milestone spec, not `src/migration.sql` referenced in ONBOARDING.
- `typescript` and `tsup` added as devDependencies to support the build pipeline (implicit requirement, not listed in milestone file table).

---

### 5. Open Questions
- None. Version constraints for `posthog-js` and `@sentry/nextjs` were explicitly specified in the milestone — no ambiguity protocol trigger.

---

### 6. Risks
- **ONBOARDING vs milestone naming drift:** ONBOARDING references `IdentifyTraits` and `src/migration.sql`; this milestone uses `IdentifyOptions` and `migrations/001_create_events.sql`. A future milestone should reconcile ONBOARDING if the milestone naming is canonical.
- **Stub throws on call:** `initDotell()` throws `'Not implemented'` if invoked — expected for this milestone but will break any early integration attempt until Milestone 2+ implements it.
- **Bundled SDK weight:** `posthog-js` and `@sentry/nextjs` are listed as direct dependencies now but unused until provider milestones — install footprint is larger than the stub package's runtime surface.
- **Transitive dependency vulnerabilities:** `npm audit` reports 26 vulnerabilities from `@sentry/nextjs` transitive deps; not introduced by dotell code but present in the dependency tree.

---

### 7. Layer Violations
> Any place where client-only providers (PostHog, Sentry) were invoked in a server context, or server-only logic (Postgres writes) was placed in a client context. Should be none.

- None. No provider logic, context detection, or identity code exists in this milestone — types and stub only.

---

### 8. Engineering Rule Violations
> Any rule from the engineering_rules domain that was bent or broken. Should be none.

- None for this milestone's scope. Deliberate exceptions that are milestone-specified, not violations:
  - `initDotell()` throws `'Not implemented'` — required stub behavior per Milestone 1 Section 7; will be replaced in a later milestone.
  - No `track()`, `identify()`, or `error()` runtime methods yet — `DotellInstance` interface defines signatures only; stub does not return an instance.

---

### 9. Ready to Proceed
- **Decision:** yes
- **Reasoning:** All milestone-specified files are created. `npm run build` completes successfully, emitting ESM `dist/index.js`, `dist/index.d.ts`, and source maps. All public types are named, exported from `src/types.ts`, and re-exported from `src/index.ts`. Package is ESM-only (`"type": "module"`, `format: ['esm']`, no CJS). No unauthorized subdirectories, no default exports, no peer dependencies, no runtime logic beyond the specified stub. Migration SQL matches the domain model schema. Ready for implementation milestones.
