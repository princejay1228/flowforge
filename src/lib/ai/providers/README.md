# AI Providers

This directory is the designated home for future concrete `AIProvider`
implementations (see `src/types/ai.ts` for the interface).

Not implemented yet. Planned files:

- `gemini-provider.ts`
- `qwen-provider.ts`
- `deepseek-provider.ts`
- `openai-provider.ts`

Each provider implementation must:

1. Implement the `AIProvider` interface exactly.
2. Never be imported directly by UI components or feature modules — only
   `src/lib/ai/generate-workflow.ts` and `src/lib/ai/provider.ts` should
   reference concrete providers, via `registerProvider`.
3. Return `rawOutput` for the caller to validate with
   `src/schemas/workflow.schema.ts`. Providers must not assume their own
   output is already valid.
