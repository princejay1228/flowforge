# FlowForge

A universal AI-powered workflow compiler and management platform. Define
your team and their skills, describe the process you want to run — a
software sprint, a hospital procedure, a kitchen's food-safety checklist,
a construction schedule, anything sequential or branching — and FlowForge
compiles it into a structured, validated, schedulable workflow.

## Vision

Natural language + team data + optional reference documents go in. An AI
model proposes a structured workflow; deterministic frontend logic
validates it, assigns and schedules tasks, builds a formal state-machine
(DFA) representation, and can visualize and export the result. The AI
proposes, the app verifies — FlowForge is never fully dependent on the AI
being right. See `PROJECT_ROADMAP.md` for the full specification.

## Current Status

**Scaffold / Architecture Phase.** This repository currently contains
routing, types, Zod schemas, the IndexedDB data layer, module boundaries,
and documentation — no application features are implemented yet.

## Tech Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS + shadcn/ui-style components
- Zustand (UI state) + Dexie.js (IndexedDB persistence)
- Zod (runtime validation) + React Flow (future visualization)
- date-fns, jsPDF / @react-pdf/renderer, Lucide React

No backend or server-side database — FlowForge runs entirely client-side
and is deployable as a static/serverless app on Vercel.

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in values if/when AI providers are implemented
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development Commands

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # run ESLint
```

## Folder Structure Overview

```
src/
  app/          Routes (currently placeholder pages)
  components/   Shared UI primitives (components/ui) and layout
  features/     One module per product area (auth, workflow, scheduler, dfa, ...)
  lib/          Framework-agnostic core logic (db, ai, validation, utils)
  hooks/        React hooks bridging lib/ to components
  stores/       Zustand UI-state stores
  types/        TypeScript source of truth for domain models
  schemas/      Zod schemas mirroring src/types
  constants/    App-wide constants
  config/       Typed environment variable access
```

See `ARCHITECTURE.md` for module relationships and data flow diagrams.

## Documentation

- [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md) — full product spec,
  architecture, and phased development plan. Start here.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system architecture, module
  dependency rules, and Mermaid data-flow diagrams.
- [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md) — rules for anyone
  (human or AI agent) continuing development on this repository.

## Future Roadmap

Concrete AI provider integration → deterministic validation engine →
workflow editor UI → scheduling engine → DFA/formal-language engine →
visualization (React Flow, Gantt, DFA diagram, dashboard) → reports and
PDF export → document upload pipeline → notifications and settings. See
`PROJECT_ROADMAP.md` §30 for the detailed phase breakdown.
