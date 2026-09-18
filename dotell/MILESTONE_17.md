# MILESTONE_17.md

## SECTION 1 — HUMAN SUMMARY

This milestone produces the README.md for the published `@joefuentes/dotell` package. It is the final V1 deliverable before npm publish. The README covers installation, setup patterns for both server and client contexts, all three identity models, the DbClient interface contract, migration instructions, environment variables, and the PII responsibility notice. Complexity is low — documentation only, no source changes.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Title:** README — Public Package Documentation
**Number:** 17

---

### 2. What This Milestone Builds

A single `README.md` at the project root. This is the documentation that ships with the published npm package and is displayed on the npmjs.com package page.

The README must cover, in order:

1. **Package name and one-line description** — `@joefuentes/dotell` — unified observability baseline for Next.js apps
2. **What it does** — wraps Sentry, PostHog, and a Postgres events table behind `initDotell()` + three methods
3. **Installation** — `npm install @joefuentes/dotell`
4. **Environment variables** — list every required and optional env var, distinguish build-time vs runtime, note consuming app is responsible for pre-deploy validation
5. **Database migration** — how to find and run the shipped `.sql` file; state explicitly that dotell never auto-migrates
6. **Server-side setup** — `instrumentation.ts` example using `initDotell()` with the server context
7. **Client-side setup** — `DotellProvider` client component example in `layout.tsx`; note that PostHog and Sentry initialize in client context only
8. **Shared instance pattern** — `lib/dotell.ts` export pattern; one instance imported everywhere
9. **Identity models** — three subsections:
   - **Anonymous** — UUID auto-managed in localStorage; consuming app calls `track()` only; no `identify()` needed
   - **Authenticated** — call `identify(userId, { role: 'authenticated' })` after auth; `track()` and `error()` carry that identity
   - **Hybrid (PIN/kiosk)** — `identify(deviceId, { role: 'device' })` at session start; `identify(pinUserId, { role: 'worker', parentId: deviceId })` on PIN entry; re-identify with device role to restore baseline; consuming app owns PIN validation logic
10. **Method reference** — brief table or section covering `track()`, `identify()`, `error()` signatures and return types (all `void`)
11. **DbClient interface** — show the minimal structural interface dotell requires; confirm Prisma and Drizzle both satisfy it without adapters
12. **Provider degradation** — explain silent skip behavior for unconfigured providers; mention dev console warnings
13. **Edge Runtime** — state explicitly: not supported in V1; providers are skipped with a console warning
14. **PII notice** — consuming app is responsible for what it passes in `properties`; dotell does not sanitize
15. **Pages Router** — state explicitly: not supported; App Router only

---

### 3. Why This Comes Next

All source modules, type exports, the migration SQL file, and the integration test suite are complete (Milestones 1–16). The README is the only remaining V1 deliverable before `npm publish`. No code depends on it, but the published package without a README is unusable by any consuming app.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `README.md` | Public package documentation — installation, setup, identity models, method reference, DbClient interface, migration, env vars, PII notice, unsupported features |

---

### 5. Files to Modify

None.

---

### 6. Files to Leave Untouched

Every file not listed above. Explicit list of files that must not change:

- `src/index.ts`
- `src/init.ts`
- `src/context.ts`
- `src/identity.ts`
- `src/types.ts`
- `src/providers/posthog.ts`
- `src/providers/sentry.ts`
- `src/providers/postgres.ts`
- `src/__tests__/integration.test.ts`
- `vitest.config.ts`
- `package.json`
- `tsconfig.json`
- `tsup.config.ts`
- `migrations/create_events_table.sql` (or equivalent migration file path)

---

### 7. Layer Rules Reminder

1. **Documentation reflects architecture, not aspirations.** Every statement in the README must match what the source code actually does. Do not document behavior that has not been implemented.
2. **Public API boundary is fixed.** The method signatures, return types (`void`), and config shape shown in the README must match the exported types in `src/types.ts` and `src/index.ts` exactly.
3. **Unsupported features are stated as hard exclusions, not deferrals to the reader.** Edge Runtime and Pages Router sections must say "not supported in V1" — not "check back later" or "may work."

---

### 8. Engineering Rules

**DO:**
- Show real, copy-pasteable code examples that match the actual public API
- Distinguish build-time env vars (`NEXT_PUBLIC_POSTHOG_KEY`) from runtime env vars (`SENTRY_DSN`, `DATABASE_URL` or equivalent)
- Show the DbClient minimal interface shape explicitly so consuming apps know what dotell requires from their ORM client
- Include the exact `lib/dotell.ts` singleton pattern as the recommended integration approach
- State the PII responsibility notice clearly — one dedicated paragraph, not buried in a footnote
- Document `track()` called before `identify()` behavior: event emits with `null` userId; dev console warning fires; no throw
- Show hybrid identity teardown: re-identify with device role; no `resetIdentity()` method exists

**DO NOT:**
- Document features that are out of scope for V1 (batching, retry logic, React hooks, server-side `identify()`, PII sanitization hooks, `dotell check` CLI)
- Show CJS `require()` import syntax — ESM only
- Imply that dotell validates or sanitizes PII
- Document `resetIdentity()` — it does not exist
- Document a `dotell check` CLI command — it does not exist
- Use vague language like "should work" or "may support" for unsupported features
- Show Pages Router integration patterns

---

### 9. Ambiguity Protocol

If the exact path to the shipped migration SQL file is not clear from the existing codebase (e.g., `migrations/create_events_table.sql` vs another path), stop and record it in Open Questions. Do not invent a path — check the project file tree first.

If any public method signature in `src/types.ts` or `src/index.ts` differs from what the milestone spec describes, stop and record it in Open Questions. Document what the source actually exports, not what this spec assumes.

---

### 10. What Is NOT in This Milestone

- No source code changes of any kind
- No new type exports
- No changes to the migration SQL file
- No CHANGELOG.md
- No CONTRIBUTING.md
- No `.npmignore` or `package.json` changes
- No npm publish step
- No CLI documentation
- No versioning decisions
- No Pages Router documentation
- No Edge Runtime workaround documentation

---

### 11. Assumptions Made

- **M13 README existed** as baseline content; M17 work was a restructure to match M17's 15-section order and wording, not a greenfield write.
- **`migrations/001_create_events.sql`** is the canonical migration path (per ONBOARDING.md); duplicate `create_events_table.sql` ships but is not referenced in README.
- **M17 spec's authenticated example using `{ role: 'authenticated' }` was not used** — `IdentityRole` in source is `'device' | 'worker'` only; README documents `identify(userId, traits?)` without an authenticated role.
- **M13-only sections removed** (semver, license, standalone context-routing table) because M17 lists exactly 15 sections and does not require them.

---

### 12. Open Questions

- Should duplicate migration file `create_events_table.sql` be removed before publish?
- M17 spec file was provided from `~/Downloads/` — confirm it should live in the repo alongside other milestone files.