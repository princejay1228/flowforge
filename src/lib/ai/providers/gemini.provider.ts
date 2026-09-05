import { AIProvider, AIProviderName, GenerateWorkflowInput, GenerateWorkflowResult } from "@/types/ai";
import { buildGenerateWorkflowPrompt } from "../prompts/generate-workflow.prompt";

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = "gemini";
  private static cachedModel: string | null = null;

  async generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult> {
    const rawApiKey = input.apiKey || this.getApiKeyFromStorage();
    if (!rawApiKey || !rawApiKey.trim()) {
      throw new Error("Gemini API key is not configured. Please set it in Settings.");
    }
    const apiKey = rawApiKey.trim();

    const prompt = buildGenerateWorkflowPrompt(input);
    let model = await this.resolveModel(apiKey);

    const requestPayload = {
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
                  estimatedDuration: { type: "NUMBER" },
                  priority: { type: "STRING", enum: ["critical", "high", "medium", "low"] },
                  classification: { type: "STRING", enum: ["mandatory", "optional"] },
                  status: { type: "STRING", enum: ["not_started", "ready", "in_progress", "completed", "failed", "skipped"] },
                  requiredSkills: { type: "ARRAY", items: { type: "STRING" } },
                  dependsOn: { type: "ARRAY", items: { type: "STRING" } },
                  assignedMemberId: { type: "STRING", nullable: true },
                  createdAt: { type: "STRING" },
                  updatedAt: { type: "STRING" }
                },
                required: ["id", "workflowId", "name", "description", "estimatedDuration", "priority", "classification", "status", "requiredSkills", "dependsOn", "createdAt", "updatedAt"]
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
            milestones: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  workflowId: { type: "STRING" },
                  name: { type: "STRING" },
                  targetDate: { type: "STRING" },
                  taskIds: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["id", "workflowId", "name", "targetDate", "taskIds"]
              }
            },
            assignments: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  workflowId: { type: "STRING" },
                  taskId: { type: "STRING" },
                  memberId: { type: "STRING" },
                  reason: { type: "STRING" },
                  confidence: { type: "NUMBER" },
                  createdAt: { type: "STRING" }
                },
                required: ["id", "workflowId", "taskId", "memberId", "reason", "confidence", "createdAt"]
              }
            },
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
    };

    let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    // If model returned 404, fallback to gemini-2.5-flash or gemini-3.6-flash
    if (res.status === 404) {
      const fallbackModels = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-2.0-flash"].filter(m => m !== model);
      for (const fallback of fallbackModels) {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${fallback}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });
        if (res.ok) {
          model = fallback;
          GeminiProvider.cachedModel = fallback;
          break;
        }
      }
    }

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
      
      rawOutput = JSON.parse(cleanText);
      
      // Defensive unwrapping
      if (Array.isArray(rawOutput) && rawOutput.length > 0) {
        rawOutput = rawOutput[0];
      }
      if (rawOutput && typeof rawOutput === 'object' && !rawOutput.id) {
        if (rawOutput.workflow) rawOutput = rawOutput.workflow;
        else if (rawOutput.data) rawOutput = rawOutput.data;
      }

      // Defensive normalization
      rawOutput = this.normalizeOutput(rawOutput, input.workspaceId, input.projectId);
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

  private normalizeOutput(raw: any, workspaceId: string, projectId: string): any {
    if (!raw || typeof raw !== "object") return raw;
    const now = new Date().toISOString();
    const workflowId = raw.id || crypto.randomUUID();

    raw.id = workflowId;
    raw.workspaceId = raw.workspaceId || workspaceId;
    raw.projectId = raw.projectId || projectId;
    raw.name = raw.name || "Compiled Workflow";
    raw.description = raw.description || "";
    raw.domain = raw.domain || "software_development";
    raw.objective = raw.objective || "Deliver project milestones";
    raw.createdAt = raw.createdAt || now;
    raw.updatedAt = raw.updatedAt || now;

    if (!raw.metadata || typeof raw.metadata !== "object") {
      raw.metadata = { version: 1 };
    } else {
      raw.metadata.version = typeof raw.metadata.version === "number" ? raw.metadata.version : 1;
    }

    // Normalize tasks
    if (Array.isArray(raw.tasks)) {
      raw.tasks = raw.tasks.map((t: any, idx: number) => ({
        id: t.id || `task-${workflowId}-${idx + 1}`,
        workflowId: t.workflowId || workflowId,
        name: t.name || `Task ${idx + 1}`,
        description: t.description || "",
        status: ["not_started", "ready", "in_progress", "blocked", "completed", "skipped", "failed"].includes(t.status)
          ? t.status
          : "not_started",
        priority: ["low", "medium", "high", "critical"].includes(t.priority) ? t.priority : "medium",
        requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills : [],
        estimatedDuration: typeof t.estimatedDuration === "number" && t.estimatedDuration > 0 ? t.estimatedDuration : 60,
        dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
        assignedMemberId: t.assignedMemberId || undefined,
        classification: ["mandatory", "optional"].includes(t.classification) ? t.classification : "mandatory",
        createdAt: t.createdAt || now,
        updatedAt: t.updatedAt || now,
      }));
    } else {
      raw.tasks = [];
    }

    // Normalize dependencies
    if (Array.isArray(raw.dependencies)) {
      raw.dependencies = raw.dependencies
        .map((d: any, idx: number) => ({
          id: d.id || `dep-${workflowId}-${idx + 1}`,
          workflowId: d.workflowId || workflowId,
          sourceTaskId: d.sourceTaskId,
          targetTaskId: d.targetTaskId,
          dependencyType: ["finish_to_start", "start_to_start", "finish_to_finish"].includes(d.dependencyType)
            ? d.dependencyType
            : "finish_to_start",
        }))
        .filter((d: any) => d.sourceTaskId && d.targetTaskId);
    } else {
      raw.dependencies = [];
    }

    // Normalize milestones
    if (Array.isArray(raw.milestones)) {
      raw.milestones = raw.milestones.map((m: any, idx: number) => ({
        id: m.id || `ms-${workflowId}-${idx + 1}`,
        workflowId: m.workflowId || workflowId,
        name: m.name || `Milestone ${idx + 1}`,
        targetDate: m.targetDate || now,
        taskIds: Array.isArray(m.taskIds) ? m.taskIds : [],
      }));
    } else {
      raw.milestones = [];
    }

    // Normalize assignments
    if (Array.isArray(raw.assignments)) {
      raw.assignments = raw.assignments.map((a: any, idx: number) => ({
        id: a.id || `asgn-${workflowId}-${idx + 1}`,
        workflowId: a.workflowId || workflowId,
        taskId: a.taskId || (raw.tasks[idx]?.id || `task-${workflowId}-1`),
        memberId: a.memberId || a.assignedMemberId || "unassigned",
        reason: a.reason || "Assigned based on skill profile and project requirements",
        confidence: typeof a.confidence === "number" ? Math.max(0, Math.min(1, a.confidence)) : 0.85,
        createdAt: a.createdAt || now,
      }));
    } else {
      raw.assignments = [];
    }

    // Constraints & risks
    if (!Array.isArray(raw.constraints)) raw.constraints = [];
    raw.constraints = raw.constraints.map((c: any, idx: number) => ({
      id: c.id || `constraint-${workflowId}-${idx + 1}`,
      description: typeof c === "string" ? c : c.description || "",
      type: ["deadline", "resource", "regulatory", "dependency", "other"].includes(c.type) ? c.type : "other",
    }));

    if (!Array.isArray(raw.risks)) raw.risks = [];
    raw.risks = raw.risks.map((r: any, idx: number) => ({
      id: r.id || `risk-${workflowId}-${idx + 1}`,
      description: r.description || "Potential risk",
      severity: ["low", "medium", "high", "critical"].includes(r.severity) ? r.severity : "medium",
      relatedTaskIds: Array.isArray(r.relatedTaskIds) ? r.relatedTaskIds : [],
      mitigation: r.mitigation || undefined,
    }));

    return raw;
  }

  private async resolveModel(apiKey: string): Promise<string> {
    if (GeminiProvider.cachedModel) return GeminiProvider.cachedModel;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = data.models || [];
        const contentModels = models.filter((m) =>
          m.supportedGenerationMethods?.includes("generateContent")
        );

        // Find best match in order of preference
        const preferred =
          contentModels.find((m) => m.name.includes("gemini-2.5-flash")) ||
          contentModels.find((m) => m.name.includes("gemini-3.6-flash")) ||
          contentModels.find((m) => m.name.includes("gemini-3.7-flash")) ||
          contentModels.find((m) => m.name.includes("gemini-2.0-flash")) ||
          contentModels.find((m) => m.name.includes("flash")) ||
          contentModels[0];

        if (preferred) {
          const cleanName = preferred.name.replace(/^models\//, "");
          GeminiProvider.cachedModel = cleanName;
          return cleanName;
        }
      }
    } catch {
      // Fallback to default
    }

    return "gemini-2.5-flash";
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
