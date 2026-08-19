"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { workspaceSchema } from "@/schemas/workspace.schema";
import type { Workspace } from "@/types/workspace";

export function useWorkspaces() {
  const workspaces = useLiveQuery(() => db.workspaces.orderBy("createdAt").reverse().toArray(), []);

  const createWorkspace = async (name: string, description?: string): Promise<{ success: boolean; workspace?: Workspace; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const candidate = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const result = workspaceSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || "Invalid workspace input";
        return { success: false, error: firstError };
      }

      await db.workspaces.put(result.data);
      return { success: true, workspace: result.data };
    } catch (err) {
      console.error("Failed to create workspace:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const updateWorkspace = async (
    id: string,
    name: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = await db.workspaces.get(id);
      if (!existing) {
        return { success: false, error: "Workspace not found" };
      }

      const candidate = {
        ...existing,
        name: name.trim(),
        description: description?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      const result = workspaceSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0]?.message || "Invalid workspace input";
        return { success: false, error: firstError };
      }

      await db.workspaces.put(result.data);
      return { success: true };
    } catch (err) {
      console.error("Failed to update workspace:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const deleteWorkspace = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clean up members belonging to this workspace per requirement #2
      await db.members.where("workspaceId").equals(id).delete();
      // Delete the workspace itself
      await db.workspaces.delete(id);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  return {
    workspaces: workspaces ?? [],
    isLoading: workspaces === undefined,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}

export function useWorkspace(workspaceId: string) {
  // undefined = still loading, null = not found, object = found
  const result = useLiveQuery(
    () => (workspaceId ? db.workspaces.get(workspaceId) : undefined),
    [workspaceId]
  );

  return {
    workspace: result ?? null,
    isLoading: result === undefined,
  };
}
