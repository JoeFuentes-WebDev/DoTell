# MILESTONE_14.md

## SECTION 1 — HUMAN SUMMARY

Milestone 14 prepares the package for npm publication by configuring `package.json` correctly and validating the tsup build output. This includes setting the correct `exports`, `main`, `types`, `files`, and `publishConfig` fields so that consuming apps can install `@joefuentes/dotell` and import it cleanly. This comes directly after documentation (M13) — the package is feature-complete and documented; it now needs a correct publish manifest before `npm publish` can be run. Low complexity, high consequence if misconfigured.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Title:** Package Manifest and Publish Configuration
**Number:** 14

---

### 2. What This Milestone Builds

Configure `package.json` for correct npm publication of `@joefuentes/dotell`. Specifically:

- Set `"name": "@joefuentes/dotell"` and `"version": "1.0.0"`
- Set `"type": "module"` to declare ESM-only package
- Set `"main"` and `"module"` to point to the tsup ESM output (`dist/index.js`)
- Set `"types"` to point to the tsup type declarations (`dist/index.d.ts`)
- Set `"exports"` with a proper ESM-only export map:
  ```json
  {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
  ```
- Set `"files"` to include only `["dist", "migrations"]` — no source files shipped
- Set `"publishConfig"` to `{ "access": "public" }`
- Set `"sideEffects": false`
- Confirm `"scripts"` includes a `"build"` script using tsup and a `"prepublishOnly"` script that runs build
- Confirm `"engines"` is set to `{ "node": ">=18" }` — Next.js App Router minimum

Also validate that `tsup.config.ts` (or equivalent) is configured to:
- Output to `dist/`
- Format: `esm` only
- Generate `.d.ts` declarations
- Entry point: `src/index.ts`

If `tsup.config.ts` does not exist, create it with the above settings. If it exists, verify it matches and patch only what diverges.

---

### 3. Why This Comes Next

The package is feature-complete (M1–M12) and fully documented (M13). The only remaining step before `npm publish` is a correct publish manifest. Without proper `exports`, `files`, and `publishConfig`, the package will either ship source files, be inaccessible to consumers, or publish as private. This is the direct prerequisite to a publishable package.

---

### 4. Files to Create

| File | Purpose |
|------|---------|
| `tsup.config.ts` | tsup build configuration — entry point, ESM output, `.d.ts` generation. Create only if it does not already exist. |

---

### 5. Files to Modify

| File | What Changes | Why |
|------|-------------|-----|
| `package.json` | Add/correct `exports`, `main`, `module`, `types`, `files`, `publishConfig`, `sideEffects`, `engines`, `prepublishOnly` script | These fields are required for correct npm publish behavior. Missing or wrong values will break consumer imports or publish as private. |
| `tsup.config.ts` | If it exists: verify entry is `src/index.ts`, format is `esm`, `dts: true`, outDir is `dist`. Patch only diverging fields. | Ensures build output matches what `package.json` declares in `exports` and `types`. |

---

### 6. Files to Leave Untouched

- `src/index.ts`
- `src/types.ts`
- `src/config.ts`
- `src/init.ts`
- `src/track.ts`
- `src/identify.ts`
- `src/error.ts`
- `src/context.ts`
- `src/providers/posthog.ts`
- `src/providers/sentry.ts`
- `src/providers/postgres.ts`
- `migrations/` (any `.sql` files)
- `README.md`
- `tsconfig.json`
- `.gitignore`
- Any test files

---

### 7. Layer Rules Reminder

1. **ESM only.** `package.json` must declare `"type": "module"`. No CJS output, no dual format. The `exports` map must use `"import"` only — no `"require"` key.
2. **No source files shipped.** `"files"` must be `["dist", "migrations"]`. Source TypeScript must not reach the npm tarball.
3. **Public scoped package.** `publishConfig.access` must be `"public"` or `npm publish` will fail for the `@joefuentes/` scope.

---

### 8. Engineering Rules

**DO:**
- Set `"prepublishOnly": "npm run build"` so the dist is always fresh before publish
- Set `"sideEffects": false` to enable tree-shaking in consuming app bundlers
- Set `engines.node` to `">=18"` — App Router minimum and gen_random_uuid() is available in Postgres 13+, but Node 18 is the safe floor for the package runtime
- Keep the `exports` map minimal — one entry point (`.`) only
- Confirm tsup `entry` is `["src/index.ts"]`, not a glob

**DO NOT:**
- Add a `"require"` key to the exports map — CJS is deferred to V2
- Add `"src"` to the `files` array
- Set `publishConfig.access` to `"restricted"`
- Add `peerDependencies` — Sentry and PostHog are bundled direct dependencies at V1
- Modify any `src/` files as part of this milestone
- Run `npm publish` — this milestone configures for publish, it does not execute it

---

### 9. Ambiguity Protocol

If any of the following are true, stop and record the ambiguity in **Open Questions** before proceeding:

- `tsup.config.ts` exists but uses a format (e.g., `tsup.config.js`, inline tsup config in `package.json`) that differs from what is specified here
- The existing `package.json` has a `"main"` pointing to a non-`dist/` path that suggests a different build output directory is already in use
- The existing `package.json` already has an `exports` map with a `"require"` key — do not silently remove it; flag it

Do not make a safe assumption and proceed silently on these. Stop and record.

---

### 10. What Is NOT in This Milestone

- Running `npm publish` — out of scope
- Adding a `.npmignore` file — `"files"` in `package.json` is sufficient and is the approach specified
- Adding a `"repository"`, `"license"`, `"keywords"`, or `"description"` field to `package.json` — not specified, not added
- Changing `tsconfig.json` — untouched
- Adding CJS output or dual format — explicitly deferred to V2
- Adding peer dependencies — deferred to V2
- Creating a CI/CD publish pipeline — deferred
- Running a build to verify output — configuration only; Cursor must not execute shell commands

---

### 11. Assumptions Made

- **`tsup.config.ts` already existed** and matched all required settings (`entry: ['src/index.ts']`, `format: ['esm']`, `dts: true`, `outDir: 'dist'`). No file was created or modified.
- **Existing `description`, `keywords`, `license`, and `author` fields were left untouched.** Milestone Section 10 says not to *add* repository/license/keywords/description; it does not require removing fields that were already present from M1.
- **`exports` key order** was updated to match the milestone example (`import` before `types`). Both orders are valid per Node resolution; this is cosmetic alignment with the spec.
- **No build was executed.** Milestone Section 10 explicitly states "configuration only; Cursor must not execute shell commands." Build validation is deferred to manual verification before `npm publish`.

---

### 12. Open Questions

- **`author` is still an empty string** in `package.json`. Not in M14 scope, but npm may display a blank author on the registry — confirm whether to populate before first publish.
- **Version `1.0.0` is set per milestone spec**, but no prior version was published. Confirm this is the intended first-publish semver.
- **Build output was not verified in this milestone** (by design). Run `npm run build` and inspect `dist/index.js` + `dist/index.d.ts` before publishing.