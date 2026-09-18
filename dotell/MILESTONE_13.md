# MILESTONE_13.md

## SECTION 1 — HUMAN SUMMARY

Milestone 13 writes the README.md for the dotell package. This is the final V1 deliverable — all architectural decisions are locked, all code is built and type-checked, and the package needs its install-once documentation before it can be published. The README covers installation, configuration, the three identity models, the three methods, the migration SQL, environment variables, and the PII responsibility disclaimer. Estimated complexity: low-to-medium (writing only, no code changes).

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 13 — README.md**

---

### 2. What This Milestone Builds

A single `README.md` at the package root that documents the complete V1 public API and integration pattern for `@joefuentes/dotell`.

The README must cover, in order:

1. **What dotell is** — one paragraph, plain language
2. **Installation** — `npm install @joefuentes/dotell`
3. **Quick start** — minimal working example showing `initDotell()` + `track()` + `identify()`
4. **Environment variables** — table with name, timing (build-time vs runtime), and whether required or optional
5. **initDotell() config reference** — all config keys, their types, whether required or optional, and what happens if omitted (hard error vs silent skip)
6. **Identity models** — separate subsections for `anonymous`, `authenticated`, and `hybrid`; each explains what it is, when to use it, and a code example
7. **The three methods** — `track()`, `identify()`, `error()` — signature, behavior, and one example each
8. **Integration pattern** — how to wire `instrumentation.ts` (server) and a `DotellProvider` client component (client), plus the `lib/dotell.ts` singleton pattern
9. **Migration SQL** — instruction to locate the `.sql` file in the package, copy it, and run it manually; include the exact `CREATE TABLE` and `CREATE INDEX` statements inline so the developer does not need to open the file
10. **Context routing** — table showing which providers fire in each context (client / server / edge)
11. **PII disclaimer** — explicit statement that dotell does not sanitize properties and the consuming app is responsible
12. **What is not supported in V1** — bulleted list of explicit exclusions (Pages Router, Edge Runtime, retry logic, event batching, React hooks, server-side identify, PII sanitization hooks)
13. **Semver policy** — one paragraph on what triggers a major/minor/patch bump

---

### 3. Why This Comes Next

All code milestones (M1–M12) are complete and passing. The package builds, type-checks, and has no open blocking questions. README is the only remaining V1 deliverable before the package can be published to npm. It cannot be written before the API surface is final, and the API surface is now final.

---

### 4. Files to Create

| File | Purpose | Description |
|------|---------|-------------|
| `README.md` | Package root documentation | Complete V1 developer guide for `@joefuentes/dotell` |

---

### 5. Files to Modify

None.

---

### 6. Files to Leave Untouched

Every file in the repository except `README.md`. This includes but is not limited to:

- `src/` — all source files
- `src/globals.d.ts`
- `tsconfig.json`
- `package.json`
- `tsup.config.ts`
- `migrations/` — any SQL migration file
- `dist/` — compiled output
- `.gitignore`

---

### 7. Layer Rules Reminder

1. **Public API surface is locked.** The README documents what exists. It must not invent new method signatures, new config keys, or new behaviors that are not already implemented.
2. **Context detection is internal.** The README must never tell the caller to specify client vs server context. It shows how to call the methods; dotell handles routing.
3. **Fire-and-forget is a design decision.** The README must not suggest the caller awaits any method. `track()`, `identify()`, and `error()` return `void`.

---

### 8. Engineering Rules

**Do:**
- Use the exact method signatures and config key names already in the codebase
- Show `lib/dotell.ts` singleton pattern exactly as specified in the architecture domain
- Show `instrumentation.ts` as the server-side init point
- Show a `DotellProvider` client component as the client-side init point
- Document that `NEXT_PUBLIC_POSTHOG_KEY` is build-time and `SENTRY_DSN` / db connection are runtime
- Include the full `CREATE TABLE events` and `CREATE INDEX` SQL inline in the migration section
- State the PII disclaimer clearly — no hedging
- List Pages Router as rejected (not deferred), Edge Runtime as deferred to V2
- Use `@joefuentes/dotell` as the package name throughout

**Do not:**
- Document any method that returns a Promise or accepts an async callback
- Suggest the consuming app can configure per-call routing to specific providers
- Reference `transpilePackages` as a required config (pre-bundled dist; not needed)
- Describe a `resetIdentity()` method (does not exist)
- Reference any V2 feature as if it exists now
- Add any placeholder sections with "coming soon" phrasing — V2 items belong only in the exclusions list
- Reference `TrackProperties` or `EventProperties` inconsistently — use whichever name is in the actual exported types (check `src/` before writing)
- Invent config keys not present in `initDotell()`

---

### 9. Ambiguity Protocol

If the exact name of any exported type or config key is unclear from context (e.g., `TrackProperties` vs `EventProperties`), **stop, read the relevant `src/` file, and use the name that is actually exported**. Do not guess. If a method signature in `src/` differs from what the architecture documents describe, **record the discrepancy in Open Questions** and use the implemented signature.

---

### 10. What Is NOT in This Milestone

- No code changes of any kind
- No new source files
- No changes to `package.json`, `tsconfig.json`, or `tsup.config.ts`
- No CHANGELOG.md
- No CONTRIBUTING.md
- No API reference auto-generation tooling
- No badges, shields, or CI status indicators
- No changes to the migration SQL file (document it inline but do not edit it)

---

### 11. Assumptions Made

- Exported type name is **`TrackProperties`** (not `EventProperties`) — used consistently throughout README.
- **`error()` on server** routes to Postgres only (Sentry client-only) — matches `src/error/error.ts` implementation, not older README wording.
- **Edge Runtime** listed as deferred to V2 per milestone Section 8 (ONBOARDING says unsupported in V1; both are documented in exclusions).
- **Two migration files** (`001_create_events.sql` and `create_events_table.sql`) are equivalent — README references both paths.
- **Semver policy** written as standard npm library semver — milestone did not specify exact bump rules beyond one paragraph.

---

### 12. Open Questions

- None. Method signatures and config keys verified against `src/types.ts` and `src/config.ts`.