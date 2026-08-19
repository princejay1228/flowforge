import type { AIProviderName } from "@/types/ai";

/**
 * Centralized, typed access to environment configuration. Nothing else in
 * the codebase should read `process.env` directly — see
 * DEVELOPMENT_RULES.md.
 */
export const env = {
  aiProvider: (process.env.AI_PROVIDER as AIProviderName | undefined) ?? "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY,
  qwenApiKey: process.env.QWEN_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
