# MILESTONE_06.md

## SECTION 1 — HUMAN SUMMARY

This milestone adds the SQL migration file and the public README to the dotell package. The migration file is the only deliverable dotell ships for database setup — a plain `.sql` file with the `CREATE TABLE events` statement and recommended indexes. The README documents the public API, integration pattern, required environment variables, identity models, and PII responsibility. No code changes. Estimated session complexity: low.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
- **Title:** Migration File and README
- **Number:** 6

---

### 2. What This Milestone Builds

Two documentation/asset deliverables only:

**A. `migrations/create_events_table.sql`**
A plain SQL file containing:
- `CREATE TABLE events (...)` with all columns exactly as specified in domain_model
- Three recommended index definitions on `user_id`, `event`, and `created_at`
- No `DROP TABLE`, no `IF NOT EXISTS`, no transaction wrapping — developer applies manually

**B. `README.md`**
A developer-facing README covering:
- What dotell is and what it does
- Install (`npm install @joefuentes/dotell`)
- Database migration (reference to `migrations/create_events_table.sql`, manual apply)
- Required environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`, db connection)
- Integration pattern: `lib/dotell.ts` singleton, `instrumentation.ts` server init, `DotellProvider` client component in `layout.tsx`
- All three public methods: `track()`, `identify()`, `error()` — signatures and usage examples
- All three identity models: anonymous, authenticated, hybrid — how each works, what identify() receives per model
- Provider behavior: what happens per context (client vs server) for each method
- Error handling guarantees: never throws, fire-and-forget Postgres, provider failures swallowed in prod
- PII responsibility: consuming app owns sanitization — dotell does not strip PII
- Edge Runtime: explicitly unsupported in V1, providers skipped with console warn
- Pages Router: explicitly unsupported, App Router only
- V1 scope boundary note: what is deferred (batching, retry, React hooks, server-side identify)

---

### 3. Why This Comes Next

Milestone 5 completed all provider extraction. The core package behavior is fully implemented. Before any integration testing or npm publishing, the consuming developer needs two things: the SQL to apply to their database and the documentation to wire up the package. This milestone produces both. No code changes are required — this is a pure asset/documentation milestone that unblocks integration.

---

### 4. Files to Create

| Path | Purpose | Description |
|------|---------|-------------|
| `migrations/create_events_table.sql` | Database migration asset | `CREATE TABLE events` + three index definitions; manually applied by consuming app |
| `README.md` | Package documentation | Full public-facing docs: install, config, API, identity models, environment variables, PII notice, V1 scope |

---

### 5. Files to Modify

None. This milestone creates new files only.

---

### 6. Files to Leave Untouched

- `src/index.ts`
- `src/instance.ts`
- `src/types.ts`
- `src/context.ts`
- `src/providers/postgres.ts`
- `src/providers/posthog.ts`
- `src/providers/sentry.ts`
- `tsconfig.json`
- `package.json`
- `tsup.config.ts`
- Any existing test files

---

### 7. Layer Rules Reminder

1. **No code changes in this milestone.** SQL and Markdown only. Any temptation to "fix" a source file is out of scope.
2. **Migration file is documentation, not automation.** The SQL file must not include any procedural logic, migration runners, or `IF NOT EXISTS` guards — it is applied manually by the developer, once.
3. **README must not invent API surface.** Document only what is implemented: `initDotell()`, `track()`, `identify()`, `error()`. Do not document features deferred to V2 as if they exist.

---

### 8. Engineering Rules

**Do:**
- Use the exact column names and types from `domain_model`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id TEXT`, `event TEXT NOT NULL`, `properties JSONB`, `context TEXT CHECK (context IN ('client', 'server'))`, `identity_model TEXT CHECK (identity_model IN ('anonymous', 'authenticated', 'hybrid'))`, `created_at TIMESTAMP DEFAULT now()`
- Include exactly these three indexes: `idx_events_user_id ON events(user_id)`, `idx_events_event ON events(event)`, `idx_events_created_at ON events(created_at)`
- Document that `NEXT_PUBLIC_POSTHOG_KEY` is build-time and `SENTRY_DSN` / db connection are runtime
- Document the idempotency rule for `initDotell()`: second call with same config is a no-op with console warning; second call with different config is a hard error
- Document that `track()` and `error()` return `void` synchronously and never throw
- Document the `track()`-before-`identify()` behavior: emits with `null` userId, dev-only console warn
- Document PII responsibility clearly: consuming app owns sanitization, dotell does not strip PII
- Document Pages Router as explicitly unsupported (not deferred)
- Document Edge Runtime as explicitly unsupported in V1

**Don't:**
- Do not add `IF NOT EXISTS` to the `CREATE TABLE` statement
- Do not wrap the SQL in a transaction block
- Do not add a `DROP TABLE` statement
- Do not document retry logic, event batching, React hooks (`useDotell()`), or server-side `identify()` as available features
- Do not invent config keys or method signatures not present in the implementation
- Do not reference CJS output — package is ESM only
- Do not add a `CHANGELOG.md` or `CONTRIBUTING.md` — out of scope for this milestone

---

### 9. Ambiguity Protocol

If any column name, type, constraint, or index definition is unclear from the domain_model data provided, **stop and record the ambiguity in the Open Questions section below rather than guessing**. Do not infer a different schema than what is specified. Do not add columns not listed. Do not remove constraints listed.

If any public API signature (method name, parameter shape, return type) is unclear from the existing source files, read `src/types.ts` and `src/instance.ts` before documenting. Do not document a signature that contradicts the implementation.

---

### 10. What Is NOT in This Milestone

- No changes to any TypeScript source files
- No `CHANGELOG.md`
- No `CONTRIBUTING.md`
- No `LICENSE` file
- No CLI tooling or `npx dotell migrate` command
- No JavaScript migration runner export
- No `dotell check` deployment validation command
- No `useDotell()` React hook documentation
- No server-side `identify()` documentation
- No retry or batching documentation
- No CJS output documentation
- No `IF NOT EXISTS` migration guard
- No version bump to `package.json`
- No new npm scripts
- No test files

---

### 11. Assumptions Made

- `migrations/create_events_table.sql` is a new file per milestone spec; `migrations/001_create_events.sql` from Milestone 1 remains untouched (both ship in the `migrations/` directory).
- `DotellProvider` is documented as a **consuming-app pattern**, not a dotell export — dotell does not ship this component (deferred).
- Anonymous UUID localStorage is documented per domain model design; full localStorage implementation may still be pending in `identity/anonymous.ts`.
- README replaces the Milestone 1 placeholder — treated as the milestone's README deliverable, not a code modification.

---

### 12. Open Questions

- **Duplicate migration files:** `001_create_events.sql` and `create_events_table.sql` contain equivalent schema. Consider removing or aliasing one before publish to avoid developer confusion.
- **Anonymous localStorage:** README documents anonymous UUID behavior per domain model; confirm whether a code milestone is still needed to complete `getAnonymousUserId()` before npm publish.