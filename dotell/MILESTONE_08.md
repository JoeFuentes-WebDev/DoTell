# MILESTONE_08.md

## SECTION 1 — HUMAN SUMMARY

Milestone 8 closes the open question from Review 7 by standardising the anonymous identity export name. `getAnonymousUserId` (the alias kept in M7 to avoid touching `state.ts`) will be removed from `anonymous.ts`, and `state.ts` will be updated to import `getAnonymousId` directly. This is a single naming-consistency fix with no behaviour change. Low complexity — two files, one renamed reference.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 8 — Anonymous Identity Export Name Normalisation**

---

### 2. What This Milestone Builds

Remove the `getAnonymousUserId` alias from `src/identity/anonymous.ts` and update the single import site in `src/core/state.ts` to use `getAnonymousId` instead. No logic changes. No new behaviour. Naming consistency across the identity layer only.

Concretely:
- `anonymous.ts` exports `getAnonymousId` and `clearAnonymousId`. The `getAnonymousUserId` alias is deleted entirely.
- `state.ts` replaces its `import { getAnonymousUserId }` with `import { getAnonymousId }` and updates every call site within that file accordingly.

---

### 3. Why This Comes Next

Milestone 7 left `getAnonymousUserId` as a deliberate alias to avoid modifying `state.ts` inside that milestone's narrow scope. Review 7 flagged this as Open Question 1 with explicit impact: naming inconsistency across the identity layer. This milestone resolves it before any further milestones build on top of the anonymous identity or state module. Cleaning the name now prevents the alias from leaking into tests, documentation, or downstream consumers.

---

### 4. Files to Create

None.

---

### 5. Files to Modify

| File | What changes and why |
|------|----------------------|
| `src/identity/anonymous.ts` | Delete the `getAnonymousUserId` alias export. `getAnonymousId` is the sole exported name for the public-facing UUID getter. `clearAnonymousId` remains unchanged. |
| `src/core/state.ts` | Update the named import from `getAnonymousUserId` to `getAnonymousId`. Update every call site within the file that references `getAnonymousUserId` to call `getAnonymousId` instead. No other changes. |

---

### 6. Files to Leave Untouched

| File | Reason |
|------|--------|
| `src/identity/index.ts` | If it re-exports from `anonymous.ts`, Cursor must check whether it re-exports `getAnonymousUserId` — if it does, that export must also be removed. If it already re-exports `getAnonymousId` only, leave it untouched. No new exports added. |
| `src/core/context.ts` | No reference to anonymous identity exports — do not touch. |
| `src/core/init.ts` | Not in scope — no anonymous identity import present. |
| `src/providers/*.ts` | No anonymous identity import — do not touch. |
| `src/types/*.ts` | No naming change affects public types — do not touch. |
| `migrations/*.sql` | Unrelated to identity naming — do not touch. |
| `tsup.config.ts` | Build config — do not touch. |
| `package.json` | Do not touch. |

---

### 7. Layer Rules Reminder

1. **Identity layer is a leaf** — `anonymous.ts` must not import from `core/`, `providers/`, or any other dotell module. This milestone does not change that; confirm it remains true after the alias removal.
2. **No new public exports at this milestone** — the only change to the public surface is the removal of `getAnonymousUserId`. Nothing is added.
3. **State module owns identity resolution** — `state.ts` is the only authorised call site for `getAnonymousId`. If any other file in `core/` or `providers/` was calling `getAnonymousUserId`, that is a layer violation and must be reported, not silently fixed.

---

### 8. Engineering Rules

**Do:**
- Confirm the alias is completely gone from `anonymous.ts` — no re-export, no const alias, no type alias.
- Search the entire `src/` tree for any remaining reference to `getAnonymousUserId` after the change. If found outside `state.ts`, report it as an open question before editing.
- Keep `clearAnonymousId` exactly as-is.
- Keep all internal logic in `anonymous.ts` (UUID generation, localStorage read/write, server guard) untouched.

**Don't:**
- Do not rename `getAnonymousId` to anything else.
- Do not add `try/catch` around localStorage in this milestone (that is Risk 1 from Review 7 and is deferred).
- Do not change function signatures, return types, or internal behaviour in either file.
- Do not introduce new exports to `anonymous.ts` or `state.ts`.
- Do not touch any file not listed in sections 5 or 6.

---

### 9. Ambiguity Protocol

If any of the following conditions are true, stop and record in Open Questions before making any edit:

- `getAnonymousUserId` appears in a file other than `state.ts` and `anonymous.ts`
- `src/identity/index.ts` re-exports `getAnonymousUserId` with additional logic beyond a simple re-export
- `state.ts` has more than one import path that references anonymous identity (suggesting a second alias exists somewhere)

Do not resolve ambiguity by guessing. Record the finding and halt.

---

### 10. What Is NOT in This Milestone

- Adding `try/catch` around localStorage in `anonymous.ts` (deferred — Risk 1 from Review 7)
- Any changes to the `getAnonymousId` function body or its server guard logic
- Any changes to `clearAnonymousId`
- Adding or removing any exports beyond removing `getAnonymousUserId`
- Writing or modifying any tests
- Any changes to public-facing types or the `DotellInstance` interface
- Any provider changes
- Migration SQL changes

---

### 11. Assumptions Made

- Milestone references `src/core/state.ts`; actual file is `src/identity/state.ts` — updated per codebase layout.
- No `src/identity/index.ts` exists; nothing to check for re-exports.
- Ambiguity protocol pre-check passed: `getAnonymousUserId` appeared only in `anonymous.ts` and `state.ts`.

---

### 12. Open Questions

- None.