# REVIEW_18.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 18 of the dotell project. Read it after Cursor completes the milestone to confirm the build is clean before moving on. Look for any files that combine concerns across layers, any public types that are anonymous or unexported, and any place where a runtime throw might have been introduced. A passing review means: all files are described, no layer violations exist, no engineering rules were bent, and open questions are clearly flagged for your decision rather than silently resolved.

---

## SECTION 2 — CURSOR DIRECTIVE

Fill in every field honestly. If a field has nothing to report, write "None." Do not leave fields blank.

---

### 1. Milestone Completed

**Title:** Final Publish Readiness Verification
**Number:** 18

---

### 2. Files Created

List every file created in this milestone. One line per file describing what it does.

| File | Description |
|------|-------------|
| `PUBLISH_CHECKLIST.md` | Human-readable record of all M18 verification steps, pass/fail results, npm pack file list, blockers, and final NO-GO decision |

---

### 3. Files Modified

List every file modified in this milestone. Include what changed and why.

| File | What Changed | Why |
|------|--------------|-----|
| *(none)* | Audited only — no changes required | `package.json`, `tsup.config.ts`, and `.gitignore` already matched M18 spec |

---

### 4. Assumptions Made

List every decision made where the instructions were ambiguous or silent. For each, state what you assumed and why.

| Decision Point | Assumption Made | Reasoning |
|----------------|-----------------|-----------|
| `tsc --noEmit` failure scope | Test-file errors are a **BLOCKER** for M18 GO decision even though runtime `src/` has zero errors | M18 requires zero errors across full `tsconfig` include tree |
| M18 forbids test fixes | Did not modify `src/__tests__/integration.test.ts` despite knowing fixes | M18 Section 6 explicitly leaves test files untouched |
| Migration path in M18 spec | Verified both `create_events_table.sql` (M18 spec) and `001_create_events.sql` (ONBOARDING canonical) appear in pack | Both files exist and ship via `files: ["migrations"]` |
| `npm test` run | Included in checklist though not explicitly listed in M18 steps | Confirms M16 suite still passes after build; no regressions |

---

### 5. Open Questions

List anything unresolved that the developer must decide before proceeding to the next milestone. Do not resolve these yourself.

| Question | Context | Impact if Unresolved |
|----------|---------|----------------------|
| How to resolve `tsc --noEmit` test errors? | 7 errors in `integration.test.ts` (`delete` on non-optional props, `window` assignment, read-only `NODE_ENV`) | Publish checklist is NO-GO until resolved |
| Remove duplicate migration file? | Both SQL files ship in tarball | Integrator confusion; non-blocking for pack correctness |
| Ship sourcemaps in published package? | `dist/index.js.map` included via `files: ["dist"]` | Larger tarball; may be desirable for debugging |

---

### 6. Risks

List anything that could break silently, requires manual verification, or depends on external state the build cannot confirm.

| Risk | Likelihood | How to Verify |
|------|------------|---------------|
| `tsc` failure ignored at publish time | Medium if developer publishes without re-checking | Run `tsc --noEmit` after fixing blocker |
| npm publish auth / scope permissions | Unknown | `npm whoami` and test publish to private registry or `npm publish --dry-run` |
| Consuming app Sentry/PostHog init | External | Manual integration test in a Next.js app |
| Vitest passes but `tsc` fails on same test file | Confirmed | Type-check CI should use `tsc --noEmit`, not vitest alone |

---

### 7. Layer Violations

List any place where concerns from separate layers were combined in a single file or function. There should be none. If none, state that explicitly.

**Violations found:** None — verification-only milestone; no runtime code touched.

---

### 8. Engineering Rule Violations

List any engineering rule from the project spec that was bent or broken. There should be none. If none, state that explicitly.

**Violations found:** None

---

### 9. Ready to Proceed

**Decision:** No

**Reasoning:** Build (`tsup`), publish manifest audit, `npm pack --dry-run`, `.gitignore`, and integration tests (26/26) all pass. Public API types in `dist/index.d.ts` are named and exported. One blocker prevents GO: `tsc --noEmit` reports 7 type errors in `src/__tests__/integration.test.ts`. M18 scope forbids fixing tests or runtime code in this session — resolve via `tsconfig.json` exclude or a follow-up test fix milestone, then re-run checklist before `npm publish`.
