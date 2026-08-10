import type { GenerateWorkflowInput, GenerateWorkflowResult } from "@/types/ai";
import { getConfiguredProviderName, getProvider } from "./provider";

/**
 * Single entry point the rest of the application should call to turn
 * natural-language requirements into a structured workflow proposal.
 *
 * The application must NEVER call a specific AI SDK directly — always go
 * through this function so the provider can be swapped without touching
 * calling code (see DEVELOPMENT_RULES.md).
 *
 * NOT IMPLEMENTED: this currently throws because no concrete provider is
 * registered yet. Implementing this is a future development phase.
 */
export async function generateWorkflow(
  input: GenerateWorkflowInput
): Promise<GenerateWorkflowResult> {
  const provider = getProvider(getConfiguredProviderName());
  return provider.generateWorkflow(input);
}
