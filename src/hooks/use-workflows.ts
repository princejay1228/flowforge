"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { workflowSchema } from "@/schemas/workflow.schema";
import type { Workflow } from "@/types/workflow";

export function useWorkflows(projectId: string) {
  const workflows = useLiveQuery(
    () => (projectId ? db.workflows.where("projectId").equals(projectId).toArray() : []),
    [projectId]
  );

  const saveWorkflow = async (workflow: Workflow): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = workflowSchema.safeParse(workflow);
      if (!result.success) {
        return { success: false, error: "Invalid workflow data: " + result.error.message };
      }

      await db.workflows.put(workflow);
      return { success: true };
    } catch (err) {
      console.error("Failed to save workflow:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const deleteWorkflow = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.workflows.delete(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  return {
    workflows: workflows ?? [],
    isLoading: workflows === undefined,
    saveWorkflow,
    deleteWorkflow,
  };
}

export function useWorkflow(workflowId: string) {
  // useLiveQuery returns:
  //   - undefined: still loading / query running
  //   - null/object: query resolved (null means not found in Dexie)
  const result = useLiveQuery(
    () => (workflowId ? db.workflows.get(workflowId) : undefined),
    [workflowId]
  );

  return {
    workflow: result ?? null,
    isLoading: result === undefined,
  };
}
