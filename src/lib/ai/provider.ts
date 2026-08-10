import type { AIProvider, AIProviderName } from "@/types/ai";

/**
 * Provider registry. Concrete providers (Gemini, Qwen, DeepSeek, OpenAI)
 * are future development phases and are intentionally NOT implemented
 * here — see PROJECT_ROADMAP.md "AI architecture".
 *
 * When a provider is implemented, it should be registered here, e.g.:
 *
 *   import { GeminiProvider } from "./providers/gemini-provider";
 *   registry.gemini = new GeminiProvider();
 *
 * Nothing outside this module should import a concrete provider directly.
 */
const registry: Partial<Record<AIProviderName, AIProvider>> = {};

export function registerProvider(name: AIProviderName, provider: AIProvider): void {
  registry[name] = provider;
}

export function getProvider(name: AIProviderName): AIProvider {
  const provider = registry[name];
  if (!provider) {
    throw new Error(
      `AI provider "${name}" is not implemented yet. This is expected during ` +
        `the scaffold phase — see PROJECT_ROADMAP.md "AI architecture".`
    );
  }
  return provider;
}

export function getConfiguredProviderName(): AIProviderName {
  const configured = process.env.AI_PROVIDER as AIProviderName | undefined;
  return configured ?? "gemini";
}
