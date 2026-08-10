import type { Workflow } from "./workflow";
import type { Member } from "./member";
import type { DocumentChunk } from "./document";

/**
 * AI provider abstraction. The rest of the application must depend only on
 * these contracts, never on a specific vendor SDK. Concrete providers
 * (Gemini, Qwen, DeepSeek, OpenAI, ...) are a future development phase and
 * are NOT implemented here — only the interface they must satisfy.
 *
 * See DEVELOPMENT_RULES.md: "Do not hard-code provider-specific AI logic."
 */

export type AIProviderName = "gemini" | "qwen" | "deepseek" | "openai";

export interface GenerateWorkflowInput {
  workspaceId: string;
  projectId: string;
  /** Natural-language description of the desired process/outcome */
  requirements: string;
  domainHint?: string;
  deadline?: string;
  members: Member[];
  /** Pre-chunked, pre-selected document context, if any */
  documentContext?: DocumentChunk[];
  constraints?: string[];
}

export interface GenerateWorkflowResult {
  /**
   * Raw structured output from the AI, prior to Zod validation. Must be
   * validated by the Validation Engine before being treated as a Workflow.
   */
  rawOutput: unknown;
  provider: AIProviderName;
  model: string;
  /** Populated only after `rawOutput` passes schema validation */
  workflow?: Workflow;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Contract every AI provider implementation must satisfy. Call sites
 * should depend on this interface (via `generateWorkflow` in
 * `src/lib/ai`), never on a provider directly.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult>;
  /**
   * Optional second-pass review/fix call, used sparingly to conserve
   * free-tier API budget (see PROJECT_ROADMAP.md "AI reflection strategy").
   */
  reviewWorkflow?(
    input: GenerateWorkflowInput,
    previousResult: GenerateWorkflowResult,
    issues: string[]
  ): Promise<GenerateWorkflowResult>;
}

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model?: string;
}
