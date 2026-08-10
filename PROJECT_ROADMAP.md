# FlowForge — Project Roadmap

**Status: Scaffold / Architecture Phase.** No application features are
implemented. This document is the primary instruction reference for any
future coding agent (including Antigravity) continuing this project. Read
this in full before writing code.

---

## 1. Project Vision

FlowForge is a universal AI-powered workflow compiler and management
platform. A user first defines their team/resources (people, roles,
skills, availability), then describes in natural language what they want
to accomplish. An AI model transforms that description — plus team data,
constraints, deadlines, and optional uploaded manuals/SOPs — into a
structured, machine-readable workflow. Deterministic frontend logic then
validates, schedules, visualizes, and can export that workflow.

FlowForge is explicitly **not** a healthcare tool or a software-project
tool. It is domain-agnostic: the same pipeline should work for a hospital
procedure, a restaurant's food-safety checklist, a construction schedule,
or a software sprint.

## 2. Problem Statement

Real-world processes — clinical procedures, kitchen workflows, equipment
maintenance, construction sequencing — are usually captured as prose in
manuals, SOPs, or someone's head. Turning that prose into something
schedulable, checkable, and executable (who does what, in what order, with
what constraints) is manual and error-prone. FlowForge compiles natural
language + team data into a structured workflow, then applies deterministic
checks (scheduling feasibility, skill matching, dependency cycles, formal
state-machine validity) so the output can be trusted enough to actually run
a process against.

## 3. Target Users

- Small-to-mid teams formalizing a repeatable process (clinics, kitchens,
  workshops, event crews, research labs, classrooms).
- Project leads who need a schedule and assignments generated from a plain
  description plus their team's real skills/availability.
- Anyone who currently maintains a process as an unstructured document and
  wants a structured, checkable, executable version of it.

## 4. Supported Domains

Software development, healthcare procedures (pre-/post-operative
workflows), food preparation and food safety, equipment maintenance,
manufacturing, construction, research, education, events, administrative
procedures, emergency procedures, and — by design — any other sequential
or branching real-world process. Domain is a data field
(`Workflow.domain`), never a hard-coded branch in application logic.

## 5. Product Architecture

Conceptually, FlowForge is a **workflow compiler**:

```
Natural Language / Documents
        ↓
AI Parser
        ↓
Structured Workflow Intermediate Representation (IR)
        ↓
Validation Engine
        ↓
Assignment Engine
        ↓
Scheduling Engine
        ↓
Formal Language / DFA Engine
        ↓
Visualization Engine
        ↓
Execution / Monitoring
        ↓
Reports / PDF
```

The AI **proposes** structured information. Deterministic frontend logic
**validates and processes** it. The application must never be fully
dependent on the AI being correct — every AI output passes through Zod
schema validation and (eventually) semantic validation before it is
trusted. See `ARCHITECTURE.md` for the detailed data flow and module
relationships.

## 6. Technology Stack

- Next.js (App Router) + React + TypeScript (strict mode)
- Tailwind CSS + shadcn/ui-style components (see `components.json`)
- Zustand for lightweight UI state
- Dexie.js for IndexedDB persistence (the *only* persistence layer)
- Zod for runtime schema validation, mirroring `src/types`
- React Flow for interactive workflow visualization (not yet used)
- date-fns for date/time handling
- jsPDF / @react-pdf/renderer for future PDF export
- Lucide React for icons

No backend/server database. No Firebase/Supabase/Mongo/MySQL/Postgres/
Prisma/Redis. The app must remain deployable as a static/serverless
frontend on Vercel with all data living client-side in IndexedDB.

## 7. Folder Structure

```
src/
  app/                 Next.js App Router pages (placeholders only so far)
  components/
    ui/                Base shadcn-style primitives (Button, Card, ...)
    layout/            Shared layout components (not yet built)
  features/            One folder per product module (see §14), each with
                        its own README.md, index.ts (public API), and
                        components/ subfolder
  lib/
    db/                Dexie database + singleton instance
    ai/                AI provider abstraction, registry, prompts/, providers/
    validation/        Deterministic validation entry points
    utils/             Small framework-agnostic helpers
  hooks/               Cross-cutting React hooks (e.g. Dexie live queries)
  stores/              Zustand stores (UI state only, not persisted data)
  types/               TypeScript source of truth for all domain models
  schemas/             Zod schemas mirroring src/types, used at AI/IO boundaries
  constants/           App-wide constants
  config/              Typed environment variable access (src/config/env.ts)
```

`features/*` is where product UI and orchestration logic will live.
`lib/*` holds framework-agnostic core logic that features call into.
Nothing outside `lib/db` should import `dexie` directly; nothing outside
`lib/ai` should import a concrete AI SDK.

## 8. Data Architecture

All persistent application data lives in the browser via IndexedDB,
accessed exclusively through Dexie (`src/lib/db/database.ts`). There is no
server-side database and no plan to add one. Data that needs to leave the
browser (e.g. AI calls) is sent directly from the client to the AI
provider; the workflow data itself is not stored server-side.

## 9. IndexedDB Architecture

`FlowForgeDatabase` (in `src/lib/db/database.ts`) currently declares five
tables:

- `workspaces` — keyed by `id`, indexed on `name`, `createdAt`
- `projects` — keyed by `id`, indexed on `workspaceId`, `status`, `createdAt`
- `members` — keyed by `id`, indexed on `workspaceId`, `name`
- `workflows` — keyed by `id`, indexed on `workspaceId`, `projectId`, `domain`, `createdAt`
- `documents` — keyed by `id`, indexed on `workspaceId`, `projectId`, `status`, `uploadedAt`

Tasks, dependencies, assignments, schedule, milestones, risks, and
constraints are stored **inline** on the `Workflow` record (not
normalized into separate tables) since they are always read/written
together with their parent workflow. If a future need arises to query
tasks independently at scale, revisit this — but don't normalize
prematurely.

Schema changes must bump `db.version(n)` and provide an upgrade path;
never mutate an existing version's `stores()` definition in place.

## 10. Workflow IR

The Workflow Intermediate Representation is the central data structure,
defined in `src/types/workflow.ts` (+ `task.ts`, `schedule.ts`, `dfa.ts`)
and validated at runtime by `src/schemas/workflow.schema.ts` (+ siblings).

A `Workflow` has: id, workspaceId, projectId, name, description, domain,
objective, tasks[], dependencies[], milestones[], assignments[],
schedule?, constraints[], risks[], metadata, timestamps.

A `Task` has: id, name, description, status, priority, requiredSkills[],
estimatedDuration, dependsOn[], assignedMemberId?, classification
(mandatory/optional), metadata.

Treat `src/types` as the source of truth and `src/schemas` as its runtime
mirror. When either changes, update both in the same change — see
`DEVELOPMENT_RULES.md`.

## 11. AI Architecture

`src/types/ai.ts` defines the `AIProvider` interface and related types.
`src/lib/ai/provider.ts` is a provider registry (`registerProvider` /
`getProvider`); `src/lib/ai/generate-workflow.ts` is the single function
(`generateWorkflow`) the rest of the app should call. No concrete provider
is implemented yet — `src/lib/ai/providers/` is a placeholder directory
with a README describing the planned `GeminiProvider`, `QwenProvider`,
`DeepSeekProvider`, and `OpenAIProvider`.

Call sites (features/ai, features/workflow) must depend only on
`generateWorkflow()`, never on a vendor SDK or a concrete provider class.
This is what allows the AI provider to be swapped without rewriting the
rest of the application.

## 12. Prompt-Engineering Plan

`src/lib/ai/prompts/` is the designated home for future prompt templates.
Planned: `generate-workflow.prompt.ts` (primary call) and
`review-workflow.prompt.ts` (optional second-pass fix call). Prompts must:

- Request strict, schema-constrained JSON matching `workflowSchema`.
- Include domain context, member data (skills/availability/workload),
  deadline, constraints, and any selected document context.
- Include explicit self-check instructions (e.g. "verify every
  `dependsOn` references an existing task id before responding").
- Favor one well-engineered call over several small ones (see §13).

## 13. AI Reflection Strategy (Budget-Conscious)

Because free-tier AI APIs are a real constraint, the architecture must not
assume multiple mandatory AI calls per workflow generation. Preferred
flow:

1. One carefully engineered AI call generates the structured workflow.
2. The deterministic Validation Engine checks the result — this costs no
   AI tokens.
3. Only if validation finds fixable issues does an optional second AI
   call (`AIProvider.reviewWorkflow`) attempt a repair.

Do not design any feature that requires 3+ AI calls as its normal path.

## 14. Application Modules

`src/features/` contains one folder per module: `auth`, `workspace`,
`members`, `projects`, `workflow`, `ai`, `documents`, `scheduler`, `dfa`,
`validation`, `visualization`, `dashboard`, `notifications`, `reports`,
`exporter`, `settings`. Each currently has only a `README.md`, an
`index.ts` placeholder, and an empty `components/` folder. Implement
features by filling in these folders — don't create parallel structures
elsewhere.

## 15. Document-Processing Plan

Future pipeline for uploaded reference material (PDF/TXT/DOCX/MD, 3&nbsp;MB
max per file — see `MAX_DOCUMENT_SIZE_BYTES` in `src/types/document.ts`):

```
File → Text Extraction → Cleaning → Chunking →
Relevant Content Selection → AI Prompt → Structured Workflow
```

Types (`UploadedDocument`, `DocumentChunk`) and the Zod schema already
exist in `src/types/document.ts` / `src/schemas/document.schema.ts`.
Extraction/chunking logic itself is not implemented — build it inside
`src/features/documents`, with any framework-agnostic parsing helpers in a
new `src/lib/documents/` module (not yet created).

## 16. Validation Engine

`src/lib/validation/validate-workflow.ts` currently exposes:

- `validateWorkflowSchema(candidate)` — implemented; runs `workflowSchema`
  (Zod) against arbitrary input and returns a `ValidationResult`.
- `validateWorkflowSemantics(workflow)` — **not implemented**, throws.
  This is where circular-dependency detection, skill-mismatch checks,
  overloaded-member checks, impossible-schedule checks, deadline
  violations, and DFA reachability checks belong. See
  `src/types/validation.ts` for the full `ValidationIssueCode` union this
  function is expected to eventually produce.

The validation engine must remain deterministic — never replace it with
an AI guess (see `DEVELOPMENT_RULES.md`).

## 17. Scheduling Engine

Not implemented. Module boundary: `src/features/scheduler`. Should
eventually consider member skills, availability, working hours, workload,
task duration/dependencies, deadlines, priorities, parallelizable tasks,
resource conflicts, and critical path, producing task assignments,
start/end dates, workload distribution, critical path, estimated
completion date, and conflict warnings. Types already exist in
`src/types/schedule.ts`.

## 18. DFA Engine

Not implemented. Module boundary: `src/features/dfa`, with type contracts
already defined in `src/types/dfa.ts` (`DFAState`, `DFATransition`,
`DFADefinition` as a formal 5-tuple, `DFARuntimeState`,
`DFATransitionResult`) and mirrored in `src/schemas/dfa.schema.ts`.

**This must be a real, mathematically correct DFA implementation** —
alphabet generation, state generation, transition function construction,
simulation, invalid-transition detection, accept/reject/dead states,
transition tables, and ideally minimization and future NFA support. Do
not build a component that merely renders boxes and calls it a DFA.

## 19. Visualization Engine

Not implemented. Module boundary: `src/features/visualization`. Planned
modes: interactive workflow graph (React Flow — the primary technology),
flowchart, DFA/state diagram, dependency graph, Gantt chart,
calendar/timeline, team/task view, progress dashboard.

## 20. PDF / Export System

Not implemented. Module boundary: `src/features/exporter`, using jsPDF or
@react-pdf/renderer (both already installed). Planned report contents:
project/workflow info, team members, skills, task assignments, workflow
diagram, schedule, Gantt/timeline, DFA representation + transition table,
risks, bottlenecks, summary.

## 21. Authentication / Workspace Model

Not implemented. Module boundary: `src/features/auth` +
`src/features/workspace`. Given the no-backend constraint, "auth" likely
means a local-first identity model or a thin client-only auth integration
rather than a traditional server session system — this is an open design
question for whoever implements it, not a decision made in this scaffold.

## 22. Member Management

Not implemented. Module boundary: `src/features/members`. Type already
defined in `src/types/member.ts`: name, role, specialties, skills,
experience, availability (working hours + unavailable dates + capacity
fraction), workload, preferred task types, notes.

## 23. Project Management

Not implemented. Module boundary: `src/features/projects`. Type already
defined in `src/types/workspace.ts` (`Project`): status
(draft/active/completed/archived), optional deadline.

## 24. Dashboard

Not implemented. Module boundary: `src/features/dashboard`. Should
eventually summarize workspaces, projects, and workflow health.

## 25. Notifications

Not implemented. Module boundary: `src/features/notifications`. Likely
candidates: deadline warnings, validation issues, schedule conflicts —
all derivable from existing types without new AI calls.

## 26. Security Considerations

- No server-side data store means the main exposure surface is the
  client bundle and any AI provider calls made from the browser.
- API keys must never be committed; `.env.example` documents the expected
  variable names with empty values only.
- If AI calls are made client-side with a user-supplied key, treat that
  key as sensitive local state, never logged or persisted outside what's
  strictly necessary.
- Validate all AI output before it can affect scheduling or execution
  logic — the AI is an untrusted input source, same as user-uploaded
  files.

## 27. Privacy Considerations

- All workspace/member/workflow data stays in the user's browser
  (IndexedDB) unless explicitly sent to an AI provider as part of a
  generation request.
- Uploaded documents may contain sensitive organizational or clinical
  content; document processing (when built) should not persist extracted
  text anywhere outside IndexedDB.
- Be mindful that healthcare-domain usage may involve sensitive
  information even though FlowForge itself is not a covered health
  application — avoid adding any analytics/telemetry that would transmit
  workflow content off-device.

## 28. Vercel Deployment Considerations

- The app must build and run as a standard Next.js App Router project
  deployable to Vercel with no required backend services. Confirm
  `npm run build` succeeds before considering any phase complete.
- Environment variables (AI provider keys) should be configurable via
  Vercel's project settings, matching `.env.example`.
- Avoid Node-only APIs in code that runs in the browser (all Dexie/AI
  calls should be client components or isolated appropriately).

## 29. Free-Tier Constraints

Design around minimal AI usage (see §13). Avoid architecture that assumes
unlimited AI calls, large context windows, or paid-tier-only features
unless explicitly required and documented.

## 30. Development Phases (Recommended Order)

1. Auth/workspace/member CRUD against Dexie (no AI yet).
2. Project CRUD.
3. AI provider: implement one concrete provider (e.g. `GeminiProvider`)
   behind the existing `AIProvider` interface; wire up
   `generateWorkflow()`.
4. Validation engine: implement `validateWorkflowSemantics`.
5. Workflow editor UI (features/workflow) to view/edit AI output post-validation.
6. Scheduling engine.
7. DFA engine (can be built in parallel with scheduling — both consume
   the validated Workflow IR).
8. Visualization engine (React Flow graph first, others after).
9. Reports + PDF export.
10. Document upload pipeline (extraction/chunking) to enrich AI context.
11. Notifications, dashboard polish, settings.

## 31. Feature Dependencies

- Scheduler, DFA engine, and Validation Engine all depend on a finalized
  Workflow IR — don't build them against a shape that's still changing.
- Visualization depends on Workflow IR + (optionally) Schedule + DFA
  output.
- Reports/PDF export depends on Workflow, Schedule, DFA, and Validation
  all being available for a given workflow.
- Document upload only *feeds* the AI call; nothing downstream should
  hard-depend on documents existing.

## 32. Testing Strategy

Not yet established. When implementing logic-heavy modules (validation,
scheduler, DFA), prefer plain unit tests over UI/component tests — these
modules are meant to be deterministic and framework-agnostic, so they
should be testable without rendering React. Test the DFA engine
especially rigorously given its formal-correctness requirement.

## 33. Future Extensions

- NFA support and DFA minimization (already anticipated in `dfa.ts`'s
  design, not required for v1).
- Multiple simultaneous AI providers with automatic fallback.
- Real-time collaborative editing (would be a significant architectural
  change away from local-only IndexedDB — do not assume this lightly).

## 34. Known Limitations

- No backend means no cross-device sync out of the box.
- No auth backend means "accounts" are inherently local-first unless a
  future design deliberately adds a thin external auth provider.
- Free-tier AI constraints mean generation quality is bounded by a single
  (or occasionally two) prompt calls — the Validation Engine is what
  makes this tractable, so it must be taken seriously, not treated as an
  afterthought.

## 35. Things Future Coding Agents MUST NOT Do

- Do not introduce a backend/server database (Firebase, Supabase, Mongo,
  MySQL, Postgres, Prisma, Redis, or any other).
- Do not call an AI provider SDK directly from UI components or feature
  code — always go through `generateWorkflow()`.
- Do not bypass Zod validation on AI output.
- Do not fake or stub out the DFA engine with a visual-only component.
- Do not claim an unfinished feature is implemented, in code comments,
  README, or commit messages.
- Do not rewrite unrelated files or restructure folders without updating
  this document.
- Do not silently change established interfaces (`AIProvider`, the
  Workflow IR types, the Dexie schema) without updating both
  `src/types` and `src/schemas` together and noting the change here.

## 36. Things Future Coding Agents MUST Preserve

- The compiler pipeline: AI proposes → deterministic validation →
  deterministic assignment/scheduling → deterministic DFA →
  visualization/export. Never collapse this into "trust the AI."
- The AI-provider abstraction boundary (`src/lib/ai`).
- Client-only persistence via Dexie (`src/lib/db`).
- TypeScript strict mode and the types↔schemas sync discipline.
- The universal, domain-agnostic framing — no domain-specific hard-coding
  in core logic.
