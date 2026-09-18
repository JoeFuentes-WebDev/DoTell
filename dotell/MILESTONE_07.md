# MILESTONE_07.md

## SECTION 1 — HUMAN SUMMARY

This milestone completes the anonymous identity model by wiring up the localStorage UUID read/write/generate logic in `src/identity/anonymous.ts`. The TODO left from earlier milestones is the last functional gap before integration testing can begin. Complexity is low — one file, pure browser-side logic, no new dependencies. This must be done before any real end-to-end test of the anonymous model is valid.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Title:** Anonymous Identity — localStorage UUID Implementation
**Number:** 7

---

### 2. What This Milestone Builds

Complete the implementation of `src/identity/anonymous.ts`. This file must:

- Define an internal localStorage key constant (not exported — consuming app never touches it)
- Export a named function `getAnonymousId(): string | null` that:
  - Returns `null` immediately if called in a server context (`typeof window === 'undefined'`)
  - Reads the UUID from localStorage using the internal key
  - If a UUID exists, returns it
  - If no UUID exists, generates a new one using `crypto.randomUUID()`, writes it to localStorage, and returns it
- Export a named function `clearAnonymousId(): void` that:
  - Is a no-op in server context
  - Removes the key from localStorage (used for testing and session teardown — not part of the public API)

No other logic. No side effects beyond localStorage reads/writes. No imports from other dotell modules.

---

### 3. Why This Comes Next

Review 06 identified that `src/identity/anonymous.ts` contains a TODO and the anonymous model is not fully functional. The README documents anonymous identity as a working feature. This gap must be closed before integration testing. All other milestones are complete — this is the last implementation debt item.

---

### 4. Files to Create

None. The file already exists with a TODO placeholder.

---

### 5. Files to Modify

| File | What Changes | Why |
|------|-------------|-----|
| `src/identity/anonymous.ts` | Replace TODO placeholder with full localStorage UUID implementation as specified above | Anonymous model is documented but non-functional; this closes the implementation gap |

---

### 6. Files to Leave Untouched

- `src/index.ts`
- `src/init.ts`
- `src/track.ts`
- `src/identify.ts`
- `src/error.ts`
- `src/context.ts` (or equivalent context detection file)
- `src/types.ts` (or equivalent public types file)
- `src/identity/authenticated.ts`
- `src/identity/hybrid.ts`
- `migrations/create_events_table.sql`
- `migrations/001_create_events.sql` (if present)
- `README.md`
- `package.json`
- `tsconfig.json`
- `tsup.config.ts` (or equivalent build config)

---

### 7. Layer Rules Reminder

1. **localStorage is client-side only.** The function must guard with `typeof window === 'undefined'` before any localStorage access. Server-side calls return `null` — no error, no throw.
2. **dotell owns the localStorage key.** The key name is an internal implementation detail. It must not be exported or documented as a consumer-facing API.
3. **No imports from other dotell modules.** `anonymous.ts` is a leaf module. It has no dependencies on `init.ts`, `track.ts`, or any other internal file.

---

### 8. Engineering Rules

**Do:**
- Use `crypto.randomUUID()` for UUID generation — it is available in all modern browsers and Node.js 14.17+
- Return `null` (not an empty string, not a thrown error) when called in server context
- Keep `clearAnonymousId` internal-use only — do not add it to the public API exports in `src/index.ts`
- Ensure both exported functions are explicitly named (no anonymous exports)
- Ensure the localStorage key constant follows a namespaced convention to avoid collision (e.g., `dotell:anonymous_id`)

**Do not:**
- Export the localStorage key constant
- Import from any other dotell source file
- Add a `try/catch` around `crypto.randomUUID()` — it does not throw in supported environments
- Add any async logic — both functions are synchronous
- Modify `src/index.ts` to export `clearAnonymousId` — it is not part of the public API
- Use `uuid` or any external library — `crypto.randomUUID()` is sufficient

---

### 9. Ambiguity Protocol

If the existing `src/identity/anonymous.ts` contains logic beyond a TODO comment that conflicts with this spec, stop and record the conflict in Open Questions before making changes. Do not overwrite logic that may have been partially implemented without documenting what was there.

---

### 10. What Is NOT in This Milestone

- Changes to any other source file
- Exporting `clearAnonymousId` as part of the public API
- Any change to how `getAnonymousId` is called from `track.ts` or `identify.ts` (those call sites are assumed already wired or are a separate milestone)
- Integration testing or test file creation
- Build verification or `npm run build` execution
- README updates
- Any migration file changes
- Resolving the duplicate migration file question from Review 06

---

### 11. Assumptions Made

- `getAnonymousUserId()` retained as a thin alias to `getAnonymousId()` so `src/identity/state.ts` continues to work without modifying other files (milestone restricts changes to `anonymous.ts` only).
- `typeof window === 'undefined'` guard used directly in `anonymous.ts` per milestone spec, overriding ONBOARDING's context.ts-only rule for this leaf module.
- localStorage key `dotell:anonymous_id` follows namespaced convention from engineering rules.

---

### 12. Open Questions

- **Function naming:** Milestone specifies `getAnonymousId()`; `state.ts` imports `getAnonymousUserId()`. Alias added in `anonymous.ts` — should `state.ts` be updated to use `getAnonymousId()` in a follow-up cleanup?
- **ONBOARDING layer rule:** `typeof window` now appears in both `context.ts` and `anonymous.ts` — confirm whether ONBOARDING should be updated to exempt `identity/anonymous.ts`.