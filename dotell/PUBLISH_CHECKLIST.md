# PUBLISH_CHECKLIST.md

Pre-publish verification for `@joefuentes/dotell@1.0.0` — Milestone 18 (Final Publish Readiness Verification).

**Date:** 2026-06-18  
**Verifier:** Cursor (M18)

---

## Summary

| Decision | Result |
|----------|--------|
| **GO / NO-GO** | **NO-GO** |
| **Blockers** | 1 — `tsc --noEmit` reports 7 type errors in `src/__tests__/integration.test.ts` (runtime `src/` has zero errors) |

Publish manifest, build output, pack contents, and integration tests are ready. Resolve the TypeScript check blocker (test-file types or `tsconfig.json` exclude) before `npm publish`.

---

## Verification Steps

### 1. Build (`npm run build` / tsup)

| Check | Result |
|-------|--------|
| `npm run build` exits 0 | **PASS** |
| `dist/index.js` exists and non-empty (9.8 KB) | **PASS** |
| `dist/index.d.ts` exists and non-empty (1.3 KB) | **PASS** |
| `dist/index.js.map` sourcemap generated | **PASS** |
| No unexpected chunk files (single entry bundle) | **PASS** |
| No CJS output | **PASS** |

**tsup output:**
```
ESM dist/index.js     9.59 KB
ESM dist/index.js.map 20.91 KB
DTS dist/index.d.ts   1.29 KB
```

---

### 2. TypeScript (`tsc --noEmit`)

| Check | Result |
|-------|--------|
| Zero errors across full `include` tree | **FAIL** |
| Zero errors in runtime `src/` (excluding `__tests__/`) | **PASS** |

**Exact output (7 errors, all in `src/__tests__/integration.test.ts`):**
```
src/__tests__/integration.test.ts(74,10): error TS2790: The operand of a 'delete' operator must be optional.
src/__tests__/integration.test.ts(75,10): error TS2790: The operand of a 'delete' operator must be optional.
src/__tests__/integration.test.ts(84,6): error TS2322: Type 'typeof globalThis' is not assignable to type 'Window & typeof globalThis'.
src/__tests__/integration.test.ts(121,17): error TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
src/__tests__/integration.test.ts(134,12): error TS2790: The operand of a 'delete' operator must be optional.
src/__tests__/integration.test.ts(135,12): error TS2790: The operand of a 'delete' operator must be optional.
src/__tests__/integration.test.ts(136,17): error TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
```

**BLOCKER:** M18 requires zero `tsc --noEmit` errors. Errors are test-only; M18 scope forbids modifying test files or `src/` runtime code. Fix requires a follow-up change to `tsconfig.json` (exclude `__tests__`) or test-file type fixes outside M18.

---

### 3. Integration tests (`npm test`)

| Check | Result |
|-------|--------|
| `vitest run` — 26/26 tests pass | **PASS** |

---

### 4. `package.json` publish manifest audit

| Field | Expected | Actual | Result |
|-------|----------|--------|--------|
| `name` | `@joefuentes/dotell` | `@joefuentes/dotell` | **PASS** |
| `version` | `1.0.0` | `1.0.0` | **PASS** |
| `type` | `module` | `module` | **PASS** |
| `main` | `./dist/index.js` | `./dist/index.js` | **PASS** |
| `module` | `./dist/index.js` | `./dist/index.js` | **PASS** |
| `types` | `./dist/index.d.ts` | `./dist/index.d.ts` | **PASS** |
| `exports["."].import` | `./dist/index.js` | `./dist/index.js` | **PASS** |
| `exports["."].types` | `./dist/index.d.ts` | `./dist/index.d.ts` | **PASS** |
| No `require` key in exports | absent | absent | **PASS** |
| `files` | `["dist", "migrations"]` | `["dist", "migrations"]` | **PASS** |
| `sideEffects` | `false` | `false` | **PASS** |
| `publishConfig.access` | `public` | `public` | **PASS** |
| `prepublishOnly` | runs build | `"npm run build"` | **PASS** |

No `package.json` changes required.

---

### 5. `tsup.config.ts` audit

| Setting | Expected | Actual | Result |
|---------|----------|--------|--------|
| `entry` | `['src/index.ts']` | `['src/index.ts']` | **PASS** |
| `format` | `['esm']` only | `['esm']` | **PASS** |
| `dts` | `true` | `true` | **PASS** |
| `sourcemap` | set | `true` | **PASS** |
| `clean` | `true` | `true` | **PASS** |
| `outDir` | `dist` | `dist` | **PASS** |

No `tsup.config.ts` changes required.

---

### 6. Migration SQL in package

| Check | Result |
|-------|--------|
| `migrations/` in `files` array | **PASS** |
| `migrations/001_create_events.sql` exists on disk | **PASS** |
| `migrations/create_events_table.sql` exists on disk | **PASS** |
| Migration appears in `npm pack --dry-run` | **PASS** (both files included) |

---

### 7. `.gitignore` audit

| Check | Result |
|-------|--------|
| `dist/` listed in `.gitignore` | **PASS** |
| `dist/` not tracked in git (`git check-ignore dist/`) | **PASS** |

No `.gitignore` changes required.

---

### 8. `npm pack --dry-run` — full file list

```
npm notice Tarball Contents
npm notice 10.7kB README.md
npm notice 1.3kB dist/index.d.ts
npm notice 9.8kB dist/index.js
npm notice 21.4kB dist/index.js.map
npm notice 526B migrations/001_create_events.sql
npm notice 518B migrations/create_events_table.sql
npm notice 980B package.json
npm notice Tarball Details
npm notice name: @joefuentes/dotell
npm notice version: 1.0.0
npm notice filename: joefuentes-dotell-1.0.0.tgz
npm notice package size: 11.0 kB
npm notice unpacked size: 45.3 kB
npm notice total files: 7
```

| Check | Result |
|-------|--------|
| `dist/index.js` in tarball | **PASS** |
| `dist/index.d.ts` in tarball | **PASS** |
| `migrations/create_events_table.sql` in tarball | **PASS** |
| `migrations/001_create_events.sql` in tarball | **PASS** |
| No `src/` files in tarball | **PASS** |
| README included (npm default) | **PASS** |
| Test files not in tarball | **PASS** |

---

### 9. Public API surface (`dist/index.d.ts`)

Exported types and function confirmed:

- `initDotell`
- `DbClient`, `DotellConfig`, `DotellInstance`, `EventContext`, `EventInsert`, `EventRow`, `IdentifyOptions`, `IdentityModel`, `IdentityRole`, `TrackProperties`

All named exports — **PASS**.

---

## Blockers

| # | Item | Severity | Resolution |
|---|------|----------|------------|
| 1 | `tsc --noEmit` — 7 errors in `src/__tests__/integration.test.ts` | **BLOCKER** | Exclude `src/__tests__` from `tsconfig.json` `include`, or fix test-file TypeScript issues in a follow-up milestone. Do not suppress with `@ts-ignore`. |

---

## Non-blocking notes

- **Duplicate migration files** — both `001_create_events.sql` and `create_events_table.sql` ship in the tarball. Consider removing one before publish to avoid integrator confusion.
- **`dist/index.js.map`** is included in tarball via `dist/` in `files` — acceptable for debugging; confirm intent.

---

## Final decision

**NO-GO** — Package build, manifest, pack contents, and runtime tests are verified. One blocker remains: `tsc --noEmit` does not pass with zero errors due to test-file type issues. Resolve before `npm publish`.
