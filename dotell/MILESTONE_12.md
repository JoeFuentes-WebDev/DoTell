# MILESTONE_12.md

## SECTION 1 — HUMAN SUMMARY

Milestone 12 resolves the `tsc --noEmit` failure surfaced in the Milestone 11 review. The `EdgeRuntime` global is undeclared in TypeScript's standard lib, causing strict type-check to fail even though `tsup` builds successfully. This milestone patches `tsconfig.json` to declare `EdgeRuntime` as an ambient global so both `tsc` and `tsup` agree. No logic changes, no new features. Estimated session complexity: low.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 12 — Fix EdgeRuntime Ambient Global Declaration**

---

### 2. What This Milestone Builds

A single TypeScript ambient declaration that resolves the undeclared `EdgeRuntime` global in `src/context.ts`. The current code uses `typeof EdgeRuntime !== 'undefined'` to detect the Edge Runtime environment. TypeScript's compiler does not know about this global, so `tsc --noEmit` fails. This milestone adds a minimal ambient declaration file (`src/globals.d.ts`) that types `EdgeRuntime` as `string | undefined`, making `tsc --noEmit` pass without changing any runtime behavior.

---

### 3. Why This Comes Next

The Milestone 11 review explicitly surfaced this as the only blocking open item before the package is publish-ready. The `tsup` build succeeds but `tsc --noEmit` fails. Any CI pipeline that runs strict type-checking would fail. This must be resolved before the package is considered done. It is the smallest possible fix — one declaration file, no logic touched.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/globals.d.ts` | Ambient declaration file — declares `EdgeRuntime` as `declare var EdgeRuntime: string \| undefined` so TypeScript recognizes the global without changing runtime behavior |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `tsconfig.json` | Confirm `include` covers `src/**/*.d.ts` or add explicit glob if needed so `globals.d.ts` is picked up by the compiler | Ambient declaration files must be in the compiler's `include` scope to take effect |

---

### 6. Files to Leave Untouched

- `src/context.ts` — the detection logic is correct; only the missing type declaration needs fixing
- `src/index.ts` — barrel export is complete and verified
- `src/types.ts` — no type changes
- `src/init.ts` — no changes
- `src/track.ts` — no changes
- `src/identify.ts` — no changes
- `src/error.ts` — no changes
- `src/providers/` — all provider files untouched
- `src/identity/` — all identity files untouched
- `tsup.config.ts` — build config is correct, no changes
- `package.json` — no changes
- `migrations/` — no changes

---

### 7. Layer Rules Reminder

1. **No runtime logic in declaration files** — `globals.d.ts` must contain only `declare var` statements. No imports, no exports, no executable code.
2. **Context detection is internal** — `src/context.ts` already implements the correct three-way detection (`isClient`, `isEdge`, `isServer`). This milestone does not change that logic, only resolves the TypeScript visibility of the `EdgeRuntime` global.
3. **Never throw at runtime** — this milestone touches no runtime code paths. The fix is purely at the type-check layer.

---

### 8. Engineering Rules

**Do:**
- Declare `EdgeRuntime` as `declare var EdgeRuntime: string | undefined` — this matches the actual runtime shape (present and a string in Edge Runtime, absent elsewhere)
- Verify `tsc --noEmit` passes after the change
- Keep `globals.d.ts` minimal — one declaration only, no unrelated globals added

**Do not:**
- Add `/// <reference>` directives to other source files — the ambient declaration file should be automatically picked up by `tsconfig.json`
- Change the detection logic in `src/context.ts`
- Add `@types/` packages as a workaround — an ambient declaration file is the correct approach for non-standard globals
- Export anything from `globals.d.ts` — it must be an ambient (non-module) declaration file; adding any `import` or `export` statement would convert it to a module and break the ambient scope
- Widen the type unnecessarily — `string | undefined` is the correct shape; do not use `any`

---

### 9. Ambiguity Protocol

If `tsconfig.json` already includes `src/**/*` but still does not pick up `globals.d.ts`, stop and record the exact `tsc` error output before attempting alternative fixes. Do not modify `src/context.ts` as a workaround without recording it as an open question.

---

### 10. What Is NOT in This Milestone

- Renaming `TrackProperties` to `EventProperties` — surfaced as an open question in M11 but not resolved; deferred
- Any new feature, method, or type
- Changes to `tsup.config.ts` or build output
- Resolving the `EventProperties` naming inconsistency between docs and code
- Any README or documentation updates
- Publishing the package to npm
- Any change to how `EdgeRuntime` is detected at runtime

---

### 11. Assumptions Made

- `tsconfig.json` `"include": ["src/**/*", ...]` already covers `src/globals.d.ts` — no tsconfig change required.
- Ambient declaration uses `declare var EdgeRuntime: string | undefined` per milestone spec (matches `typeof EdgeRuntime !== 'undefined'` check in `context.ts`).

---

### 12. Open Questions

- None.