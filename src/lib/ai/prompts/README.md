# AI Prompts

This directory is the designated home for future prompt-engineering work.

Not implemented yet. When this is built, it should contain:

- `generate-workflow.prompt.ts` — the primary, carefully engineered prompt
  that asks the AI for strict, schema-constrained JSON output describing a
  Workflow (see `src/schemas/workflow.schema.ts`).
- `review-workflow.prompt.ts` — the optional second-pass review/fix prompt,
  used only when deterministic validation finds issues worth an AI retry.
- Few-shot examples, kept separate from prompt templates for readability.

Design constraints for future prompts (see PROJECT_ROADMAP.md section
"Prompt-engineering plan" for full detail):

- Must request strict JSON matching `workflowSchema`.
- Must include domain context, member data, skills, availability, deadline,
  constraints, and any selected document context.
- Should include explicit self-check / self-consistency instructions.
- Should minimize token usage — one well-designed call is preferred over
  several small ones.
