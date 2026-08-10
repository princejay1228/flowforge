# FlowForge — Development Rules

Rules for any coding agent (including Antigravity) working on this
repository after the initial scaffold. Read `PROJECT_ROADMAP.md` and
`ARCHITECTURE.md` first — this document assumes that context.

## Non-negotiable rules

1. **Do not introduce a backend/server database.** No Firebase, Supabase,
   MongoDB, MySQL, PostgreSQL, Prisma, Redis, or any server-side data
   store. All persistence is client-side IndexedDB via Dexie
   (`src/lib/db`).
2. **Do not bypass Dexie.** All reads/writes to persisted application data
   go through `src/lib/db`'s `db` singleton (ideally via a hook in
   `src/hooks`, following the pattern in `use-workspaces.ts`). Don't open
   IndexedDB directly, and don't add a second persistence mechanism.
3. **Do not directly call AI providers from UI components or feature
   code.** Always go through `generateWorkflow()` in
   `src/lib/ai/generate-workflow.ts`. Concrete provider SDKs are imported
   only inside `src/lib/ai/providers/*` and registered via
   `registerProvider` in `src/lib/ai/provider.ts`.
4. **Do not bypass Zod validation.** Any data crossing a trust boundary
   (AI output, uploaded file content, anything not already typed
   internally) must be validated with the matching schema in
   `src/schemas` before being treated as trusted application data.
5. **Do not hard-code provider-specific AI logic** outside
   `src/lib/ai/providers/*`. Feature code and prompts should be written
   against the `AIProvider` interface, not a specific vendor's API shape.
6. **Never replace deterministic validation with an AI guess.** The
   Validation Engine (`src/lib/validation`, `src/features/validation`)
   must remain deterministic, testable logic — not another AI call.
7. **Keep DFA logic mathematically correct.** When implementing
   `src/features/dfa`, build a genuine DFA (states, alphabet, transition
   function, simulation, accept/reject/dead states) per the 5-tuple
   contract in `src/types/dfa.ts`. Do not create a component that only
   renders boxes and labels them a DFA.
8. **Do not claim unfinished features are implemented** — not in code
   comments, README files, commit messages, or UI copy. If a page or
   function is a placeholder, say so explicitly (see the existing
   placeholder pages under `src/app` for the expected tone/format).

## Code organization rules

9. **Do not duplicate business logic.** If logic already exists in
   `src/lib/*` or a feature's public API, import it — don't reimplement a
   variant inline.
10. **Do not create giant components.** Split feature UI into small,
    composable pieces under `features/<name>/components/`. A component
    file mixing data-fetching, business logic, and complex layout is a
    sign it should be split.
11. **Do not silently change established interfaces.** Changing
    `AIProvider`, any type in `src/types`, or the Dexie schema in
    `src/lib/db/database.ts` requires updating the corresponding Zod
    schema in `src/schemas` in the same change, and — for schema-visible
    or architectural changes — a note in `PROJECT_ROADMAP.md`.
12. **Do not rewrite unrelated files.** Keep changes scoped to the feature
    or module you're working on. If a change genuinely requires touching
    shared types/schemas, do so deliberately and document why.
13. **Prefer reusable modules** over one-off, feature-specific copies of
    the same logic (date formatting, validation helpers, etc.) — put
    shared logic in `src/lib/utils` or a dedicated `src/lib/<domain>`
    module.
14. **Respect the dependency rules in `ARCHITECTURE.md` §10.** In
    particular: `src/lib/*` must never import from `src/features/*`.

## Process rules

15. **Preserve TypeScript strictness.** Do not weaken `tsconfig.json`'s
    strict settings to make code compile. Fix the types instead.
16. **Test logic before integrating UI.** For deterministic modules
    (validation, scheduler, DFA), write and run unit tests against the
    plain functions before wiring them into feature components.
17. **Update `PROJECT_ROADMAP.md` when architecture changes.** Adding a
    module, changing the storage schema, or altering the compilation
    pipeline should be reflected in the roadmap doc in the same change.
18. **Keep future AI outputs schema-driven.** Any new AI-generated data
    shape needs a corresponding type in `src/types` and schema in
    `src/schemas` before it's used elsewhere in the app.
19. **No fake implementations.** Don't write a function that returns
    hard-coded or mocked data while presenting it as if it were doing
    real work — either implement it for real or leave it explicitly
    unimplemented (throwing or clearly marked as a stub), matching the
    pattern already used in `src/lib/ai/generate-workflow.ts` and
    `src/lib/validation/validate-workflow.ts`.
20. **No unnecessary dependencies.** Check whether an already-installed
    package (see `PROJECT_ROADMAP.md` §6) covers the need before adding a
    new one.
21. **No unnecessary comments or dead code.** Comments should explain
    *why*, not restate the code. Remove code paths that are no longer
    reachable rather than leaving them commented out.
