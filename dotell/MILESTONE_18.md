# MILESTONE_18.md

## SECTION 1 — HUMAN SUMMARY

Milestone 18 is the final pre-publish verification pass: confirm the compiled dist is correct, the package.json exports map is accurate, and the package is ready for `npm publish`. This milestone does **not** publish — it prepares and validates only. It runs `tsup`, inspects the output artifacts, and validates the publish manifest against the project's V1 delivery checklist. Estimated complexity: low. One focused session.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Title:** Final Publish Readiness Verification
**Number:** 18

---

### 2. What This Milestone Builds

This milestone performs a complete pre-publish verification of the `@joefuentes/dotell` package. It does not add new features or modify runtime logic. It:

1. Runs `tsup` to produce a clean compiled dist
2. Confirms all expected output artifacts exist: `dist/index.js`, `dist/index.d.ts`, and any generated chunk files
3. Audits `package.json` to confirm `main`, `module`, `types`, `exports`, `files`, `sideEffects` are all correctly set for ESM-only publishing
4. Confirms the migration SQL file is included in the `files` array and exists at the declared path
5. Runs `npm pack --dry-run` and inspects the output to confirm the packed contents match the intended publish manifest
6. Runs the TypeScript compiler (`tsc --noEmit`) to confirm zero type errors across the full source tree
7. Verifies the `version` field in `package.json` matches the intended V1 semver (`1.0.0`)
8. Confirms no `dist/` or generated artifacts are committed to source control (`.gitignore` check)

---

### 3. Why This Comes Next

M16 completed the integration test suite. M17 (README) was completed in M13 and confirmed unchanged. All runtime code, types, migrations, and tests are done. M18 is the logical final gate before `npm publish`. Nothing in this milestone should alter runtime behavior — it only validates that what is already built is packaged correctly and ready for public release.

---

### 4. Files to Create

| File | Path | Purpose |
|------|------|---------|
| `PUBLISH_CHECKLIST.md` | `PUBLISH_CHECKLIST.md` | Human-readable record of every verification step performed, the result of each check, and explicit GO / NO-GO decision. Stays in repo as a release artifact. |

---

### 5. Files to Modify

| File | What Changes | Why |
|------|-------------|-----|
| `package.json` | Audit and correct (if needed): `"main"`, `"module"`, `"types"`, `"exports"`, `"files"`, `"sideEffects": false`, `"type": "module"`, `"version": "1.0.0"` | Ensure the publish manifest is accurate before `npm pack` |
| `.gitignore` | Confirm `dist/` is listed; add if missing | Compiled output must not be committed to source control |
| `tsup.config.ts` | Confirm entry point, format (`esm`), `dts: true`, `sourcemap` setting, and `clean: true` are set; correct if any are missing | Ensures tsup produces the expected artifacts for the ESM-only V1 output |

---

### 6. Files to Leave Untouched

- All files under `src/` — no runtime logic changes in this milestone
- `migrations/create_events_table.sql` — migration artifact is complete; read-only in this milestone
- `README.md` — documentation is complete from M13; do not modify
- All test files under `tests/` or `__tests__/` — test suite is complete from M16; do not modify
- `REVIEW_*.md` files — historical records; do not modify

---

### 7. Layer Rules Reminder

1. **No runtime logic changes.** This milestone is verification-only. If a fix is needed in `src/`, stop, record the issue in `PUBLISH_CHECKLIST.md` as a blocker, and do not attempt to fix it within this session.
2. **ESM-only output.** `tsup.config.ts` must specify `format: ['esm']` only. No CJS output. `package.json` must have `"type": "module"`. Do not add a `cjs` format entry under any assumption.
3. **Public types must be named and exported.** During `tsc --noEmit`, if any anonymous public type error surfaces, record it as a blocker — do not inline a fix without stopping.

---

### 8. Engineering Rules

**DO:**
- Run `tsup` and inspect the actual `dist/` output before making any claims about artifact correctness
- Run `npm pack --dry-run` and paste the full file list into `PUBLISH_CHECKLIST.md`
- Run `tsc --noEmit` and record the exact output (zero errors expected)
- Verify `migrations/create_events_table.sql` appears in the `npm pack --dry-run` output
- Confirm `"sideEffects": false` is present in `package.json` (enables tree-shaking in consuming apps)
- Confirm `"exports"` map covers `"."` with `import` and `types` keys
- Record every check result (PASS / FAIL / BLOCKER) in `PUBLISH_CHECKLIST.md`
- Set a final GO / NO-GO in `PUBLISH_CHECKLIST.md`

**DO NOT:**
- Run `npm publish` — this milestone stops at pack verification
- Modify any file in `src/` — runtime code is frozen for this milestone
- Add CJS output format to `tsup.config.ts`
- Add new exports, new methods, or new config keys
- Change the events table schema
- Modify test files
- Suppress TypeScript errors with `// @ts-ignore` or `as any` to pass the type check

---

### 9. Ambiguity Protocol

If any of the following conditions are encountered, **stop and record in `PUBLISH_CHECKLIST.md`** rather than assuming a safe fix:

- `tsc --noEmit` reports errors in `src/` files
- `dist/index.js` is missing or empty after `tsup` runs
- The migration SQL file does not appear in `npm pack --dry-run` output
- `package.json` is missing required ESM fields and the correct values are not clear from the project model
- `tsup` outputs a CJS file unexpectedly

Do not attempt to resolve blockers silently. Record them explicitly as BLOCKER items in `PUBLISH_CHECKLIST.md` with the exact error output.

---

### 10. What Is NOT in This Milestone

- Running `npm publish` — explicitly deferred to a separate publish action
- Fixing any bugs found in `src/` — blockers are recorded, not fixed
- Adding new runtime features or methods
- Changing the events table schema or migration SQL
- Writing new tests
- Modifying README.md
- Adding CJS support
- CI/CD pipeline setup
- Version bumping beyond confirming `1.0.0` is already set

---

### 11. Assumptions Made

- **`tsc --noEmit` test-file errors recorded as BLOCKER** even though runtime `src/` compiles cleanly — M18 requires zero errors on the full `tsconfig` include tree.
- **No modifications to `package.json`, `tsup.config.ts`, or `.gitignore`** — all already matched M18 spec on audit.
- **`npm test` included in verification** though not explicitly listed in M18 steps — confirms M16 suite still passes post-build.
- **Both migration SQL files verified in pack** — M18 references `create_events_table.sql`; `001_create_events.sql` also ships.

---

### 12. Open Questions

- How should the developer resolve 7 `tsc` errors in `integration.test.ts` (tsconfig exclude vs test fix)?
- Should duplicate migration file be removed before publish?
- Should sourcemaps ship in the published tarball?