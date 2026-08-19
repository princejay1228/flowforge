import { AIProvider, AIProviderName, GenerateWorkflowInput, GenerateWorkflowResult } from "@/types/ai";
import { buildGenerateWorkflowPrompt } from "../prompts/generate-workflow.prompt";

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = "gemini";

  async generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult> {
    const apiKey = input.apiKey || this.getApiKeyFromStorage();
    if (!apiKey) {
      throw new Error("Gemini API key is not configured. Please set it in Settings.");
    }

    const prompt = buildGenerateWorkflowPrompt(input);
    const model = "gemini-3.6-flash";

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          responseSchema: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              workspaceId: { type: "STRING" },
              projectId: { type: "STRING" },
              name: { type: "STRING" },
              description: { type: "STRING" },
              domain: { type: "STRING", enum: ["software_development", "healthcare", "food_service", "manufacturing", "construction", "research", "education", "events", "administrative", "emergency_procedures", "equipment_maintenance", "other"] },
              objective: { type: "STRING" },
              tasks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    workflowId: { type: "STRING" },
                    name: { type: "STRING" },
                    description: { type: "STRING" },
                    status: { type: "STRING", enum: ["not_started", "ready", "in_progress", "blocked", "completed", "skipped", "failed"] },
                    priority: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
                    requiredSkills: { type: "ARRAY", items: { type: "STRING" } },
                    estimatedDuration: { type: "NUMBER" },
                    dependsOn: { type: "ARRAY", items: { type: "STRING" } },
                    assignedMemberId: { type: "STRING", nullable: true },
                    classification: { type: "STRING", enum: ["mandatory", "optional"] },
                    createdAt: { type: "STRING" },
                    updatedAt: { type: "STRING" }
                  },
                  required: ["id", "workflowId", "name", "description", "status", "priority", "requiredSkills", "estimatedDuration", "dependsOn", "classification", "createdAt", "updatedAt"]
                }
              },
              dependencies: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    workflowId: { type: "STRING" },
                    sourceTaskId: { type: "STRING" },
                    targetTaskId: { type: "STRING" },
                    dependencyType: { type: "STRING", enum: ["finish_to_start", "start_to_start", "finish_to_finish"] }
                  },
                  required: ["id", "workflowId", "sourceTaskId", "targetTaskId", "dependencyType"]
                }
              },
              milestones: { type: "ARRAY", items: { type: "OBJECT" } },
              assignments: { type: "ARRAY", items: { type: "OBJECT" } },
              constraints: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    description: { type: "STRING" },
                    type: { type: "STRING", enum: ["deadline", "resource", "regulatory", "dependency", "other"] }
                  },
                  required: ["id", "description", "type"]
                }
              },
              risks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    description: { type: "STRING" },
                    severity: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
                    relatedTaskIds: { type: "ARRAY", items: { type: "STRING" } },
                    mitigation: { type: "STRING", nullable: true }
                  },
                  required: ["id", "description", "severity", "relatedTaskIds"]
                }
              },
              metadata: {
                type: "OBJECT",
                properties: {
                  version: { type: "NUMBER" }
                },
                required: ["version"]
              },
              createdAt: { type: "STRING" },
              updatedAt: { type: "STRING" }
            },
            required: ["id", "workspaceId", "projectId", "name", "description", "domain", "objective", "tasks", "dependencies", "milestones", "assignments", "constraints", "risks", "metadata", "createdAt", "updatedAt"]
          }
        }
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API Error: ${res.status} ${res.statusText} - ${err}`);
    }

    const data = await res.json();
    const rawOutputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawOutputText) {
      throw new Error("Invalid response format from Gemini API");
    }

    let rawOutput: any;
    try {
      let cleanText = rawOutputText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      
      console.log("Raw Gemini Output Text:", cleanText);
      rawOutput = JSON.parse(cleanText);
      
      // Defensive unwrapping
      if (Array.isArray(rawOutput) && rawOutput.length > 0) {
        rawOutput = rawOutput[0]; // If it returned an array of workflows
      }
      if (rawOutput && typeof rawOutput === 'object' && !rawOutput.id) {
        if (rawOutput.workflow) rawOutput = rawOutput.workflow;
        else if (rawOutput.data) rawOutput = rawOutput.data;
      }
      console.log("Parsed Gemini Output:", rawOutput);
    } catch (e) {
      console.error("Failed to parse Gemini output:", rawOutputText);
      throw new Error("Failed to parse Gemini API response as JSON: " + (e as Error).message);
    }

    return {
      rawOutput,
      provider: this.name,
      model,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      }
    };
  }

  private getApiKeyFromStorage(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const stored = localStorage.getItem("flowforge_settings");
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.geminiApiKey;
      }
    } catch {
      // Ignore
    }
    return undefined;
  }
}
