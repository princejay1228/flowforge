# FlowForge — Architecture

This document describes system architecture, module relationships, and
data flow. For product vision and phased plan, see `PROJECT_ROADMAP.md`.
For contribution rules, see `DEVELOPMENT_RULES.md`.

## 1. High-Level System Architecture

```mermaid
flowchart TD
    UI["UI (App Router pages + features/*)"]
    STORE["Zustand stores (UI state)"]
    DB[("IndexedDB via Dexie\nsrc/lib/db")]
    AI["AI abstraction\nsrc/lib/ai"]
    PROVIDER["Concrete AI provider\n(not implemented)"]
    VALID["Validation Engine\nsrc/lib/validation"]

    UI --> STORE
    UI --> DB
    UI --> AI
    AI --> PROVIDER
    AI --> VALID
    VALID --> DB
```

Everything the user sees lives under `src/app` (routing) and
`src/features/*` (feature UI + orchestration). Features never talk to
Dexie or an AI SDK directly — they go through `src/lib/db` and
`src/lib/ai` respectively. This indirection is what lets the persistence
layer and AI provider be swapped independently of feature code.

## 2. Module Relationships

```mermaid
flowchart LR
    subgraph features["src/features"]
        F_AUTH[auth]
        F_WS[workspace]
        F_MEM[members]
        F_PROJ[projects]
        F_WF[workflow]
        F_AI[ai]
        F_DOC[documents]
        F_SCHED[scheduler]
        F_DFA[dfa]
        F_VALID[validation]
        F_VIZ[visualization]
        F_DASH[dashboard]
        F_NOTIF[notifications]
        F_REPORT[reports]
        F_EXPORT[exporter]
        F_SET[settings]
    end

    subgraph lib["src/lib"]
        L_DB[db]
        L_AI[ai]
        L_VALID[validation]
    end

    subgraph shared["src/types + src/schemas"]
        TYPES[types]
        SCHEMAS[schemas]
    end

    F_AI --> L_AI
    F_WF --> L_AI
    F_WF --> L_VALID
    F_VALID --> L_VALID
    F_DOC --> L_DB
    F_MEM --> L_DB
    F_PROJ --> L_DB
    F_WS --> L_DB
    F_WF --> L_DB
    F_SCHED --> TYPES
    F_DFA --> TYPES
    F_VIZ --> TYPES
    F_REPORT --> TYPES
    F_EXPORT --> F_REPORT

    L_AI --> SCHEMAS
    L_VALID --> SCHEMAS
    L_DB --> TYPES
    SCHEMAS -.mirrors.-> TYPES
```

Dependency rules:

- `src/features/*` may depend on `src/lib/*`, `src/types`, `src/schemas`,
  `src/hooks`, `src/stores`, `src/components/ui`, and other features'
  **public** `index.ts` exports only — never another feature's internals.
- `src/lib/*` may depend on `src/types` and `src/schemas`, but never on
  `src/features/*` or React (with the narrow exception of
  `src/hooks`, which is explicitly the React-aware layer over `src/lib/db`).
- `src/schemas` may depend on `src/types` (e.g. importing constants like
  `MAX_DOCUMENT_SIZE_BYTES`), never the reverse.
- Concrete AI providers (`src/lib/ai/providers/*`, not yet implemented)
  are only ever imported from `src/lib/ai/provider.ts`.

## 3. Workflow Compilation Pipeline (Data Flow)

```mermaid
sequenceDiagram
    participant User
    participant FeatureUI as features/ai UI
    participant GenWF as lib/ai/generate-workflow
    participant Provider as AIProvider (future)
    participant Validate as lib/validation
    participant DB as lib/db (Dexie)

    User->>FeatureUI: Requirements + members + constraints
    FeatureUI->>GenWF: generateWorkflow(input)
    GenWF->>Provider: provider.generateWorkflow(input)
    Provider-->>GenWF: GenerateWorkflowResult { rawOutput }
    GenWF-->>FeatureUI: GenerateWorkflowResult
    FeatureUI->>Validate: validateWorkflowSchema(rawOutput)
    Validate-->>FeatureUI: ValidationResult
    alt valid
        FeatureUI->>DB: db.workflows.put(workflow)
    else invalid
        FeatureUI->>Provider: (optional) reviewWorkflow(...)
        Provider-->>FeatureUI: revised rawOutput
    end
```

Note: `validateWorkflowSemantics` (circular deps, skill mismatches,
schedule feasibility, DFA reachability) is a **future** step that would
run after schema validation and before the workflow is treated as final —
not yet implemented.

## 4. AI Flow

```mermaid
flowchart TD
    A["features/ai or features/workflow"] --> B["lib/ai/generate-workflow.ts\ngenerateWorkflow(input)"]
    B --> C["lib/ai/provider.ts\ngetProvider(name)"]
    C --> D{"Provider registered?"}
    D -- no --> E["throws — not implemented yet"]
    D -- yes --> F["Concrete AIProvider.generateWorkflow()"]
    F --> G["GenerateWorkflowResult.rawOutput"]
    G --> H["schemas/workflow.schema.ts\nworkflowSchema.safeParse()"]
    H --> I{"Valid?"}
    I -- yes --> J["Treated as Workflow, stored via lib/db"]
    I -- no --> K["Surfaced as ValidationResult.issues\n(optionally trigger reviewWorkflow)"]
```

## 5. Storage Flow

```mermaid
flowchart LR
    Feature["features/* (via hooks)"] --> Hook["src/hooks (e.g. useWorkspaces)"]
    Hook --> Dexie["src/lib/db — Dexie live query"]
    Dexie --> IDB[("Browser IndexedDB")]
```

All reads/writes go through `src/lib/db`'s `db` singleton, ideally wrapped
in a hook (see `src/hooks/use-workspaces.ts` for the established pattern)
so components get reactive live-query updates rather than one-off reads.

## 6. Future Visualization Flow

```mermaid
flowchart TD
    WF["Workflow (validated)"] --> VIZ["features/visualization"]
    SCHED["Schedule (optional)"] --> VIZ
    DFA["DFADefinition (optional)"] --> VIZ
    VIZ --> RF["React Flow graph"]
    VIZ --> GANTT["Gantt / timeline"]
    VIZ --> STATEDIAG["DFA / state diagram"]
    VIZ --> DASH["Progress dashboard"]
```

Not implemented yet. React Flow is the primary technology for the
interactive graph; other views (Gantt, calendar, DFA diagram, dashboard)
are separate rendering modes over the same underlying `Workflow` /
`Schedule` / `DFADefinition` data — they should not require separate data
models.

## 7. DFA Flow

```mermaid
flowchart LR
    WF["Validated Workflow"] --> GEN["features/dfa\n(state/alphabet/transition generation)"]
    GEN --> DEF["DFADefinition\n(Q, Σ, δ, q0, F)"]
    DEF --> SIM["DFA simulation\n(DFARuntimeState + DFATransitionResult)"]
    SIM --> EXEC["Execution / Monitoring\n(advance workflow on completed actions)"]
```

Not implemented. Must be a genuine formal-language implementation per the
5-tuple contract in `src/types/dfa.ts` — see
`PROJECT_ROADMAP.md` §18 and `DEVELOPMENT_RULES.md` for the
non-negotiable correctness requirement.

## 8. Export Flow

```mermaid
flowchart LR
    WF["Workflow"] --> REPORT["features/reports\n(assemble report data)"]
    SCHED["Schedule"] --> REPORT
    DFA["DFADefinition"] --> REPORT
    VALID["ValidationResult"] --> REPORT
    REPORT --> EXPORTER["features/exporter\n(jsPDF / @react-pdf/renderer)"]
    EXPORTER --> PDF[("Downloadable PDF")]
```

Not implemented. `features/exporter` should depend on `features/reports`
for assembled, presentation-ready data rather than reaching into
`Workflow`/`Schedule`/`DFADefinition` directly, to keep report formatting
logic in one place.

## 9. Major Interfaces

- `AIProvider` (`src/types/ai.ts`) — contract every concrete AI provider
  must implement: `generateWorkflow(input)`, optional
  `reviewWorkflow(input, previousResult, issues)`.
- `Workflow` / `Task` / `Dependency` / `Schedule` / `Assignment` /
  `Milestone` (`src/types/*.ts`) — the Workflow IR.
- `DFADefinition` (`src/types/dfa.ts`) — the formal 5-tuple contract for
  the DFA engine.
- `ValidationResult` / `ValidationIssue` (`src/types/validation.ts`) — the
  shape every validation function (schema or semantic) must return.
- `FlowForgeDatabase` (`src/lib/db/database.ts`) — the Dexie schema; the
  single source of persisted application state.

## 10. Dependency Rules Between Modules (Summary)

| From \ To            | features/* | lib/*     | types/schemas | components/ui |
|-----------------------|:----------:|:---------:|:--------------:|:--------------:|
| features/* (own)      | public API only | ✅ | ✅ | ✅ |
| lib/*                 | ❌         | ✅ (siblings) | ✅ | ❌ |
| hooks/*                | ❌         | ✅ (lib/db) | ✅ | ❌ |
| types/*                | ❌         | ❌        | (types→types only) | ❌ |
| schemas/*              | ❌         | ❌        | ✅ (types)     | ❌ |

Never introduce a cycle where `src/lib` depends on `src/features`.
