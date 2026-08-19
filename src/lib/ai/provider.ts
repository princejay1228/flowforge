import type { AIProvider, AIProviderName } from "@/types/ai";
import { GeminiProvider } from "./providers/gemini.provider";

/**
 * Provider registry.
 */
const registry: Partial<Record<AIProviderName, AIProvider>> = {
  gemini: new GeminiProvider()
};

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
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("flowforge_settings");
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.aiProvider) return settings.aiProvider as AIProviderName;
      }
    } catch {
      // Ignore
    }
  }
  const configured = process.env.NEXT_PUBLIC_AI_PROVIDER as AIProviderName | undefined;
  return configured ?? "gemini";
}
