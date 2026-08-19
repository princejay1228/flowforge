"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { projectSchema } from "@/schemas/workspace.schema";
import type { Project } from "@/types/workspace";

export type CreateProjectPayload = Omit<Project, "id" | "workspaceId" | "createdAt" | "updatedAt">;
export type UpdateProjectPayload = Partial<Omit<Project, "id" | "workspaceId" | "createdAt" | "updatedAt">>;

export function useProjects(workspaceId: string) {
  const projects = useLiveQuery(
    () => (workspaceId ? db.projects.where("workspaceId").equals(workspaceId).toArray() : []),
    [workspaceId]
  );

  const createProject = async (
    payload: CreateProjectPayload
  ): Promise<{ success: boolean; project?: Project; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const candidate: Project = {
        ...payload,
        id: crypto.randomUUID(),
        workspaceId,
        createdAt: now,
        updatedAt: now,
      };

      const result = projectSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0];
        const errorPath = firstError.path.join(".");
        const errorMsg = `${errorPath ? errorPath + ": " : ""}${firstError.message}`;
        return { success: false, error: errorMsg };
      }

      await db.projects.put(result.data);
      return { success: true, project: result.data };
    } catch (err) {
      console.error("Failed to create project:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const updateProject = async (
    id: string,
    payload: UpdateProjectPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = await db.projects.get(id);
      if (!existing) {
        return { success: false, error: "Project not found" };
      }

      const candidate: Project = {
        ...existing,
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      const result = projectSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0];
        const errorPath = firstError.path.join(".");
        const errorMsg = `${errorPath ? errorPath + ": " : ""}${firstError.message}`;
        return { success: false, error: errorMsg };
      }

      await db.projects.put(result.data);
      return { success: true };
    } catch (err) {
      console.error("Failed to update project:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clean up workflows related to this project
      await db.workflows.where("projectId").equals(id).delete();
      // Delete the project itself
      await db.projects.delete(id);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete project:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  return {
    projects: projects ?? [],
    isLoading: projects === undefined,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId: string) {
  // undefined = still loading, null = not found, object = found
  const result = useLiveQuery(
    () => (projectId ? db.projects.get(projectId) : undefined),
    [projectId]
  );

  return {
    project: result ?? null,
    isLoading: result === undefined,
  };
}
